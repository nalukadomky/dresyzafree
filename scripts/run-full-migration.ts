import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://hcmeehplfkywifolcgio.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbWVlaHBsZmt5d2lmb2xjZ2lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ1NjcxMywiZXhwIjoyMDg1MDMyNzEzfQ.v5sT5PSFTSKL2bbRmZJjdajtfFiC5k4cgLlIMFOitDk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTablesExist() {
  try {
    const { data, error } = await supabase.from('teams').select('id').limit(1);
    if (!error) return true;
    
    if (error.code === 'PGRST116' || error.message.includes('does not exist') || error.message.includes('schema cache')) {
      return false;
    }
    throw error;
  } catch (error: any) {
    if (error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
      return false;
    }
    throw error;
  }
}

async function createTables() {
  console.log('📊 Kontroluji, zda tabulky existují...\n');
  
  const tablesExist = await checkTablesExist();
  
  if (tablesExist) {
    console.log('✅ Tabulky již existují!\n');
    return true;
  }

  console.log('❌ Tabulky neexistují. Potřebuji vytvořit SQL migraci.\n');
  console.log('⚠️  Supabase REST API nepodporuje DDL příkazy (CREATE TABLE).');
  console.log('   Musíš spustit SQL migraci ručně v Supabase SQL Editoru.\n');
  
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log('📋 SQL migrace je připravena v:');
  console.log(`   ${migrationPath}\n`);
  console.log('🔗 Otevři SQL Editor:');
  console.log('   https://app.supabase.com/project/hcmeehplfkywifolcgio/sql/new\n');
  console.log('📝 Zkopíruj a vlož tento SQL:\n');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  console.log('\n💡 Po spuštění SQL migrace spusť tento skript znovu pro migraci dat.\n');
  
  return false;
}

async function migrateData() {
  console.log('📦 Migruji data z JSON do Supabase...\n');

  const teamsFile = path.join(process.cwd(), 'data/teams.json');
  const adminFile = path.join(process.cwd(), 'data/admin.json');

  if (!fs.existsSync(teamsFile)) {
    console.log('⚠️  Soubor teams.json neexistuje');
    return;
  }

  const teams = JSON.parse(fs.readFileSync(teamsFile, 'utf-8'));

  if (teams.length === 0) {
    console.log('ℹ️  Žádné týmy k migraci');
    return;
  }

  console.log(`📊 Nalezeno ${teams.length} týmů v JSON souboru\n`);

  // Kontrola existujících týmů
  const { data: existingTeams } = await supabase.from('teams').select('id');
  const existingIds = new Set(existingTeams?.map(t => t.id) || []);

  const newTeams = teams.filter((team: any) => !existingIds.has(team.id));

  if (newTeams.length === 0) {
    console.log('✅ Všechny týmy jsou již v Supabase\n');
    return;
  }

  console.log(`🔄 Migruji ${newTeams.length} nových týmů...\n`);

  // Migrace po dávkách
  const batchSize = 10;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < newTeams.length; i += batchSize) {
    const batch = newTeams.slice(i, i + batchSize);
    
    for (const team of batch) {
      try {
        const { error } = await supabase.from('teams').insert(team);
        
        if (error) {
          console.error(`❌ Chyba při migraci týmu "${team.teamName}":`, error.message);
          errorCount++;
        } else {
          successCount++;
          console.log(`✅ Migrován: ${team.teamName} (${successCount}/${newTeams.length})`);
        }
      } catch (err: any) {
        console.error(`❌ Chyba při migraci týmu "${team.teamName}":`, err.message);
        errorCount++;
      }
    }
  }

  console.log(`\n✅ Migrace dokončena: ${successCount} úspěšných, ${errorCount} chyb\n`);

  // Migrace admin účtu
  if (fs.existsSync(adminFile)) {
    console.log('👤 Migruji admin účet...');
    const admin = JSON.parse(fs.readFileSync(adminFile, 'utf-8'));
    
    const { error } = await supabase
      .from('admin')
      .upsert(admin, { onConflict: 'username' });

    if (error) {
      console.error('❌ Chyba při migraci admin:', error.message);
    } else {
      console.log('✅ Admin účet migrován\n');
    }
  }
}

async function main() {
  console.log('🚀 Spouštím kompletní migraci do Supabase...\n');
  console.log('═'.repeat(60));
  console.log('');

  try {
    // Krok 1: Kontrola a vytvoření tabulek
    const tablesReady = await createTables();
    
    if (!tablesReady) {
      console.log('⏸️  Čekám na spuštění SQL migrace...');
      console.log('   Spusť SQL migraci v Supabase a pak spusť tento skript znovu.\n');
      process.exit(0);
    }

    // Krok 2: Migrace dat
    await migrateData();

    console.log('═'.repeat(60));
    console.log('✅ Migrace dokončena!\n');
    console.log('💡 Restartuj server: npm run dev\n');

  } catch (error: any) {
    console.error('❌ Chyba při migraci:', error.message);
    process.exit(1);
  }
}

main();

