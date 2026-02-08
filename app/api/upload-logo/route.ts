import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

    // Vytvoření unikátního názvu souboru
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'png';
    const fileName = `team-${timestamp}-${randomString}.${fileExtension}`;

    // Cesta k uložení
    const uploadDir = path.join(process.cwd(), 'public', 'teams');
    const filePath = path.join(uploadDir, fileName);

    // Vytvoření složky, pokud neexistuje
    await mkdir(uploadDir, { recursive: true });

    // Uložení souboru
    await writeFile(filePath, buffer);

    // Vrácení cesty k souboru (relativní k public složce)
    const logoPath = `/teams/${fileName}`;

    return NextResponse.json({ logoPath });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Chyba při nahrávání obrázku' },
      { status: 500 }
    );
  }
}

