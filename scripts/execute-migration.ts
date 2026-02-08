import fs from 'fs';
import path from 'path';

// Načtení credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hcmeehplfkywifolcgio.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbWVlaHBsZmt5d2lmb2xjZ2lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ1NjcxMywiZXhwIjoyMDg1MDMyNzEzfQ.v5sT5PSFTSKL2bbRmZJjdajtfFiC5k4cgLlIMFOitDk';

async function executeMigration() {
  console.log('🚀 Spouštím SQL migraci přes Supabase API...\n');

  // Načtení SQL migrace
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // Supabase má REST API endpoint pro SQL execution
    // Použijeme PostgREST nebo Management API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      console.log('✅ SQL migrace úspěšně spuštěna!');
      return;
    }

    // Pokud RPC neexistuje, zkusíme jiný způsob
    console.log('⚠️  RPC endpoint neexistuje, zkusím alternativní metodu...\n');
    
    // Supabase nepodporuje DDL přes REST API přímo
    // Musíme použít psql nebo Supabase CLI
    console.log('📋 Supabase REST API nepodporuje DDL příkazy (CREATE TABLE, etc.)');
    console.log('   Musíš použít jeden z těchto způsobů:\n');
    console.log('   1. SQL Editor v Supabase dashboardu (doporučeno)');
    console.log('   2. Supabase CLI: supabase db push');
    console.log('   3. psql přímo na databázi\n');
    
    console.log('📝 SQL migrace je připravena v:');
    console.log(`   ${migrationPath}\n`);
    
    console.log('🔗 Rychlý odkaz na SQL Editor:');
    console.log(`   ${supabaseUrl.replace('/rest/v1', '')}/project/hcmeehplfkywifolcgio/sql/new\n`);

  } catch (error: any) {
    console.error('❌ Chyba při spouštění migrace:', error.message);
    console.log('\n📋 Použij prosím SQL Editor v Supabase dashboardu');
  }
}

executeMigration();

