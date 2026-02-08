import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Uživatelské jméno a heslo jsou povinné' },
        { status: 400 }
      );
    }

    const isValid = await verifyAdmin(username, password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Neplatné přihlašovací údaje' },
        { status: 401 }
      );
    }

    // Vytvoření JWT tokenu
    const token = jwt.sign(
      { username, type: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'Přihlášení úspěšné',
      token,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Chyba při přihlášení' },
      { status: 500 }
    );
  }
}

