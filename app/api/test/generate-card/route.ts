import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { GoogleAuth } from 'google-auth-library';

// --- Config ---
const PROJECT_ID = process.env.GCLOUD_PROJECT_ID || 'project-0071a01e-cb50-475a-aeb';
const REGION = process.env.GCLOUD_REGION || 'us-central1';
const BUCKET = 'generated-player-cards';

// Preferovaná strategie: AI Studio API klíč (pokud je pay-as-you-go),
// jinak fallback na Vertex AI (Google Cloud billing, $300 kreditů)
const AI_STUDIO_KEY =
  process.env.GEMINI_IMAGE_API_KEY ||
  process.env.GOOGLE_AI_STUDIO_API_KEY ||
  process.env.GOOGLE_GEMINI_API_KEY;

const AI_STUDIO_MODEL =
  process.env.GEMINI_IMAGE_MODEL || 'nano-banana-pro-preview';

// --- Helpers ---

async function imageUrlToBase64(url: string): Promise<{ data: string; mime: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const mime = res.headers.get('content-type') || 'image/jpeg';
  return { data: Buffer.from(buffer).toString('base64'), mime };
}

async function ensureBucket(name: string) {
  if (!supabaseAdmin) return;
  const { data } = await supabaseAdmin.storage.listBuckets();
  if (!data?.find((b) => b.name === name)) {
    await supabaseAdmin.storage.createBucket(name, { public: true });
  }
}

let _auth: GoogleAuth | null = null;
function getGoogleAuth() {
  if (!_auth) {
    _auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  }
  return _auth;
}

async function getAccessToken(): Promise<string> {
  const auth = getGoogleAuth();
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error('Failed to get access token');
  return token.token;
}

// --- Strategy 1: AI Studio (generativelanguage.googleapis.com) ---
// Funguje jen s pay-as-you-go billing. Pokud vrátí 429, přepneme na Vertex AI.

async function tryAiStudio(
  playerImg: { data: string; mime: string },
  jerseyImg: { data: string; mime: string },
  prompt: string,
): Promise<{ imageBuffer: Buffer; mimeType: string } | null> {
  if (!AI_STUDIO_KEY) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI_STUDIO_MODEL}:generateContent?key=${AI_STUDIO_KEY}`;
  console.log(`Generate card: trying AI Studio (${AI_STUDIO_MODEL})...`);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: playerImg.mime, data: playerImg.data } },
          { inline_data: { mime_type: jerseyImg.mime, data: jerseyImg.data } },
        ],
      }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`AI Studio error (${response.status}):`, errText.slice(0, 200));
    // 429/403 = quota/permission → fallback to Vertex AI
    if (response.status === 429 || response.status === 403) return null;
    throw new Error(`AI Studio: ${response.status} — ${errText.slice(0, 150)}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p: any) => p.inline_data?.mime_type?.startsWith('image/'));
  if (!imagePart) {
    const textPart = parts.find((p: any) => p.text);
    console.error('AI Studio: no image part. Text:', textPart?.text?.slice(0, 200));
    return null;
  }

  console.log('AI Studio: image generated successfully');
  return {
    imageBuffer: Buffer.from(imagePart.inline_data.data, 'base64'),
    mimeType: imagePart.inline_data.mime_type,
  };
}

// --- Strategy 2: Vertex AI (Gemini popis + Imagen generování) ---
// Dvou-krokový přístup: Gemini analyzuje obrázky → Imagen generuje kartu.
// Využívá Google Cloud billing ($300 kreditů).

