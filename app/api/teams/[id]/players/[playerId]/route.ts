import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { dbPlayers } from '@/lib/db-players';

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
