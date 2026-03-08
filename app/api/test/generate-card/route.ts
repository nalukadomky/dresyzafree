import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// Pro generování obrázků: preferuj klíč z Google Cloud Console (Gemini/Imagen zapnuté tam)
const GEMINI_API_KEY =
  process.env.GEMINI_IMAGE_API_KEY ||
  process.env.GOOGLE_AI_STUDIO_API_KEY ||
  process.env.GOOGLE_GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const BUCKET = 'generated-player-cards';

async function imageUrlToBase64(url: string): Promise<{ data: string; mime: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const mime = res.headers.get('content-type') || 'image/jpeg';
  return {
    data: Buffer.from(buffer).toString('base64'),
    mime,
  };
}

async function ensureBucket(name: string) {
  if (!supabaseAdmin) return;
  const { data } = await supabaseAdmin.storage.listBuckets();
  if (!data?.find((b) => b.name === name)) {
    await supabaseAdmin.storage.createBucket(name, { public: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API klíč není nastaven (GEMINI_IMAGE_API_KEY nebo GOOGLE_AI_STUDIO_API_KEY v .env.local)' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { playerPhotoUrl, jerseyPhotoUrl, playerName } = body;

    if (!playerPhotoUrl || !jerseyPhotoUrl) {
      return NextResponse.json(
        { error: 'Chybí fotka hráče nebo dresu' },
        { status: 400 }
      );
    }

    // Fetch both images and convert to base64
    const [playerImg, jerseyImg] = await Promise.all([
      imageUrlToBase64(playerPhotoUrl),
      imageUrlToBase64(jerseyPhotoUrl),
    ]);

    // Build the prompt
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

    // Call Gemini API
    const geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: playerImg.mime,
                  data: playerImg.data,
                },
              },
              {
                inline_data: {
                  mime_type: jerseyImg.mime,
                  data: jerseyImg.data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
      signal: AbortSignal.timeout(120_000), // 2 minute timeout
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errText);

      if (geminiResponse.status === 429) {
        return NextResponse.json(
          { error: 'Příliš mnoho požadavků, zkuste za chvíli' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `Gemini API chyba: ${geminiResponse.status}` },
        { status: 502 }
      );
    }

    const geminiData = await geminiResponse.json();

    // Find the generated image in the response
    const candidate = geminiData.candidates?.[0];
    if (!candidate) {
      console.error('No candidates in Gemini response:', JSON.stringify(geminiData).slice(0, 500));
      return NextResponse.json(
        { error: 'AI nevygenerovalo žádný výsledek' },
        { status: 422 }
      );
    }

    const parts = candidate.content?.parts || [];
    const imagePart = parts.find(
      (p: any) => p.inline_data?.mime_type?.startsWith('image/')
    );

    if (!imagePart) {
      // Return text response for debugging
      const textPart = parts.find((p: any) => p.text);
      console.error('No image in response. Text:', textPart?.text?.slice(0, 300));
      return NextResponse.json(
        {
          error: 'AI nevygenerovalo obrázek. Zkuste jinou fotku.',
          detail: textPart?.text?.slice(0, 200),
        },
        { status: 422 }
      );
    }

    const imageBuffer = Buffer.from(imagePart.inline_data.data, 'base64');
    const mimeType = imagePart.inline_data.mime_type;
    const ext = mimeType.includes('png') ? 'png' : 'jpg';

    // Upload to Supabase
    if (supabaseAdmin) {
      await ensureBucket(BUCKET);
      const fileName = `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(fileName, imageBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload generated card error:', uploadError);
      } else {
        const { data: urlData } = supabaseAdmin.storage
          .from(BUCKET)
          .getPublicUrl(fileName);

        return NextResponse.json({ cardUrl: urlData.publicUrl });
      }
    }

    // Fallback: return base64 if Supabase upload fails
    return NextResponse.json({
      cardUrl: `data:${mimeType};base64,${imagePart.inline_data.data}`,
    });
  } catch (error: any) {
    console.error('Generate card error:', error);

    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Generování trvalo příliš dlouho, zkuste znovu' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Chyba při generování karty' },
      { status: 500 }
    );
  }
}
