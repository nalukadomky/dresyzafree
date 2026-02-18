import dotenv from 'dotenv';
import path from 'path';

// Načti .env.local (Next.js konvence)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * Spustí migraci tabulek players, matches, ratings.
 *
 * V .env.local přidej:
 * SUPABASE_DATABASE_URL=postgresql://postgres:[HESLO]@db.[PROJEKT].supabase.co:5432/postgres
 *
 * Heslo a URL najdeš v Supabase: Settings → Database → Connection string (URI)
 *
 * Spusť: npx tsx scripts/run-player-voting-migration.ts
 */

import { Client } from 'pg';
import fs from 'fs';

async function main() {
  const url = process.env.SUPABASE_DATABASE_URL;
  if (!url) {
    console.error('Chybí SUPABASE_DATABASE_URL v .env.local');
    console.error('Přidej: SUPABASE_DATABASE_URL=postgresql://postgres:[HESLO]@db.xxx.supabase.co:5432/postgres');
    process.exit(1);
  }

  const sqlPath = path.join(process.cwd(), 'scripts', 'setup-player-voting.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log('Připojeno k databázi.');
    await client.query(sql);
    console.log('✓ Migrace dokončena – tabulky players, matches, ratings vytvořeny.');
  } catch (e: any) {
    console.error('Chyba:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
