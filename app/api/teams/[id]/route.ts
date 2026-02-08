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

