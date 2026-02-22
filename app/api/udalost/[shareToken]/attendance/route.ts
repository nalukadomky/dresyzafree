import { NextRequest, NextResponse } from 'next/server';
import { dbEvents, isAttendanceClosed } from '@/lib/db-events';
import { dbPlayers } from '@/lib/db-players';

/** Veřejné API – uloží účast hráče (bez přihlášení, validace přes share_token) */
export async function POST(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const event = await dbEvents.events.getByShareToken(params.shareToken);
    if (!event) {
      return NextResponse.json({ error: 'Událost nenalezena' }, { status: 404 });
    }
    if (isAttendanceClosed(event.date, event.startTime)) {
      return NextResponse.json(
        { error: 'Odpovědi byly uzavřeny hodinu před událostí. Účast již nelze měnit.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { playerId, attended, absenceReason } = body;

    if (!playerId || typeof playerId !== 'string') {
      return NextResponse.json({ error: 'Chybí playerId' }, { status: 400 });
    }
    if (typeof attended !== 'boolean') {
      return NextResponse.json({ error: 'Chybí nebo neplatná hodnota attended' }, { status: 400 });
    }

    const players = await dbPlayers.players.getByTeamId(event.teamId);
    if (!players.some((p) => p.id === playerId)) {
      return NextResponse.json({ error: 'Hráč není v tomto týmu' }, { status: 400 });
    }

    if (!attended) {
      const reason = typeof absenceReason === 'string' ? absenceReason.trim() : '';
      if (!reason) {
        return NextResponse.json(
          { error: 'Při neúčasti je nutné vyplnit důvod' },
          { status: 400 }
        );
      }
    }

    await dbEvents.attendance.setAttendanceWithReason(
      event.id,
      playerId,
      attended,
      attended ? undefined : (body.absenceReason || '').trim()
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error)?.message || 'Chyba při ukládání' },
      { status: 500 }
    );
  }
}
