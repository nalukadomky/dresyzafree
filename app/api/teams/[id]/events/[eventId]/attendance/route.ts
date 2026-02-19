import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { dbEvents, canEditDashboardAttendance, isAttendanceFinalized } from '@/lib/db-events';

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
    const event = await dbEvents.events.getById(params.eventId, params.id);
    if (!event) {
      return NextResponse.json({ error: 'Událost nenalezena' }, { status: 404 });
    }
    if (isAttendanceFinalized(event)) {
      return NextResponse.json(
        { error: 'Docházka byla již odeslána a nelze ji měnit.' },
        { status: 403 }
      );
    }
    if (!canEditDashboardAttendance(event)) {
      return NextResponse.json(
        { error: 'Docházku lze zadat až 15 minut před začátkem události.' },
        { status: 403 }
      );
    }
    const { attendance } = await request.json();
    if (!Array.isArray(attendance)) {
      return NextResponse.json({ error: 'Neplatný formát' }, { status: 400 });
    }
    const valid = attendance.every(
      (a) =>
        typeof a === 'object' &&
        a !== null &&
        typeof a.playerId === 'string' &&
        typeof a.attended === 'boolean'
    );
    if (!valid) {
      return NextResponse.json({ error: 'Neplatný formát účasti' }, { status: 400 });
    }
    await dbEvents.attendance.setBulkExact(
      params.eventId,
      attendance.map((a) => ({
        playerId: a.playerId,
        attended: a.attended,
        absenceReason: a.absenceReason,
      }))
    );
    await dbEvents.events.finalizeAttendance(params.eventId, params.id);
    const updated = await dbEvents.attendance.getByEventId(params.eventId);
    return NextResponse.json({ attendance: updated });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error)?.message || 'Chyba při ukládání účasti' },
      { status: 500 }
    );
  }
}
