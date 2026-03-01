import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { dbFanVotes } from '@/lib/db-fan-votes';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    if (user.type === 'team' && user.id !== params.id) return NextResponse.json({ error: 'Nemáte oprávnění' }, { status: 403 });

    const data = await dbFanVotes.getResultsForTeam(params.id);
    return NextResponse.json({ matches: data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error)?.message || 'Chyba' },
      { status: 500 }
    );
  }
}
