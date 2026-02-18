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
    const matchId = request.nextUrl.searchParams.get('matchId');
    const voterPlayerId = request.nextUrl.searchParams.get('voterPlayerId');
    if (!matchId || !voterPlayerId) {
      return NextResponse.json({ error: 'Chybí matchId nebo voterPlayerId' }, { status: 400 });
    }
    const hasVoted = await dbPlayers.ratings.hasVoted(matchId, voterPlayerId);
    return NextResponse.json({ hasVoted });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Chyba' },
      { status: 500 }
    );
  }
}
