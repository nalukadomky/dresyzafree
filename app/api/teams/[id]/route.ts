import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { db } from '@/lib/db-supabase';

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
    const allowed = ['backgroundColor'];
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
      }
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Žádné povolené změny' }, { status: 400 });
    }

    const team = await db.teams.update(params.id, updates as any);
    if (!team) {
      return NextResponse.json({ error: 'Tým nebyl nalezen' }, { status: 404 });
    }
    const { password: _, ...teamWithoutPassword } = team;
    return NextResponse.json({ team: teamWithoutPassword });
  } catch (error) {
    console.error('Patch team error:', error);
    return NextResponse.json(
      { error: 'Chyba při aktualizaci týmu' },
      { status: 500 }
    );
  }
}

