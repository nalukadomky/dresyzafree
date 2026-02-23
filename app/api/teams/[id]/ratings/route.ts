import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { db } from '@/lib/db-supabase';
import { dbPlayers } from '@/lib/db-players';

function isMatchPlayed(date: string, startTime?: string): boolean {
  if (!startTime || !/^\d{1,2}:\d{2}$/.test(startTime.trim())) return false;
  const matchDateTime = new Date(`${date}T${startTime.trim()}:00`);
  return !Number.isNaN(matchDateTime.getTime()) && matchDateTime.getTime() <= Date.now();
}

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
    const team = await db.teams.getById(params.id);
    const coachPlayerId = team?.coachPlayerId ?? null;
    const playerId = request.nextUrl.searchParams.get('playerId') || undefined;

    // Per-player match ratings
    if (playerId) {
      const playerRatings = await dbPlayers.ratings.getPlayerRatings(params.id, playerId, coachPlayerId);
      return NextResponse.json({ playerRatings });
    }

    const matchId = request.nextUrl.searchParams.get('matchId') || undefined;
    const season = request.nextUrl.searchParams.get('season') || undefined;
    const leaderboard = await dbPlayers.ratings.getLeaderboard(params.id, coachPlayerId, {
      matchId: matchId || undefined,
      season: season || undefined,
    });
    return NextResponse.json({ leaderboard });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Chyba při načítání žebříčku' },
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
    const body = await request.json();
    const { matchId, voterPlayerId, ratings } = body;
    if (!matchId || !voterPlayerId || !Array.isArray(ratings)) {
      return NextResponse.json(
        { error: 'Chybí matchId, voterPlayerId nebo ratings' },
        { status: 400 }
      );
    }

    const matches = await dbPlayers.matches.getByTeamId(params.id);
    const selectedMatch = matches.find((m) => m.id === matchId);
    if (!selectedMatch) {
      return NextResponse.json({ error: 'Zápas neexistuje.' }, { status: 400 });
    }
    if (!isMatchPlayed(selectedMatch.date, selectedMatch.startTime)) {
      return NextResponse.json(
        { error: 'Hlasovat lze pouze pro zápasy, které už byly odehrané (datum a čas).' },
        { status: 400 }
      );
    }

    const formatted = ratings.map(
      (r: any) => ({
        ratedPlayerId: r.ratedPlayerId,
        percentage: Number(r.percentage) || 0,
      })
    );
    await dbPlayers.ratings.submit(matchId, voterPlayerId, formatted);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Chyba při ukládání hodnocení' },
      { status: 500 }
    );
  }
}