async function tryVertexAI(
  playerImg: { data: string; mime: string },
  jerseyImg: { data: string; mime: string },
  playerName: string,
): Promise<{ imageBuffer: Buffer; mimeType: string } | null> {
  let token: string;
  try {
    token = await getAccessToken();
  } catch (e) {
    console.error('Vertex AI: failed to get access token:', e);
    return null;
  }

  const baseUrl = `https://${REGION}-aiplatform.googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models`;

  // Step 1: Gemini analyzuje oba obrázky a vytvoří detailní prompt pro Imagen
  console.log('Vertex AI: Step 1 — Gemini analyzing images...');
  const nameClause = playerName ? ` The player's name is ${playerName}.` : '';

  const analysisResponse = await fetch(`${baseUrl}/gemini-2.5-flash:generateContent`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          {
            text: `You are a professional image description writer. I'm providing two images:

IMAGE 1: A portrait photograph of a football (soccer) player.
IMAGE 2: A photograph of a team jersey/uniform.

Analyze both images carefully and write a SINGLE detailed image generation prompt (in English) that describes:
- The player's appearance: gender, approximate age, ethnicity/skin tone, hair color and style, facial features, body build
- The jersey: exact colors, pattern, stripes, collar style, sponsor logos and their placement, badge/crest details
- Desired output: Professional sports card portrait photo, player from waist up, slightly turned toward camera, wearing the jersey from Image 2, clean blurred stadium or gradient background, studio-quality lighting, sharp focus, photorealistic, 3:4 portrait aspect ratio${nameClause}

Write ONLY the prompt, nothing else. Be extremely specific about colors (use hex codes if possible), patterns, and details. The prompt should be 150-250 words.`
          },
          { inlineData: { mimeType: playerImg.mime, data: playerImg.data } },
          { inlineData: { mimeType: jerseyImg.mime, data: jerseyImg.data } },
        ],
      }],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!analysisResponse.ok) {
    const err = await analysisResponse.text();
    console.error('Vertex AI Gemini error:', analysisResponse.status, err.slice(0, 200));
    throw new Error(`Vertex AI Gemini: ${analysisResponse.status}`);
  }

  const analysisData = await analysisResponse.json();
  const imagenPrompt = analysisData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!imagenPrompt) {
    console.error('Vertex AI: no prompt from Gemini', JSON.stringify(analysisData).slice(0, 300));
    throw new Error('Gemini nevygenerovalo popis obrázku');
  }

  console.log('Vertex AI: Gemini prompt ready (', imagenPrompt.length, 'chars). Step 2 — Imagen generating...');

  // Step 2: Imagen 3 generuje obrázek
  // Imagen predict endpoint používá v1 (ne v1beta1)
  const imagenUrl = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/imagen-3.0-generate-002:predict`;

  const imagenResponse = await fetch(imagenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [{ prompt: imagenPrompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '3:4',
        personGeneration: 'allow_all',
      },
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!imagenResponse.ok) {
    const err = await imagenResponse.text();
    console.error('Vertex AI Imagen error:', imagenResponse.status, err.slice(0, 200));
    throw new Error(`Imagen 3: ${imagenResponse.status} — ${err.slice(0, 100)}`);
  }

  const imagenData = await imagenResponse.json();
  const prediction = imagenData.predictions?.[0];
  if (!prediction?.bytesBase64Encoded) {
    console.error('Vertex AI: no image from Imagen', JSON.stringify(imagenData).slice(0, 300));
    throw new Error('Imagen nevygenerovalo obrázek');
  }

  console.log('Vertex AI: image generated successfully');
  return {
    imageBuffer: Buffer.from(prediction.bytesBase64Encoded, 'base64'),
    mimeType: prediction.mimeType || 'image/png',
  };
}

// --- Main handler ---

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerPhotoUrl, jerseyPhotoUrl, playerName } = body;

    if (!playerPhotoUrl || !jerseyPhotoUrl) {
      return NextResponse.json({ error: 'Chybí fotka hráče nebo dresu' }, { status: 400 });
    }

    // Fetch both images as base64
    let playerImg: { data: string; mime: string };
    let jerseyImg: { data: string; mime: string };
    try {
      [playerImg, jerseyImg] = await Promise.all([
        imageUrlToBase64(playerPhotoUrl),
        imageUrlToBase64(jerseyPhotoUrl),
      ]);
    } catch (imgErr: any) {
      const m = imgErr?.message ?? String(imgErr ?? '');
      console.error('Generate card: fetch images failed', m);
      return NextResponse.json({
        error: m.includes('fetch') || m.includes('ECONN')
          ? 'Server nemohl načíst obrázky z úložiště.'
          : m,
      }, { status: 502 });
    }

    // Build prompt for AI Studio (direct image generation)
    const nameClause = playerName ? ` Hráč se jmenuje ${playerName}.` : '';
    const prompt = `Create a professional football (soccer) player card image. I am providing two reference images:

