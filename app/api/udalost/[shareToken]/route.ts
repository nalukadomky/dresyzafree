import { NextRequest, NextResponse } from 'next/server';
import { dbEvents, isAttendanceClosed } from '@/lib/db-events';
import { dbPlayers } from '@/lib/db-players';

/** Veřejné API – načte událost a hráče podle sdíleného odkazu (bez přihlášení) */
export async function GET(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const event = await dbEvents.events.getByShareToken(params.shareToken);
    if (!event) {
      return NextResponse.json({ error: 'Událost nenalezena' }, { status: 404 });
    }
    const players = await dbPlayers.players.getByTeamId(event.teamId);
    const attendance = await dbEvents.attendance.getByEventId(event.id);

    return NextResponse.json({
      event: {
        id: event.id,
        date: event.date,
        eventType: event.eventType,
        location: event.location,
        opponent: event.opponent,
        startTime: event.startTime,
        note: event.note,
        votingDeadline: event.votingDeadline || null,
        attendanceClosed: isAttendanceClosed(event.date, event.votingDeadline),
      },
      players: players.map((p) => ({ id: p.id, name: p.name })),
      attendance: attendance.map((a) => ({
        playerId: a.playerId,
        attended: a.attended,
        absenceReason: a.absenceReason,
      })),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error)?.message || 'Chyba při načítání' },
      { status: 500 }
    );
  }
}
