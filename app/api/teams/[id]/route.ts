import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { db } from '@/lib/db-supabase';
import { dbPlayers } from '@/lib/db-players';
import type { TeamOverviewLayout, OverviewCardLayoutItem } from '@/lib/db-supabase';

const OVERVIEW_CARD_IDS = ['lastMatch', 'upcomingEvents', 'teamForm'] as const;
const OVERVIEW_CARD_SIZES = ['small', 'wide', 'full'] as const;

const DEFAULT_OVERVIEW_LAYOUT: TeamOverviewLayout = {
  version: 1,
  cards: [
    { id: 'lastMatch', order: 0, size: 'full', visible: true },
    { id: 'upcomingEvents', order: 1, size: 'small', visible: true },
    { id: 'teamForm', order: 2, size: 'wide', visible: true },
  ],
};

function normalizeOverviewLayout(value: unknown): TeamOverviewLayout | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as { version?: unknown; cards?: unknown };
  if (source.version !== 1) return null;
  if (!Array.isArray(source.cards)) return null;

  const isCardId = (id: unknown): id is (typeof OVERVIEW_CARD_IDS)[number] =>
    typeof id === 'string' && OVERVIEW_CARD_IDS.includes(id as (typeof OVERVIEW_CARD_IDS)[number]);
  const isCardSize = (size: unknown): size is (typeof OVERVIEW_CARD_SIZES)[number] =>
    typeof size === 'string' && OVERVIEW_CARD_SIZES.includes(size as (typeof OVERVIEW_CARD_SIZES)[number]);

  const cards: OverviewCardLayoutItem[] = [];
  const seen = new Set<string>();

  for (const raw of source.cards) {
    if (!raw || typeof raw !== 'object') return null;
    const item = raw as { id?: unknown; order?: unknown; size?: unknown; visible?: unknown };
    if (!isCardId(item.id) || !isCardSize(item.size) || typeof item.visible !== 'boolean') return null;
    if (!Number.isInteger(item.order)) return null;
    if (seen.has(item.id)) return null;
    seen.add(item.id);
    cards.push({
      id: item.id,
      order: Number(item.order),
      size: item.size,
      visible: item.visible,
    });
  }

  for (const fallback of DEFAULT_OVERVIEW_LAYOUT.cards) {
    if (!cards.some((c) => c.id === fallback.id)) {
      cards.push({ ...fallback });
    }
  }

  cards.sort((a, b) => a.order - b.order);
  const normalized = cards.map((c, index) => ({ ...c, order: index }));

  return {
    version: 1,
    cards: normalized,
  };
}

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
    const allowed = ['backgroundColor', 'coachPlayerId', 'teamName', 'logo', 'overviewLayout', 'contactPerson', 'phone', 'email'] as const;
    const updates: Record<string, unknown> = {};
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
          updates[key] = val === null || val === undefined || val === '' ? null : (typeof val === 'string' ? val.trim() || null : null);
        }
        if (key === 'teamName') {
          const name = typeof val === 'string' ? val.trim() : '';
          if (name.length > 0) updates[key] = name;
        }
        if (key === 'logo') {
          updates[key] = val === null || val === undefined ? undefined : (typeof val === 'string' ? val.trim() || undefined : undefined);
        }
        if (key === 'overviewLayout') {
          const normalized = normalizeOverviewLayout(val);
          if (!normalized) {
            return NextResponse.json({ error: 'Neplatný formát overviewLayout' }, { status: 400 });
          }
          updates[key] = normalized;
        }
        if (key === 'contactPerson') {
          const v = typeof val === 'string' ? val.trim() : '';
          if (v.length > 0) updates[key] = v;
        }
        if (key === 'phone') {
          const v = typeof val === 'string' ? val.trim() : '';
          if (v.length > 0) {
            if (!/^[\d\s\+\-\(\)]+$/.test(v)) {
              return NextResponse.json({ error: 'Telefon obsahuje neplatné znaky' }, { status: 400 });
            }
            updates[key] = v;
          }
        }
        if (key === 'email') {
          const v = typeof val === 'string' ? val.trim() : '';
          if (v.length > 0) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
              return NextResponse.json({ error: 'Neplatný formát e-mailu' }, { status: 400 });
            }
            updates[key] = v;
          }
        }
      }
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Žádné povolené změny' }, { status: 400 });
    }

    const coachPlayerIdUpdate = typeof updates.coachPlayerId === 'string' ? updates.coachPlayerId : null;
    if (coachPlayerIdUpdate) {
      const teamPlayers = await dbPlayers.players.getByTeamId(params.id);
      if (!teamPlayers.some((p) => p.id === coachPlayerIdUpdate)) {
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
      if (msg.includes('overview_layout')) {
        return NextResponse.json(
          { error: 'Sloupec pro layout přehledu neexistuje. Spusťte v Supabase SQL Editor skript: scripts/add-team-overview-layout.sql' },
          { status: 500 }
        );
      }
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
