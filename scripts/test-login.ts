import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Test přihlášení - zkontrolujeme, kde jsou data
const supabaseUrl = 'https://hcmeehplfkywifolcgio.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbWVlaHBsZmt5d2lmb2xjZ2lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ1NjcxMywiZXhwIjoyMDg1MDMyNzEzfQ.v5sT5PSFTSKL2bbRmZJjdajtfFiC5k4cgLlIMFOitDk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLogin() {
  console.log('🔍 Testování přihlášení...\n');

  // Zkusíme najít nějaký tým v Supabase
  console.log('📊 Kontroluji Supabase...');
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('username, email, "teamName"')
      .limit(5);

    if (error) {
      console.error('❌ Chyba při čtení z Supabase:', error.message);
      console.error('   Kód:', error.code);
    } else {
      console.log(`✅ V Supabase nalezeno ${data?.length || 0} týmů`);
      if (data && data.length > 0) {
        data.forEach((team: any) => {
          console.log(`   - ${team.username} (${team.teamName || team.teamname || 'N/A'})`);
        });
      }
    }
  } catch (error: any) {
    console.error('❌ Chyba:', error.message);
  }

  // Zkontrolujeme JSON soubor
  console.log('\n📁 Kontroluji JSON soubor...');
  const teamsFile = path.join(process.cwd(), 'data', 'teams.json');
  if (fs.existsSync(teamsFile)) {
    const teams = JSON.parse(fs.readFileSync(teamsFile, 'utf-8'));
    console.log(`✅ V JSON souboru je ${teams.length} týmů`);
    if (teams.length > 0) {
      console.log('\n   Poslední 3 týmy:');
      teams.slice(-3).forEach((team: any) => {
        console.log(`   - ${team.username} (${team.teamName}) - ID: ${team.id}`);
      });
    }
  } else {
    console.log('⚠️  JSON soubor neexistuje');
  }

  // Zkusíme najít konkrétní uživatele
  console.log('\n🔍 Zkouším najít uživatele "Jakoby"...');
  
  // V Supabase
  try {
    const { data: supabaseTeam, error: supabaseError } = await supabase
      .from('teams')
      .select('*')
      .eq('username', 'Jakoby')
      .single();

    if (supabaseError) {
      console.log('   ❌ V Supabase nenalezen:', supabaseError.message);
    } else if (supabaseTeam) {
      console.log('   ✅ Nalezen v Supabase:', supabaseTeam);
    }
  } catch (error: any) {
    console.log('   ❌ Chyba při hledání v Supabase:', error.message);
  }

  // V JSON
  if (fs.existsSync(teamsFile)) {
    const teams = JSON.parse(fs.readFileSync(teamsFile, 'utf-8'));
    const jakobyTeam = teams.find((t: any) => t.username === 'Jakoby');
    if (jakobyTeam) {
      console.log('   ✅ Nalezen v JSON:', {
        username: jakobyTeam.username,
        teamName: jakobyTeam.teamName,
        id: jakobyTeam.id,
        hasPassword: !!jakobyTeam.password
      });
    } else {
      console.log('   ❌ V JSON nenalezen');
    }
  }
}

testLogin();

