import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Načtení credentials z .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Chybí Supabase credentials v .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  console.log('🚀 Nastavuji databázi...\n');

  try {
    // Kontrola, zda tabulky už existují
    const { data: teamsCheck, error: teamsError } = await supabase
      .from('teams')
      .select('id')
      .limit(1);

    if (!teamsError && teamsCheck !== null) {
      console.log('✅ Tabulka "teams" již existuje');
    } else {
      console.log('⚠️  Tabulka "teams" neexistuje - potřebuješ spustit SQL migraci');
    }

    const { data: adminCheck, error: adminError } = await supabase
      .from('admin')
      .select('username')
      .limit(1);

    if (!adminError && adminCheck !== null) {
      console.log('✅ Tabulka "admin" již existuje');
    } else {
      console.log('⚠️  Tabulka "admin" neexistuje - potřebuješ spustit SQL migraci');
    }

    // Zkusíme vytvořit admin účet pokud tabulka existuje
    if (!adminError) {
      const { error: insertError } = await supabase
        .from('admin')
        .upsert({
          username: 'lasak.design@gmail.com',
          password: '$2a$10$gzOTWOCom0l8enLku2H7POu2l2JPVkI/2MbwA66ZRP281oSzcSwKC'
        }, { onConflict: 'username' });

      if (!insertError) {
        console.log('✅ Admin účet vytvořen/aktualizován');
      }
    }

    console.log('\n📋 Pro vytvoření tabulek:');
    console.log('   1. Otevři Supabase → SQL Editor');
    console.log('   2. Zkopíruj obsah z supabase/migrations/001_initial_schema.sql');
    console.log('   3. Vlož do SQL Editoru a klikni Run\n');

  } catch (error: any) {
    console.error('❌ Chyba:', error.message);
  }
}

setupDatabase();

