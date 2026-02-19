import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { dbPlayers } from '@/lib/db-players';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    if (user.type === 'team' && user.id !== params.id) return NextResponse.json({ error: 'Nemáte oprávnění' }, { status: 403 });
    const season = request.nextUrl.searchParams.get('season') || undefined;
    const stats = await dbPlayers.matchScorers.getCanadianScoring(params.id, { season });
    return NextResponse.json({ stats });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error)?.message || 'Chyba' },
      { status: 500 }
    );
  }
}
