import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://hcmeehplfkywifolcgio.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbWVlaHBsZmt5d2lmb2xjZ2lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ1NjcxMywiZXhwIjoyMDg1MDMyNzEzfQ.v5sT5PSFTSKL2bbRmZJjdajtfFiC5k4cgLlIMFOitDk';

async function executeSQL() {
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Zkusíme použít Supabase PostgREST pro SQL execution
  // Ale PostgREST nepodporuje DDL, takže to nebude fungovat
  
  // Zkusíme použít Supabase Dashboard API endpoint
  const projectRef = 'hcmeehplfkywifolcgio';
  
  try {
    // Supabase má možnost spustit SQL přes REST API pomocí RPC funkce
    // Ale musí existovat funkce v databázi, která to umožní
    
    // Zkusíme použít přímý SQL endpoint, pokud existuje
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      console.log('✅ SQL migrace úspěšně spuštěna!');
      return true;
    }

    const errorText = await response.text();
    console.log('⚠️  RPC endpoint nefunguje:', response.status);
    
  } catch (error: any) {
    console.log('⚠️  Chyba při API volání:', error.message);
  }

  console.log('\n❌ Automatická migrace není možná.');
  console.log('   Supabase API nepodporuje DDL příkazy (CREATE TABLE, etc.)\n');
  
  console.log('📋 Musíš to udělat ručně:\n');
  console.log('   1. Otevři: https://app.supabase.com/project/hcmeehplfkywifolcgio/sql/new');
  console.log('   2. Zkopíruj SQL z: supabase/migrations/001_initial_schema.sql');
  console.log('   3. Vlož do SQL Editoru a klikni Run\n');
  
  console.log('💡 Po spuštění SQL migrace pak spusť:');
  console.log('   npx tsx scripts/migrate-to-supabase.ts\n');
  
  return false;
}

executeSQL().then(success => {
  if (success) {
    console.log('🚀 Nyní můžeš migrovat data: npx tsx scripts/migrate-to-supabase.ts');
  }
});

