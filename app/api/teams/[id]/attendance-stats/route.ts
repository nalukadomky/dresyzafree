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
    const stats = await dbEvents.getAttendanceVsPerformance(params.id);
    return NextResponse.json({ stats });
  } catch (error: unknown) {
    const msg = (error as Error)?.message || '';
    if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('events')) {
      return NextResponse.json(
        { error: 'Tabulky pro kalendář neexistují. Spusťte v Supabase SQL Editor skript: scripts/setup-training-attendance.sql' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: msg || 'Chyba při načítání statistik' },
      { status: 500 }
    );
  }
}
