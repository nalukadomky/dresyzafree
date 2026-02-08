import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamName, contactPerson, phone, email, leagues, username, password, logo, referrerId } = body;

    // Detailní validace jednotlivých polí
    const fieldErrors: Record<string, string> = {};
    
    if (!teamName || !teamName.trim()) {
      fieldErrors.teamName = 'Název týmu je povinný';
    }
    
    if (!contactPerson || !contactPerson.trim()) {
      fieldErrors.contactPerson = 'Kontaktní osoba je povinná';
    }
    
    if (!phone || !phone.trim()) {
      fieldErrors.phone = 'Telefon je povinný';
    } else if (!/^[\d\s\+\-\(\)]+$/.test(phone)) {
      fieldErrors.phone = 'Telefon obsahuje neplatné znaky';
    }
    
    if (!email || !email.trim()) {
      fieldErrors.email = 'E-mail je povinný';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fieldErrors.email = 'Neplatný formát e-mailu';
    }
    
    if (!Array.isArray(leagues) || leagues.length === 0) {
      fieldErrors.leagues = 'Vyberte alespoň jednu ligu';
    }
    
    if (!username || !username.trim()) {
      fieldErrors.username = 'Uživatelské jméno je povinné';
    } else if (username.length < 3) {
      fieldErrors.username = 'Uživatelské jméno musí mít alespoň 3 znaky';
    }
    
    if (!password) {
      fieldErrors.password = 'Heslo je povinné';
    } else if (password.length < 6) {
      fieldErrors.password = 'Heslo musí mít alespoň 6 znaků';
    }
    
    if (Object.keys(fieldErrors).length > 0) {
      const errorMessages = Object.values(fieldErrors);
      return NextResponse.json(
        { 
          error: errorMessages.length === 1 ? errorMessages[0] : `Chyby v ${errorMessages.length} polích`,
          fieldErrors 
        },
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
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Vrátíme konkrétní chybovou zprávu
    const errorMessage = error?.message || error?.toString() || 'Chyba při registraci';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

