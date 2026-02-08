import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamName, contactPerson, phone, email, leagues, username, password, logo, referrerId } = body;

    // Validace
    if (!teamName || !contactPerson || !phone || !email || !leagues || !username || !password) {
      return NextResponse.json(
        { error: 'Všechna pole jsou povinná' },
        { status: 400 }
      );
    }

    if (!Array.isArray(leagues) || leagues.length === 0) {
      return NextResponse.json(
        { error: 'Vyberte alespoň jednu ligu' },
        { status: 400 }
      );
    }

    // Kontrola, zda uživatelské jméno není obsazené
    const existingTeam = await db.teams.getByUsername(username);
    if (existingTeam) {
      return NextResponse.json(
        { error: 'Uživatelské jméno je již obsazené' },
        { status: 400 }
      );
    }

    // Validace referrer ID, pokud je zadáno
    if (referrerId) {
      const referrerTeam = await db.teams.getById(referrerId);
      if (!referrerTeam) {
        return NextResponse.json(
          { error: 'Neplatné ID doporučujícího týmu' },
          { status: 400 }
        );
      }
    }

    // Hash hesla
    const hashedPassword = await hashPassword(password);

    // Příprava dat pro uložení
    const teamData = {
      teamName,
      contactPerson,
      phone,
      email,
      leagues,
      username,
      password: hashedPassword,
      logo: logo || undefined,
      status: 'nekontaktováno' as const, // Výchozí stav
      referrerId: referrerId || undefined,
    };

    console.log('Ukládám tým s těmito údaji:', {
      teamName,
      contactPerson,
      phone,
      email,
      leagues,
      username,
      logo: logo || 'žádné',
      referrerId: referrerId || 'žádné',
      status: 'nekontaktováno',
    });

    // Vytvoření týmu
    const team = await db.teams.create(teamData);

    // Vrátíme tým bez hesla
    const { password: _, ...teamWithoutPassword } = team;

    return NextResponse.json(
      { message: 'Tým byl úspěšně zaregistrován', team: teamWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Chyba při registraci' },
      { status: 500 }
    );
  }
}

