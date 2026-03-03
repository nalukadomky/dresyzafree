import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { dbPlayers } from '@/lib/db-players';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; matchId: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    if (user.type === 'team' && user.id !== params.id) return NextResponse.json({ error: 'Nemáte oprávnění' }, { status: 403 });
    const matches = await dbPlayers.matches.getByTeamId(params.id);
    const match = matches.find((m) => m.id === params.matchId);
    if (!match) return NextResponse.json({ error: 'Zápas nenalezen' }, { status: 404 });
    const [scorers, assists, cards] = await Promise.all([
      dbPlayers.matchScorers.getScorers(params.matchId),
      dbPlayers.matchScorers.getAssists(params.matchId),
      dbPlayers.matchScorers.getCards(params.matchId),
    ]);
    return NextResponse.json({ scorers, assists, cards });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error)?.message || 'Chyba' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; matchId: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    if (user.type === 'team' && user.id !== params.id) return NextResponse.json({ error: 'Nemáte oprávnění' }, { status: 403 });
    const body = await request.json();
    const { scorers, assists, cards } = body;
    const s = Array.isArray(scorers) ? scorers : [];
    const a = Array.isArray(assists) ? assists : [];
    const c = Array.isArray(cards) ? cards : [];
    const validScorers = s
      .filter((x: unknown) => x && typeof x === 'object' && typeof (x as { goalOrder?: number }).goalOrder === 'number' && typeof (x as { playerId?: string }).playerId === 'string')
      .map((x: { goalOrder: number; playerId: string }) => ({ goalOrder: x.goalOrder, playerId: x.playerId }));
    const validAssists = a
      .filter((x: unknown) => x && typeof x === 'object' && typeof (x as { assistOrder?: number }).assistOrder === 'number' && typeof (x as { playerId?: string }).playerId === 'string')
      .map((x: { assistOrder: number; playerId: string }) => ({ assistOrder: x.assistOrder, playerId: x.playerId }));
    const validCards = c
      .filter((x: unknown) => x && typeof x === 'object' && typeof (x as { playerId?: string }).playerId === 'string' && ['yellow', 'red'].includes((x as { cardType?: string }).cardType || ''))
      .map((x: { playerId: string; cardType: string }) => ({ playerId: x.playerId, cardType: x.cardType }));
    await dbPlayers.matchScorers.setScorersAndAssists(params.matchId, params.id, validScorers, validAssists);
    await dbPlayers.matchScorers.setCards(params.matchId, params.id, validCards);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error)?.message || 'Chyba při ukládání' },
      { status: 500 }
    );
  }
}
