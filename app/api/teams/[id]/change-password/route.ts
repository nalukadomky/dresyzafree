import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { db } from '@/lib/db-supabase';
import { verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    }
    if (user.type !== 'team' || user.id !== params.id) {
      return NextResponse.json({ error: 'Nemáte oprávnění' }, { status: 403 });
    }

    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || typeof oldPassword !== 'string') {
      return NextResponse.json({ error: 'Zadejte současné heslo' }, { status: 400 });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'Nové heslo musí mít alespoň 6 znaků' }, { status: 400 });
    }

    const team = await db.teams.getById(params.id);
    if (!team) {
      return NextResponse.json({ error: 'Tým nebyl nalezen' }, { status: 404 });
    }

    const isOldPasswordValid = await verifyPassword(oldPassword, team.password);
    if (!isOldPasswordValid) {
      return NextResponse.json({ error: 'Současné heslo není správné' }, { status: 400 });
    }

    const hashedNewPassword = await hashPassword(newPassword);
    await db.teams.update(params.id, { password: hashedNewPassword } as any);

    return NextResponse.json({ message: 'Heslo bylo úspěšně změněno' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Chyba při změně hesla' }, { status: 500 });
  }
}
