import fs from 'fs';
import path from 'path';

const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbWVlaHBsZmt5d2lmb2xjZ2lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ1NjcxMywiZXhwIjoyMDg1MDMyNzEzfQ.v5sT5PSFTSKL2bbRmZJjdajtfFiC5k4cgLlIMFOitDk';
const projectRef = 'hcmeehplfkywifolcgio';

async function tryManagementAPI() {
  console.log('🚀 Zkouším použít Supabase Management API...\n');

  const migrationPath = path.join(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Supabase Management API endpoint pro SQL execution
  // Vyžaduje access token, ne service_role key
  try {
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
      console.log('✅ SQL migrace úspěšně spuštěna přes Management API!');
      console.log('📊 Výsledek:', result);
      return true;
    }

    const errorText = await response.text();
    console.log('⚠️  Management API volání selhalo:', response.status);
    console.log('   Odpověď:', errorText.substring(0, 300));
    
  } catch (error: any) {
    console.log('⚠️  Chyba:', error.message);
  }

  console.log('\n❌ Supabase Management API vyžaduje access token (ne service_role key).');
  console.log('   Automatická migrace není možná bez přístupu k Supabase dashboardu.\n');
  
  console.log('📋 Musíš spustit SQL migraci ručně:\n');
  console.log('   1. Otevři: https://app.supabase.com/project/hcmeehplfkywifolcgio/sql/new');
  console.log('   2. Zkopíruj SQL z: supabase/migrations/001_initial_schema.sql');
  console.log('   3. Vlož do SQL Editoru');
  console.log('   4. Klikni Run (Ctrl+Enter / Cmd+Enter)\n');
  
  console.log('💡 Po spuštění SQL migrace pak spusť migraci dat:');
  console.log('   npx tsx scripts/migrate-to-supabase.ts\n');
  
  return false;
}

tryManagementAPI();

