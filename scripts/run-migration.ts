import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Chybí Supabase credentials v .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Spouštím SQL migraci...\n');

  // Načtení SQL migrace
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Rozdělení SQL na jednotlivé příkazy (oddělené středníkem)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Nalezeno ${statements.length} SQL příkazů\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement || statement.trim().length === 0) continue;

    try {
      console.log(`⏳ Spouštím příkaz ${i + 1}/${statements.length}...`);
      
      // Použití RPC nebo přímého SQL přes PostgREST není možné
      // Musíme použít Supabase Management API nebo psql
      // Zkusíme použít .rpc() pokud máme funkci, nebo použijeme REST API
      
      // Pro CREATE TABLE a další DDL příkazy musíme použít Postgres přímo
      // Supabase JS klient nepodporuje DDL příkazy přes REST API
      // Musíme použít psql nebo Supabase CLI
      
      console.log('⚠️  Supabase JS klient nepodporuje DDL příkazy (CREATE TABLE, etc.)');
      console.log('📋 Použij prosím SQL Editor v Supabase dashboardu');
      console.log('   nebo Supabase CLI: supabase db push\n');
      break;
    } catch (error: any) {
      console.error(`❌ Chyba při spouštění příkazu ${i + 1}:`, error.message);
    }
  }

  console.log('\n✅ Migrace dokončena!');
  console.log('\n📝 Alternativní způsob:');
  console.log('   1. Otevři Supabase → SQL Editor');
  console.log('   2. Zkopíruj obsah z supabase/migrations/001_initial_schema.sql');
  console.log('   3. Vlož do SQL Editoru a klikni Run');
}

runMigration().catch(console.error);

