import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { db } from '@/lib/db-supabase';

export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user || user.type !== 'admin') {
      return NextResponse.json(
        { error: 'Neautorizovaný přístup' },
        { status: 401 }
      );
    }

    const teams = await db.teams.getAll();
    // Vrátíme týmy bez hesel
    const teamsWithoutPasswords = teams.map(({ password, ...team }) => team);

    return NextResponse.json({ teams: teamsWithoutPasswords });
  } catch (error) {
    console.error('Get teams error:', error);
    return NextResponse.json(
      { error: 'Chyba při načítání týmů' },
      { status: 500 }
    );
  }
}

