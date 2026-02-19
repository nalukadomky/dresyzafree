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
    let players = await dbPlayers.players.getByTeamId(params.id);
    const team = await db.teams.getById(params.id);
    const coachPlayerId = team?.coachPlayerId ?? null;
    if (coachPlayerId && !players.some((p) => p.id === coachPlayerId)) {
      const coach = await dbPlayers.players.getById(coachPlayerId, params.id);
      if (coach) {
        players = [coach, ...players];
      }
    }
    return NextResponse.json({ players });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Chyba při načítání hráčů' },
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
    const { name } = await request.json();
    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Jméno je povinné' }, { status: 400 });
    }
    const player = await dbPlayers.players.add(params.id, String(name).trim());
    return NextResponse.json({ player });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Chyba při přidávání hráče' },
      { status: 500 }
    );
  }
}
