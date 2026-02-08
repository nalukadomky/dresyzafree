import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://hcmeehplfkywifolcgio.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbWVlaHBsZmt5d2lmb2xjZ2lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ1NjcxMywiZXhwIjoyMDg1MDMyNzEzfQ.v5sT5PSFTSKL2bbRmZJjdajtfFiC5k4cgLlIMFOitDk';

async function runSQLMigration() {
  console.log('🚀 Spouštím SQL migraci přes Supabase Management API...\n');

  const migrationPath = path.join(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Supabase má SQL endpoint přes Dashboard API
  // Zkusíme použít endpoint pro SQL execution
  try {
    // Supabase Project API endpoint pro SQL
    const projectRef = 'hcmeehplfkywifolcgio';
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SQL migrace úspěšně spuštěna!');
      console.log('📊 Výsledek:', result);
      return;
    }

    const errorText = await response.text();
    console.log('⚠️  API endpoint nefunguje:', response.status, errorText);
    
  } catch (error: any) {
    console.log('⚠️  Chyba při API volání:', error.message);
  }

  // Fallback: použijeme Supabase Dashboard API
  console.log('\n📋 Používám alternativní metodu...\n');
  
  // Supabase Dashboard API pro SQL execution
  try {
    const dashboardUrl = `https://${projectRef}.supabase.co`;
    const response = await fetch(`${dashboardUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql_query: sql })
    });

    if (response.ok) {
      console.log('✅ SQL migrace úspěšně spuštěna přes RPC!');
      return;
    }
  } catch (error: any) {
    console.log('⚠️  RPC endpoint také nefunguje');
  }

  // Pokud API nefunguje, použijeme psql přes connection string
  console.log('\n📋 Supabase REST API nepodporuje DDL příkazy přímo.');
  console.log('   Použij prosím SQL Editor v Supabase dashboardu:\n');
  console.log('   1. Otevři: https://app.supabase.com/project/hcmeehplfkywifolcgio/sql/new');
  console.log('   2. Zkopíruj obsah z: supabase/migrations/001_initial_schema.sql');
  console.log('   3. Vlož do SQL Editoru a klikni Run\n');
  
  console.log('📝 SQL migrace:');
  console.log(sql);
}

runSQLMigration().catch(console.error);

