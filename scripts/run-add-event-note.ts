import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * Přidá sloupec note do tabulky events.
 *
 * Možnost 1: SUPABASE_ACCESS_TOKEN – Personal Access Token z supabase.com/dashboard/account/tokens
 * Možnost 2: SUPABASE_DATABASE_URL – Connection string z Supabase Settings → Database
 * Možnost 3: SUPABASE_DB_PASSWORD – heslo DB, skript sestaví URL z projektu
 *
 * Spusť: npx tsx scripts/run-add-event-note.ts
 */

import { Client } from 'pg';

const PROJECT_REF = 'hcmeehplfkywifolcgio';

function getProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const match = url?.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? PROJECT_REF;
}

async function runViaManagementApi(): Promise<boolean> {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) return false;

  const ref = getProjectRef();
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: 'DROP TABLE IF EXISTS note CASCADE; ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TEXT; ALTER TABLE events ADD COLUMN IF NOT EXISTS note TEXT;',
      read_only: false,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Management API: ${res.status} ${txt}`);
  }
  return true;
}

function getConnectionUrl(): string | null {
  const direct = process.env.SUPABASE_DATABASE_URL;
  if (direct) return direct;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!supabaseUrl || !password) return null;

  const ref = getProjectRef();
  return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
}

async function main() {
  // 1. Zkus Management API (SUPABASE_ACCESS_TOKEN)
  if (process.env.SUPABASE_ACCESS_TOKEN) {
    try {
      await runViaManagementApi();
      console.log('✓ Sloupce start_time a note přidány do tabulky events (přes Management API).');
      return;
    } catch (e) {
      console.error('Chyba Management API:', (e as Error).message);
      process.exit(1);
    }
  }

  // 2. Přímé připojení k DB
  const url = getConnectionUrl();
  if (!url) {
    console.error('Chybí připojení. Přidej do .env.local jednu z možností:');
    console.error('');
    console.error('1) SUPABASE_ACCESS_TOKEN=...');
    console.error('   (Personal Access Token: supabase.com/dashboard/account/tokens)');
    console.error('');
    console.error('2) SUPABASE_DATABASE_URL=postgresql://postgres:[HESLO]@db.xxx.supabase.co:5432/postgres');
    console.error('   (Supabase: Settings → Database → Connection string)');
    console.error('');
    console.error('3) SUPABASE_DB_PASSWORD=[heslo]');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    await client.query('DROP TABLE IF EXISTS note CASCADE');
    await client.query('ALTER TABLE events ADD COLUMN IF NOT EXISTS note TEXT');
    console.log('✓ Sloupec note přidán do tabulky events.');
  } catch (e: unknown) {
    console.error('Chyba:', (e as Error).message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
