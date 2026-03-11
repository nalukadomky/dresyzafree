import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { dbEvents, canEditDashboardAttendance, isAttendanceFinalized } from '@/lib/db-events';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; eventId: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    }
    if (user.type === 'team' && user.id !== params.id) {
      return NextResponse.json({ error: 'Nemáte oprávnění' }, { status: 403 });
    }
    const event = await dbEvents.events.getById(params.eventId, params.id);
    if (!event) {
      return NextResponse.json({ error: 'Událost nenalezena' }, { status: 404 });
    }
    const finalized = isAttendanceFinalized(event);
    const canEdit = canEditDashboardAttendance(event) && !finalized;
    const attendance = await dbEvents.attendance.getByEventId(params.eventId);
    return NextResponse.json({
      event: { ...event, attendanceClosed: !canEdit, attendanceFinalized: finalized },
      attendance,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error)?.message || 'Chyba při načítání události' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; eventId: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    }
    if (user.type === 'team' && user.id !== params.id) {
      return NextResponse.json({ error: 'Nemáte oprávnění' }, { status: 403 });
    }
    const { opponent, date, startTime, location } = await request.json();
    const updates: { opponent?: string; date?: string; startTime?: string; location?: string } = {};
    if (opponent !== undefined) updates.opponent = opponent;
    if (typeof date === 'string') updates.date = date;
    if (typeof startTime === 'string') updates.startTime = startTime;
    if (typeof location === 'string') updates.location = location;
    const event = await dbEvents.events.update(params.eventId, params.id, updates);
    if (!event) {
      return NextResponse.json({ error: 'Žádné změny' }, { status: 400 });
    }
    return NextResponse.json({ event });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error)?.message || 'Chyba při úpravě události' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; eventId: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    }
    if (user.type === 'team' && user.id !== params.id) {
      return NextResponse.json({ error: 'Nemáte oprávnění' }, { status: 403 });
    }
    await dbEvents.events.delete(params.eventId, params.id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error)?.message || 'Chyba při mazání události' },
      { status: 500 }
    );
  }
}
