import { NextRequest, NextResponse } from 'next/server';
import { verifyTeam } from '@/lib/auth';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Uživatelské jméno (nebo e-mail) a heslo jsou povinné' },
        { status: 400 }
      );
    }

    const team = await verifyTeam(username, password);
    if (!team) {
      return NextResponse.json(
        { error: 'Neplatné přihlašovací údaje' },
        { status: 401 }
      );
    }

    // Vytvoření JWT tokenu
    const token = jwt.sign(
      { id: team.id, username: team.username, type: 'team' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'Přihlášení úspěšné',
      token,
      team,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Chyba při přihlášení' },
      { status: 500 }
    );
  }
}

