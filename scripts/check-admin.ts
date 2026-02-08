import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hcmeehplfkywifolcgio.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbWVlaHBsZmt5d2lmb2xjZ2lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ1NjcxMywiZXhwIjoyMDg1MDMyNzEzfQ.v5sT5PSFTSKL2bbRmZJjdajtfFiC5k4cgLlIMFOitDk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdmin() {
  console.log('🔍 Kontroluji admin účet v Supabase...\n');

  try {
    const { data, error } = await supabase
      .from('admin')
      .select('*');

    if (error) {
      console.error('❌ Chyba při čtení admin účtu:', error.message);
      console.error('   Kód:', error.code);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  Admin účet neexistuje v Supabase!');
      console.log('   Vytvářím defaultní admin účet...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Heslo1234!', 10);
      
      const { error: insertError } = await supabase
        .from('admin')
        .insert({
          username: 'lasak.design@gmail.com',
          password: hashedPassword
        });

      if (insertError) {
        console.error('❌ Chyba při vytváření admin účtu:', insertError.message);
      } else {
        console.log('✅ Admin účet vytvořen!');
      }
    } else {
      console.log('✅ Admin účet existuje:');
      data.forEach((admin: any) => {
        console.log(`   Username: ${admin.username}`);
        console.log(`   Password hash: ${admin.password.substring(0, 20)}...`);
      });
    }
  } catch (error: any) {
    console.error('❌ Chyba:', error.message);
  }
}

checkAdmin();

