import { NextRequest, NextResponse } from 'next/server';

/**
 * Jednorázová migrace: přidá sloupec jersey_number do tabulky players.
 * Volání: GET /api/admin/migrate-player-jersey?key=SECRET
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
        query: `ALTER TABLE players ADD COLUMN IF NOT EXISTS jersey_number INTEGER;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'players_jersey_number_check'
  ) THEN
    ALTER TABLE players
      ADD CONSTRAINT players_jersey_number_check
      CHECK (jersey_number IS NULL OR (jersey_number BETWEEN 1 AND 99));
  END IF;
END $$;`,
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

    return NextResponse.json({ success: true, message: 'Sloupec jersey_number byl přidán do tabulky players.' });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
