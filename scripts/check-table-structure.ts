import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hcmeehplfkywifolcgio.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbWVlaHBsZmt5d2lmb2xjZ2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTY3MTMsImV4cCI6MjA4NTAzMjcxM30.RqEKwssiepOynW_cwCFFf8OFxwhPws6Mi5XO2jHzrKA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStructure() {
  console.log('🔍 Kontroluji strukturu tabulky teams...\n');

  try {
    // Zkusíme získat strukturu přes informační schéma
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: 'teams' })
      .single();

    if (error) {
      console.log('⚠️  RPC funkce neexistuje, zkusím jiný způsob...\n');
    }

    // Zkusíme vložit testovací záznam a podívat se na chybu
    const testData = {
      id: 'test-' + Date.now(),
      teamName: 'Test',
      contactPerson: 'Test',
      phone: '123',
      email: 'test@test.com',
      leagues: [],
      username: 'test' + Date.now(),
      password: 'test',
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
      console.log('   Hint:', insertError.hint);
    } else {
      console.log('✅ Testovací data vložena úspěšně!');
      // Smazat testovací data
      await supabase.from('teams').delete().eq('id', testData.id);
    }

  } catch (error: any) {
    console.error('❌ Chyba:', error.message);
  }
}

checkStructure();

