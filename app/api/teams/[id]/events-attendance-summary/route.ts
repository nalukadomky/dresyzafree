import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { dbEvents } from '@/lib/db-events';

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
    const ids = request.nextUrl.searchParams.get('ids')?.split(',').filter(Boolean) || [];
    const summary = await dbEvents.attendance.getSummaryForEvents(params.id, ids);
    return NextResponse.json({ summary });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error)?.message || 'Chyba při načítání' },
      { status: 500 }
    );
  }
}
