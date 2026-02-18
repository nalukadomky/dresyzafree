import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { supabaseAdmin } from '@/lib/supabase-server';

const BUCKET_NAME = 'team-logos';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Žádný soubor nebyl nahrán' },
        { status: 400 }
      );
    }

    // Validace typu souboru
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Soubor musí být obrázek' },
        { status: 400 }
      );
    }

    // Validace velikosti (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Obrázek musí být menší než 5MB' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'png';
    const fileName = `team-${timestamp}-${randomString}.${fileExtension}`;

    // Supabase Storage (funguje na Vercelu)
    if (supabaseAdmin) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      let uploadResult = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      // Pokud bucket neexistuje, zkusíme ho vytvořit a znovu nahrát
      if (uploadResult.error?.message?.includes('Bucket') || uploadResult.error?.message?.includes('not found')) {
        await supabaseAdmin.storage.createBucket(BUCKET_NAME, { public: true });
        uploadResult = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false,
          });
      }

      if (uploadResult.error) {
        console.error('Supabase Storage upload error:', uploadResult.error);
        return NextResponse.json(
          { error: uploadResult.error.message || 'Chyba při nahrávání do úložiště' },
          { status: 500 }
        );
      }

      const { data: urlData } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(uploadResult.data.path);

      return NextResponse.json({ logoPath: urlData.publicUrl });
    }

    // Fallback: lokální souborový systém (pouze pro vývoj)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), 'public', 'teams');
    const filePath = path.join(uploadDir, fileName);
    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, buffer);
    return NextResponse.json({ logoPath: `/teams/${fileName}` });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Chyba při nahrávání obrázku' },
      { status: 500 }
    );
  }
}

