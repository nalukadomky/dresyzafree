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
    const leaderboard = await dbPlayers.ratings.getLeaderboard(params.id);
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
