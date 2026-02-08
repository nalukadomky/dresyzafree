import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hcmeehplfkywifolcgio.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbWVlaHBsZmt5d2lmb2xjZ2lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ1NjcxMywiZXhwIjoyMDg1MDMyNzEzfQ.v5sT5PSFTSKL2bbRmZJjdajtfFiC5k4cgLlIMFOitDk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('🔍 Kontroluji tabulky v Supabase...\n');

  // Kontrola, jestli tabulka teams existuje
  console.log('📊 Kontroluji tabulku "teams"...');
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Chyba při čtení z tabulky teams:');
      console.error('   Kód:', error.code);
      console.error('   Zpráva:', error.message);
      console.error('   Detaily:', error.details);
      console.error('   Hint:', error.hint);
      
      if (error.code === 'PGRST204') {
        console.error('\n⚠️  Problém: Tabulka teams má špatné názvy sloupců!');
        console.error('   Řešení: Spusťte SQL migraci 003_recreate_tables.sql v Supabase SQL Editoru');
      }
    } else {
      console.log(`✅ Tabulka teams existuje a obsahuje ${data?.length || 0} týmů`);
      if (data && data.length > 0) {
        console.log('\n📋 Ukázka dat:');
        data.forEach((team: any, index: number) => {
          console.log(`\n   Tým ${index + 1}:`);
          console.log(`   - ID: ${team.id}`);
          console.log(`   - Username: ${team.username || team.Username || 'N/A'}`);
          console.log(`   - Team Name: ${team.teamName || team.teamname || team.TeamName || 'N/A'}`);
          console.log(`   - Email: ${team.email || team.Email || 'N/A'}`);
          console.log(`   - Sloupce v záznamu: ${Object.keys(team).join(', ')}`);
        });
      } else {
        console.log('   ⚠️  Tabulka je prázdná');
      }
    }
  } catch (error: any) {
    console.error('❌ Chyba:', error.message);
  }

  // Zkusíme zjistit strukturu tabulky
  console.log('\n🔍 Zkouším zjistit strukturu tabulky...');
  try {
    // Zkusíme vložit testovací záznam a podívat se na chybu
    const testData = {
      id: 'test-structure-' + Date.now(),
      teamName: 'Test Team',
      contactPerson: 'Test Person',
      phone: '123456789',
      email: 'test@test.com',
      leagues: ['Test League'],
      username: 'testuser' + Date.now(),
      password: 'testpassword',
      createdAt: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('teams')
      .insert(testData);

    if (insertError) {
      console.log('❌ Chyba při vložení testovacích dat:');
      console.log('   Kód:', insertError.code);
      console.log('   Zpráva:', insertError.message);
      console.log('   Detaily:', insertError.details);
      
      if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
        console.log('\n⚠️  PROBLÉM: Tabulka má špatné názvy sloupců!');
        console.log('   Potřebujete spustit SQL migraci: supabase/migrations/003_recreate_tables.sql');
        console.log('   V Supabase SQL Editoru: https://app.supabase.com/project/hcmeehplfkywifolcgio/sql/new');
      }
    } else {
      console.log('✅ Testovací data vložena úspěšně!');
      // Smazat testovací data
      await supabase.from('teams').delete().eq('id', testData.id);
      console.log('   Testovací data smazána');
    }
  } catch (error: any) {
    console.error('❌ Chyba:', error.message);
  }

  // Kontrola všech týmů
  console.log('\n📊 Všechny týmy v Supabase:');
  try {
    const { data: allTeams, error: allError } = await supabase
      .from('teams')
      .select('*');

    if (allError) {
      console.error('❌ Chyba:', allError.message);
    } else {
      console.log(`   Celkem: ${allTeams?.length || 0} týmů v Supabase`);
      if (allTeams && allTeams.length > 0) {
        console.log('\n   Seznam týmů:');
        allTeams.forEach((team: any, index: number) => {
          console.log(`   ${index + 1}. ${team.username || team.Username || 'N/A'} - ${team.teamName || team.teamname || team.TeamName || 'N/A'}`);
        });
      }
    }
  } catch (error: any) {
    console.error('❌ Chyba:', error.message);
  }
}

checkTables();

