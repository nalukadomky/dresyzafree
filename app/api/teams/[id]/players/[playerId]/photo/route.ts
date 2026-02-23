import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { dbPlayers } from '@/lib/db-players';
import { supabaseAdmin } from '@/lib/supabase-server';

const BUCKET_NAME = 'player-photos';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; playerId: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    if (user.type === 'team' && user.id !== params.id)
      return NextResponse.json({ error: 'Nemáte oprávnění' }, { status: 403 });

    const player = await dbPlayers.players.getById(params.playerId, params.id);
    if (!player) return NextResponse.json({ error: 'Hráč nenalezen' }, { status: 404 });

    if (player.photoUrl && supabaseAdmin) {
      try {
        const url = new URL(player.photoUrl);
        const pathMatch = url.pathname.match(/\/player-photos\/(.+)$/);
        if (pathMatch) {
          await supabaseAdmin.storage.from(BUCKET_NAME).remove([pathMatch[1]]);
        }
      } catch {
        // Storage cleanup failed — continue anyway
      }
    }

    const updated = await dbPlayers.players.clearPhoto(params.playerId, params.id);
    return NextResponse.json({ success: true, player: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Chyba při mazání fotky' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; playerId: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    }
    if (user.type === 'team' && user.id !== params.id) {
      return NextResponse.json({ error: 'Nemáte oprávnění' }, { status: 403 });
    }

    const player = await dbPlayers.players.getById(params.playerId, params.id);
    if (!player) {
      return NextResponse.json({ error: 'Hráč nenalezen' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Žádná fotka nebyla nahrána' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Soubor musí být obrázek (JPG, PNG, WebP)' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Fotka musí být menší než 5 MB' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Nahrávání fotek není nakonfigurováno' },
        { status: 503 }
      );
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${params.id}/${params.playerId}-${Date.now()}.${ext}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: bucketError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (bucketError?.message?.includes('Bucket') || bucketError?.message?.includes('not found')) {
      await supabaseAdmin.storage.createBucket(BUCKET_NAME, { public: true });
      const retry = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(fileName, buffer, { contentType: file.type, upsert: true });
      if (retry.error) {
        console.error('Upload error:', retry.error);
        return NextResponse.json({ error: retry.error.message || 'Chyba při nahrávání' }, { status: 500 });
      }
    } else if (bucketError) {
      console.error('Upload error:', bucketError);
      return NextResponse.json({ error: bucketError.message || 'Chyba při nahrávání' }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const updated = await dbPlayers.players.updatePhoto(params.playerId, params.id, urlData.publicUrl);
    return NextResponse.json({ player: updated, photoUrl: urlData.publicUrl });
  } catch (error: any) {
    console.error('Player photo upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Chyba při nahrávání fotky' },
      { status: 500 }
    );
  }
}
