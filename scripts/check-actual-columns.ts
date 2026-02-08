import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hcmeehplfkywifolcgio.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbWVlaHBsZmt5d2lmb2xjZ2lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ1NjcxMywiZXhwIjoyMDg1MDMyNzEzfQ.v5sT5PSFTSKL2bbRmZJjdajtfFiC5k4cgLlIMFOitDk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
  console.log('🔍 Kontroluji skutečné názvy sloupců v Supabase...\n');

  // Zkusíme vložit testovací záznam s různými názvy sloupců
  const testData1 = {
    id: 'test-columns-' + Date.now(),
    teamname: 'Test Team',
    contactperson: 'Test Person',
    phone: '123456789',
    email: 'test@test.com',
    leagues: ['Test League'],
    username: 'testuser' + Date.now(),
    password: 'testpassword',
    createdat: new Date().toISOString()
  };

  console.log('📊 Zkouším snake_case názvy sloupců...');
  const { error: error1 } = await supabase
    .from('teams')
    .insert(testData1);

  if (!error1) {
    console.log('✅ Tabulka používá snake_case názvy sloupců!');
    console.log('   Použité názvy:', Object.keys(testData1).join(', '));
    // Smazat testovací data
    await supabase.from('teams').delete().eq('id', testData1.id);
    return 'snake_case';
  } else {
    console.log('❌ Snake_case nefunguje:', error1.message);
  }

  // Zkusíme camelCase s uvozovkami
  const testData2 = {
    id: 'test-columns-2-' + Date.now(),
    'teamName': 'Test Team',
    'contactPerson': 'Test Person',
    phone: '123456789',
    email: 'test@test.com',
    leagues: ['Test League'],
    username: 'testuser' + Date.now(),
    password: 'testpassword',
    'createdAt': new Date().toISOString()
  };

  console.log('\n📊 Zkouším camelCase názvy sloupců s uvozovkami...');
  const { error: error2 } = await supabase
    .from('teams')
    .insert(testData2);

  if (!error2) {
    console.log('✅ Tabulka používá camelCase názvy sloupců s uvozovkami!');
    console.log('   Použité názvy:', Object.keys(testData2).join(', '));
    // Smazat testovací data
    await supabase.from('teams').delete().eq('id', testData2.id);
    return 'camelCase';
  } else {
    console.log('❌ CamelCase nefunguje:', error2.message);
  }

  // Zkusíme zjistit strukturu přes informační schéma (pokud máme přístup)
  console.log('\n📊 Zkouším zjistit strukturu přes SQL...');
  try {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'teams' });
    if (!error && data) {
      console.log('✅ Struktura tabulky:', data);
    }
  } catch (err: any) {
    console.log('⚠️  RPC funkce neexistuje');
  }

  return null;
}

checkColumns().then(result => {
  if (result) {
    console.log(`\n✅ Zjištěno: Tabulka používá ${result} názvy sloupců`);
  } else {
    console.log('\n❌ Nepodařilo se zjistit názvy sloupců');
  }
});

