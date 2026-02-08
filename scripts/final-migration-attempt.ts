import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://hcmeehplfkywifolcgio.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbWVlaHBsZmt5d2lmb2xjZ2lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ1NjcxMywiZXhwIjoyMDg1MDMyNzEzfQ.v5sT5PSFTSKL2bbRmZJjdajtfFiC5k4cgLlIMFOitDk';

async function attemptMigration() {
  console.log('🚀 Pokus o automatickou SQL migraci...\n');

  const migrationPath = path.join(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Zkusíme použít Supabase Dashboard API endpoint
  // Supabase má endpoint pro SQL execution přes Dashboard API
  const projectRef = 'hcmeehplfkywifolcgio';
  
  try {
    // Supabase Dashboard API pro SQL queries
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        query: sql,
        name: 'Initial Schema Migration'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SQL migrace úspěšně spuštěna!');
      console.log('📊 Výsledek:', result);
      return true;
    }

    const errorText = await response.text();
    console.log('⚠️  API volání selhalo:', response.status);
    console.log('   Odpověď:', errorText.substring(0, 200));
    
  } catch (error: any) {
    console.log('⚠️  Chyba:', error.message);
  }

  console.log('\n❌ Automatická migrace není možná.');
  console.log('   Supabase API nepodporuje DDL příkazy (CREATE TABLE, etc.)\n');
  
  console.log('📋 Musíš to udělat ručně:\n');
  console.log('   1. Otevři: https://app.supabase.com/project/hcmeehplfkywifolcgio/sql/new');
  console.log('   2. Zkopíruj celý obsah z: supabase/migrations/001_initial_schema.sql');
  console.log('   3. Vlož do SQL Editoru');
  console.log('   4. Klikni Run (Ctrl+Enter / Cmd+Enter)\n');
  
  console.log('📝 SQL migrace je připravena a obsahuje:');
  console.log('   - Tabulku teams');
  console.log('   - Tabulku admin');
  console.log('   - Indexy pro výkon');
  console.log('   - Defaultní admin účet\n');

  return false;
}

attemptMigration().then(success => {
  if (!success) {
    console.log('💡 Po spuštění SQL migrace restartuj server: npm run dev');
  }
});

