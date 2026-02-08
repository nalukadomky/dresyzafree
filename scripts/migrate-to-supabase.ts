import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Načtení dat z JSON souborů
const dataDir = path.join(process.cwd(), 'data');
const teamsFile = path.join(dataDir, 'teams.json');
const adminFile = path.join(dataDir, 'admin.json');

// Načtení .env.local
const envPath = path.join(process.cwd(), '.env.local');
let envVars: Record<string, string> = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || 'https://hcmeehplfkywifolcgio.supabase.co';
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbWVlaHBsZmt5d2lmb2xjZ2lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ1NjcxMywiZXhwIjoyMDg1MDMyNzEzfQ.v5sT5PSFTSKL2bbRmZJjdajtfFiC5k4cgLlIMFOitDk';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Chybí Supabase credentials v .env.local');
  console.error('Potřebujete:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=your-project-url');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateTeams() {
  console.log('📦 Migrace týmů...');

  if (!fs.existsSync(teamsFile)) {
    console.log('⚠️  Soubor teams.json neexistuje, přeskočeno');
    return;
  }

  const teams = JSON.parse(fs.readFileSync(teamsFile, 'utf-8'));

  if (teams.length === 0) {
    console.log('ℹ️  Žádné týmy k migraci');
    return;
  }

  console.log(`📊 Nalezeno ${teams.length} týmů`);

  // Kontrola, zda už nějaké týmy existují
  const { data: existingTeams } = await supabase.from('teams').select('id');
  const existingIds = new Set(existingTeams?.map(t => t.id) || []);

  // Filtrujeme pouze nové týmy
  const newTeams = teams.filter((team: any) => !existingIds.has(team.id));

  if (newTeams.length === 0) {
    console.log('✅ Všechny týmy jsou již v databázi');
    return;
  }

  console.log(`🔄 Migruji ${newTeams.length} nových týmů...`);

  // Vložení týmů po dávkách (Supabase má limit)
  const batchSize = 10;
  for (let i = 0; i < newTeams.length; i += batchSize) {
    const batch = newTeams.slice(i, i + batchSize);
    const { error } = await supabase.from('teams').insert(batch);

    if (error) {
      console.error(`❌ Chyba při migraci dávky ${i / batchSize + 1}:`, error);
    } else {
      console.log(`✅ Migrováno ${Math.min(i + batchSize, newTeams.length)}/${newTeams.length} týmů`);
    }
  }

  console.log('✅ Migrace týmů dokončena');
}

async function migrateAdmin() {
  console.log('👤 Migrace admin účtu...');

  if (!fs.existsSync(adminFile)) {
    console.log('⚠️  Soubor admin.json neexistuje, použije se defaultní');
    return;
  }

  const admin = JSON.parse(fs.readFileSync(adminFile, 'utf-8'));

  const { error } = await supabase
    .from('admin')
    .upsert(admin, { onConflict: 'username' });

  if (error) {
    console.error('❌ Chyba při migraci admin:', error);
  } else {
    console.log('✅ Admin účet migrován');
  }
}

async function main() {
  console.log('🚀 Začínám migraci na Supabase...\n');

  try {
    await migrateTeams();
    console.log('');
    await migrateAdmin();
    console.log('\n✅ Migrace dokončena!');
  } catch (error) {
    console.error('❌ Chyba při migraci:', error);
    process.exit(1);
  }
}

main();