IMAGE 1: A portrait photograph of the player — use this for the player's exact face, hair, skin tone, and body proportions.

IMAGE 2: A photograph of the team jersey/uniform — use this for the exact jersey design, colors, sponsor logos, and details.

Generate a new high-quality photorealistic image that shows the player from Image 1 wearing the jersey from Image 2. Requirements:
- Portrait orientation, 3:4 aspect ratio (width:height)
- Player visible from waist up, centered, facing slightly toward camera
- Professional sports card style photography
- Clean, slightly blurred gradient or stadium background
- Natural, studio-quality lighting
- The player's facial features must be preserved exactly from Image 1
- The jersey must match Image 2 exactly (colors, pattern, logos, sponsor)
- Sharp details, high resolution look${nameClause}`;

    // Try AI Studio first (best quality — uses both input images natively)
    // Falls back to Vertex AI if AI Studio returns 429/403
    let result: { imageBuffer: Buffer; mimeType: string } | null = null;
    let strategy = '';

    try {
      result = await tryAiStudio(playerImg, jerseyImg, prompt);
      if (result) strategy = 'AI Studio';
    } catch (e: any) {
      console.error('AI Studio failed:', e.message);
    }

    if (!result) {
      try {
        result = await tryVertexAI(playerImg, jerseyImg, playerName || '');
        if (result) strategy = 'Vertex AI (Gemini + Imagen)';
      } catch (e: any) {
        console.error('Vertex AI failed:', e.message);
        return NextResponse.json({
          error: `Generování selhalo: ${e.message}. Zapněte pay-as-you-go na aistudio.google.com/app/plan pro nejlepší kvalitu.`,
        }, { status: 502 });
      }
    }

    if (!result) {
      return NextResponse.json({
        error: 'Žádná strategie generování nefunguje. Zapněte billing na aistudio.google.com/app/plan nebo ověřte gcloud auth.',
      }, { status: 502 });
    }

    console.log(`Generate card: success via ${strategy}`);
    const ext = result.mimeType.includes('png') ? 'png' : 'jpg';

    // Upload to Supabase
    if (supabaseAdmin) {
      await ensureBucket(BUCKET);
      const fileName = `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(fileName, result.imageBuffer, {
          contentType: result.mimeType,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload generated card error:', uploadError);
      } else {
        const { data: urlData } = supabaseAdmin.storage
          .from(BUCKET)
          .getPublicUrl(fileName);
        return NextResponse.json({ cardUrl: urlData.publicUrl, strategy });
      }
    }

    // Fallback: return base64
    return NextResponse.json({
      cardUrl: `data:${result.mimeType};base64,${result.imageBuffer.toString('base64')}`,
      strategy,
    });
  } catch (error: any) {
    const msg = error?.message ?? String(error ?? 'Chyba při generování karty');
    console.error('Generate card error:', msg, error);

    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Generování trvalo příliš dlouho, zkuste znovu' },
        { status: 504 }
      );
    }

    return NextResponse.json({
      error: msg.includes('fetch') || msg.includes('ECONN')
        ? 'Server se nemohl připojit. Zkontrolujte síťový přístup.'
        : msg,
    }, { status: 500 });
  }
}
