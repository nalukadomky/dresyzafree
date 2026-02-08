import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://hcmeehplfkywifolcgio.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbWVlaHBsZmt5d2lmb2xjZ2lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ1NjcxMywiZXhwIjoyMDg1MDMyNzEzfQ.v5sT5PSFTSKL2bbRmZJjdajtfFiC5k4cgLlIMFOitDk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkJakoby() {
  console.log('🔍 Hledám uživatele "Jakoby"...\n');

  // Kontrola v Supabase
  console.log('📊 Kontroluji Supabase...');
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .ilike('username', '%Jakoby%');

    if (error) {
      console.error('❌ Chyba při čtení z Supabase:', error.message);
      console.error('   Kód:', error.code);
      console.error('   Detaily:', error.details);
    } else {
      console.log(`✅ V Supabase nalezeno ${data?.length || 0} týmů s "Jakoby" v username`);
      if (data && data.length > 0) {
        console.log('   Data:', JSON.stringify(data, null, 2));
      }
    }
  } catch (error: any) {
    console.error('❌ Chyba:', error.message);
  }

  // Kontrola v JSON
  console.log('\n📁 Kontroluji JSON soubor...');
  const teamsFile = path.join(process.cwd(), 'data', 'teams.json');
  if (fs.existsSync(teamsFile)) {
    const teams = JSON.parse(fs.readFileSync(teamsFile, 'utf-8'));
    const jakobyTeam = teams.find((t: any) => t.username === 'Jakoby' || t.username?.includes('Jakoby'));
    if (jakobyTeam) {
      console.log('✅ V JSON souboru nalezen uživatel "Jakoby":');
      console.log('   ID:', jakobyTeam.id);
      console.log('   Team Name:', jakobyTeam.teamName);
      console.log('   Username:', jakobyTeam.username);
      console.log('   Email:', jakobyTeam.email);
    } else {
      console.log('⚠️  V JSON souboru není uživatel "Jakoby"');
    }
  } else {
    console.log('⚠️  JSON soubor neexistuje');
  }

  // Kontrola všech týmů v Supabase
  console.log('\n📊 Všechny týmy v Supabase:');
  try {
    const { data: allTeams, error: allError } = await supabase
      .from('teams')
      .select('id, username, "teamName"')
      .limit(10);

    if (allError) {
      console.error('❌ Chyba:', allError.message);
    } else {
      console.log(`   Celkem: ${allTeams?.length || 0} týmů`);
      if (allTeams && allTeams.length > 0) {
        allTeams.forEach((team: any) => {
          console.log(`   - ${team.username} (${team.teamName || team.teamname || 'N/A'})`);
        });
      }
    }
  } catch (error: any) {
    console.error('❌ Chyba:', error.message);
  }
}

checkJakoby();

