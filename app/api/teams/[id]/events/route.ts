import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { dbEvents, type EventType } from '@/lib/db-events';

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
    const events = await dbEvents.events.getByTeamId(params.id);
    return NextResponse.json({ events });
  } catch (error: unknown) {
    const msg = (error as Error)?.message || '';
    if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('events')) {
      return NextResponse.json(
        { error: 'Tabulky pro kalendář neexistují. Spusťte v Supabase SQL Editor skript: scripts/setup-training-attendance.sql' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: msg || 'Chyba při načítání událostí' },
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
    const { date, eventType, location, opponent, startTime, note } = await request.json();
    if (!date) {
      return NextResponse.json({ error: 'Datum je povinné' }, { status: 400 });
    }
    const validTypes: EventType[] = ['training', 'friendly_match', 'competitive_match'];
    if (!eventType || !validTypes.includes(eventType)) {
      return NextResponse.json({ error: 'Neplatný typ události' }, { status: 400 });
    }
    const event = await dbEvents.events.add(
      params.id,
      date,
      eventType,
      location,
      opponent,
      startTime,
      note
    );
    return NextResponse.json({ event });
  } catch (error: unknown) {
    const msg = (error as Error)?.message || '';
    if (msg.includes('note') || msg.includes('start_time') || msg.includes('column') || msg.includes('does not exist')) {
      return NextResponse.json(
        {
          error: 'V tabulce events chybí sloupce (note, start_time). Přidej SUPABASE_ACCESS_TOKEN do .env.local a navštiv: /api/admin/migrate-event-note?key=migrate-event-note-2024',
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: msg || 'Chyba při přidávání události' },
      { status: 500 }
    );
  }
}
