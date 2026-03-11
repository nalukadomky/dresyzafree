import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { dbPlayers } from '@/lib/db-players';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; matchId: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    }
    if (user.type === 'team' && user.id !== params.id) {
      return NextResponse.json({ error: 'Nemáte oprávnění' }, { status: 403 });
    }
    const { result, goalsFor, goalsAgainst, isHome, opponent, date, startTime } = await request.json();
    const updates: { result?: string; goalsFor?: number; goalsAgainst?: number; isHome?: boolean; opponent?: string; date?: string; startTime?: string } = {};
    if (opponent !== undefined) updates.opponent = opponent;
    if (result !== undefined) updates.result = result;
    if (goalsFor !== undefined) updates.goalsFor = goalsFor;
    if (goalsAgainst !== undefined) updates.goalsAgainst = goalsAgainst;
    if (typeof isHome === 'boolean') updates.isHome = isHome;
    if (typeof date === 'string') updates.date = date;
    if (typeof startTime === 'string') updates.startTime = startTime;
    const match = await dbPlayers.matches.update(params.matchId, params.id, updates);
    if (!match) {
      return NextResponse.json({ error: 'Žádné změny' }, { status: 400 });
    }
    return NextResponse.json({ match });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Chyba při úpravě zápasu' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; matchId: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    }
    if (user.type === 'team' && user.id !== params.id) {
      return NextResponse.json({ error: 'Nemáte oprávnění' }, { status: 403 });
    }
    await dbPlayers.matches.delete(params.matchId, params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Chyba při mazání zápasu' },
      { status: 500 }
    );
  }
}
