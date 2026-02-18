import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
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
    const matches = await dbPlayers.matches.getByTeamId(params.id);
    return NextResponse.json({ matches });
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
    const { date, opponent, name, result, goalsFor, goalsAgainst, startTime } = await request.json();
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
      startTime
    );
    return NextResponse.json({ match });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Chyba při přidávání zápasu' },
      { status: 500 }
    );
  }
}
