import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

async function ensureBucket(name: string) {
  if (!supabaseAdmin) return;
  const { data } = await supabaseAdmin.storage.listBuckets();
  if (!data?.find((b) => b.name === name)) {
    await supabaseAdmin.storage.createBucket(name, { public: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase není nakonfigurováno' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'player' | 'jersey'

    if (!file) {
      return NextResponse.json({ error: 'Žádný soubor' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Soubor musí být obrázek' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Max velikost je 5 MB' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const buffer = Buffer.from(await file.arrayBuffer());

    let bucket: string;
    let filePath: string;

    if (type === 'jersey') {
      bucket = 'team-jersey-templates';
      filePath = `default-jersey.${ext}`;
    } else {
      bucket = 'player-photos';
      filePath = `test/player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    }

    await ensureBucket(bucket);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: uploadError.message || 'Chyba při nahrávání' },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error: any) {
    console.error('Test upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Chyba serveru' },
      { status: 500 }
    );
  }
}
