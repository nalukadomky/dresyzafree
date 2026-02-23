import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { dbPlayers } from '@/lib/db-players';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; playerId: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    if (user.type === 'team' && user.id !== params.id)
      return NextResponse.json({ error: 'Nemáte oprávnění' }, { status: 403 });

    const body = await request.json();
    const jn = body.jerseyNumber;
    const jerseyNumber = jn === '' || jn === null || jn === undefined ? null : Number(jn);

    if (jerseyNumber !== null && (!Number.isInteger(jerseyNumber) || jerseyNumber < 1 || jerseyNumber > 99)) {
      return NextResponse.json({ error: 'Číslo dresu musí být 1-99' }, { status: 400 });
    }

    const updated = await dbPlayers.players.updateJerseyNumber(params.playerId, params.id, jerseyNumber);
    return NextResponse.json({ player: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Chyba při aktualizaci hráče' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    await dbPlayers.players.delete(params.playerId, params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Chyba při mazání hráče' },
      { status: 500 }
    );
  }
}
