import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { db } from '@/lib/db-supabase';
import { dbPlayers } from '@/lib/db-players';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    }
    if (user.type === 'team' && user.id !== params.id) {
      return NextResponse.json({ error: 'Nemáte oprávnění' }, { status: 403 });
    }
    const [matches, team] = await Promise.all([
      dbPlayers.matches.getByTeamId(params.id),
      db.teams.getById(params.id),
    ]);
    const coachPlayerId = team?.coachPlayerId ?? null;
    const matchIds = matches.map((m) => m.id);
    const playerOfMatchMap =
      matchIds.length > 0
        ? await dbPlayers.ratings.getPlayerOfMatchForMatches(params.id, coachPlayerId, matchIds)
        : {};
    const matchesWithPom = matches.map((m) => ({
      ...m,
      playerOfMatch: playerOfMatchMap[m.id] ?? null,
    }));
    return NextResponse.json({ matches: matchesWithPom });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Chyba při načítání zápasů' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    }
    if (user.type === 'team' && user.id !== params.id) {
      return NextResponse.json({ error: 'Nemáte oprávnění' }, { status: 403 });
    }
    const { date, opponent, name, result, goalsFor, goalsAgainst, startTime, isHome } = await request.json();
    if (!date) {
      return NextResponse.json({ error: 'Datum je povinné' }, { status: 400 });
    }
    const match = await dbPlayers.matches.add(
      params.id,
      date,
      opponent,
      name,
      result,
      goalsFor,
      goalsAgainst,
      startTime,
      typeof isHome === 'boolean' ? isHome : undefined
    );
    return NextResponse.json({ match });
  } catch (error: any) {
    console.error('[POST /api/teams/[id]/matches]', error);
    return NextResponse.json(
      { error: error?.message || 'Chyba při přidávání zápasu' },
      { status: 500 }
    );
  }
}
