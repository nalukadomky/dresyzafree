import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { db } from '@/lib/db-supabase';
import { dbPlayers } from '@/lib/db-players';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Neautorizovaný přístup' },
        { status: 401 }
      );
    }

    // Týmy mohou vidět jen svá data, admin může vidět všechna
    if (user.type === 'team' && user.id !== params.id) {
      return NextResponse.json(
        { error: 'Nemáte oprávnění k tomuto týmu' },
        { status: 403 }
      );
    }

    const team = await db.teams.getById(params.id);
    if (!team) {
      return NextResponse.json(
        { error: 'Tým nebyl nalezen' },
        { status: 404 }
      );
    }

    // Vrátíme tým bez hesla
    const { password: _, ...teamWithoutPassword } = team;

    return NextResponse.json({ team: teamWithoutPassword });
  } catch (error) {
    console.error('Get team error:', error);
    return NextResponse.json(
      { error: 'Chyba při načítání týmu' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    }
    if (user.type !== 'team' || user.id !== params.id) {
      return NextResponse.json({ error: 'Nemáte oprávnění upravovat tento tým' }, { status: 403 });
    }

    const body = await request.json();
    const allowed = ['backgroundColor', 'coachPlayerId', 'teamName', 'logo'];
    const updates: Record<string, string | undefined> = {};
    for (const key of allowed) {
      if (key in body) {
        const val = body[key];
        if (key === 'backgroundColor') {
          if (val === null || val === undefined || val === '') {
            updates[key] = null;
          } else {
            const hex = typeof val === 'string' ? val.trim() : '';
            if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
              updates[key] = hex;
            }
          }
        }
        if (key === 'coachPlayerId') {
          updates[key] = val === null || val === undefined || val === '' ? null : (typeof val === 'string' ? val.trim() : null);
        }
        if (key === 'teamName') {
          const name = typeof val === 'string' ? val.trim() : '';
          if (name.length > 0) updates[key] = name;
        }
        if (key === 'logo') {
          updates[key] = val === null || val === undefined ? undefined : (typeof val === 'string' ? val.trim() || undefined : undefined);
        }
      }
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Žádné povolené změny' }, { status: 400 });
    }

    if (updates.coachPlayerId) {
      const teamPlayers = await dbPlayers.players.getByTeamId(params.id);
      if (!teamPlayers.some((p) => p.id === updates.coachPlayerId)) {
        return NextResponse.json({ error: 'Trenér musí být hráč z tohoto týmu' }, { status: 400 });
      }
    }

    const team = await db.teams.update(params.id, updates as any);
    if (!team) {
      return NextResponse.json({ error: 'Tým nebyl nalezen' }, { status: 404 });
    }
    const { password: _, ...teamWithoutPassword } = team;
    return NextResponse.json({ team: teamWithoutPassword });
  } catch (error: unknown) {
    console.error('Patch team error:', error);
    const msg = (error as Error)?.message || '';
    if (msg.includes('coach_player_id') || msg.includes('coach') || msg.includes('does not exist') || msg.includes('column')) {
      return NextResponse.json(
        { error: 'Sloupec pro trenéra neexistuje. Spusťte v Supabase SQL Editor skript: scripts/add-coach-player.sql' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: msg || 'Chyba při aktualizaci týmu' },
      { status: 500 }
    );
  }
}

