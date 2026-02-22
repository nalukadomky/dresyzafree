import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { dbPlayers } from '@/lib/db-players';

function parseJerseyNumber(raw: unknown): { value: number | null; error?: string } {
  if (raw == null || raw === '') return { value: null };
  const n = Number(raw);
  if (!Number.isInteger(n)) return { value: null, error: 'Číslo dresu musí být celé číslo.' };
  if (n < 1 || n > 99) return { value: null, error: 'Číslo dresu musí být v rozsahu 1-99.' };
  return { value: n };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; playerId: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    }
    if (user.type === 'team' && user.id !== params.id) {
      return NextResponse.json({ error: 'Nemáte oprávnění' }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const hasName = Object.prototype.hasOwnProperty.call(body, 'name');
    const hasJersey = Object.prototype.hasOwnProperty.call(body, 'jerseyNumber');
    if (!hasName && !hasJersey) {
      return NextResponse.json({ error: 'Chybí data k aktualizaci.' }, { status: 400 });
    }
    const updates: { name?: string; jerseyNumber?: number | null } = {};
    if (hasName) {
      if (!body.name || !String(body.name).trim()) {
        return NextResponse.json({ error: 'Jméno je povinné.' }, { status: 400 });
      }
      updates.name = String(body.name).trim();
    }
    if (hasJersey) {
      const parsed = parseJerseyNumber(body.jerseyNumber);
      if (parsed.error) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      updates.jerseyNumber = parsed.value;
    }
    const player = await dbPlayers.players.update(params.playerId, params.id, updates);
    if (!player) {
      return NextResponse.json({ error: 'Hráč nebyl nalezen.' }, { status: 404 });
    }
    return NextResponse.json({ player });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Chyba při úpravě hráče' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; playerId: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    }
    if (user.type === 'team' && user.id !== params.id) {
      return NextResponse.json({ error: 'Nemáte oprávnění' }, { status: 403 });
    }
    await dbPlayers.players.delete(params.playerId, params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Chyba při mazání hráče' },
      { status: 500 }
    );
  }
}
