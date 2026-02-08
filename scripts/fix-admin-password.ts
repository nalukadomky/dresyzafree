import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = 'https://hcmeehplfkywifolcgio.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbWVlaHBsZmt5d2lmb2xjZ2lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ1NjcxMywiZXhwIjoyMDg1MDMyNzEzfQ.v5sT5PSFTSKL2bbRmZJjdajtfFiC5k4cgLlIMFOitDk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdminPassword() {
  console.log('🔧 Opravuji admin heslo...\n');

  try {
    // Zkontrolujeme současný stav
    const { data: currentAdmin, error: fetchError } = await supabase
      .from('admin')
      .select('*')
      .eq('username', 'lasak.design@gmail.com')
      .single();

    if (fetchError) {
      console.error('❌ Chyba při načítání admin účtu:', fetchError.message);
      return;
    }

    if (!currentAdmin) {
      console.log('⚠️  Admin účet neexistuje, vytvářím...');
    } else {
      console.log('📊 Současný admin účet:');
      console.log(`   Username: ${currentAdmin.username}`);
      console.log(`   Password: ${currentAdmin.password.substring(0, 30)}...`);
      
      // Zkontrolujeme, jestli je to bcrypt hash
      if (!currentAdmin.password.startsWith('$2a$') && !currentAdmin.password.startsWith('$2b$') && !currentAdmin.password.startsWith('$2y$')) {
        console.log('⚠️  Heslo není bcrypt hash, opravuji...');
      } else {
        console.log('✅ Heslo je již bcrypt hash');
        // Otestujeme, jestli funguje
        const isValid = await bcrypt.compare('Heslo1234!', currentAdmin.password);
        if (isValid) {
          console.log('✅ Heslo funguje správně!');
          return;
        } else {
          console.log('⚠️  Heslo nefunguje, opravuji...');
        }
      }
    }

    // Vytvoříme správný bcrypt hash
    const hashedPassword = await bcrypt.hash('Heslo1234!', 10);
    console.log('🔐 Vytvořen nový bcrypt hash');

    // Aktualizujeme nebo vytvoříme admin účet
    const { error: upsertError } = await supabase
      .from('admin')
      .upsert({
        username: 'lasak.design@gmail.com',
        password: hashedPassword
      }, { onConflict: 'username' });

    if (upsertError) {
      console.error('❌ Chyba při aktualizaci admin účtu:', upsertError.message);
      return;
    }

    console.log('✅ Admin účet opraven!');
    console.log('   Username: lasak.design@gmail.com');
    console.log('   Password: Heslo1234!');
    console.log('   Hash: ' + hashedPassword.substring(0, 30) + '...');

    // Otestujeme přihlášení
    console.log('\n🧪 Testuji přihlášení...');
    const testValid = await bcrypt.compare('Heslo1234!', hashedPassword);
    if (testValid) {
      console.log('✅ Přihlášení by mělo fungovat!');
    } else {
      console.log('❌ Přihlášení nefunguje!');
    }

  } catch (error: any) {
    console.error('❌ Chyba:', error.message);
  }
}

fixAdminPassword();

