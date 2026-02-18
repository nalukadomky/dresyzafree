import { NextRequest, NextResponse } from 'next/server';

/**
 * Jednorázová migrace: přidá sloupec note do tabulky events.
 * Volání: GET /api/admin/migrate-event-note?key=SECRET
 * Nastav MIGRATE_SECRET v .env.local (tajný klíč pro ochranu endpointu).
 * Vyžaduje SUPABASE_ACCESS_TOKEN v .env.local (Personal Access Token z supabase.com/dashboard/account/tokens).
 */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  const secret = process.env.MIGRATE_SECRET;

  if (!secret || key !== secret) {
    return NextResponse.json({ error: 'Neplatný klíč' }, { status: 403 });
  }

  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'Chybí SUPABASE_ACCESS_TOKEN. Přidej Personal Access Token z supabase.com/dashboard/account/tokens' },
      { status: 500 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const match = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/);
  const ref = match?.[1] ?? 'hcmeehplfkywifolcgio';

  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `DROP TABLE IF EXISTS note CASCADE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS note TEXT;`,
        read_only: false,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json(
        { error: `Management API: ${res.status} - ${txt}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Sloupce start_time a note byly přidány do tabulky events.' });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
