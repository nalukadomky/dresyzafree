import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hcmeehplfkywifolcgio.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbWVlaHBsZmt5d2lmb2xjZ2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTY3MTMsImV4cCI6MjA4NTAzMjcxM30.RqEKwssiepOynW_cwCFFf8OFxwhPws6Mi5XO2jHzrKA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  console.log('🔍 Kontroluji data v Supabase...\n');

  try {
    // Kontrola tabulky teams
    console.log('📊 Kontroluji tabulku "teams"...');
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*');

    if (teamsError) {
      if (teamsError.code === 'PGRST116' || teamsError.message.includes('relation') || teamsError.message.includes('does not exist')) {
        console.log('❌ Tabulka "teams" neexistuje!');
        console.log('   Musíš spustit SQL migraci v Supabase SQL Editoru.\n');
        console.log('   SQL migrace: supabase/migrations/001_initial_schema.sql');
        console.log('   Odkaz: https://app.supabase.com/project/hcmeehplfkywifolcgio/sql/new\n');
      } else {
        console.log('❌ Chyba při načítání týmů:', teamsError.message);
      }
      return;
    }

    if (teams && teams.length > 0) {
      console.log(`✅ Nalezeno ${teams.length} týmů v Supabase:\n`);
      teams.forEach((team, index) => {
        console.log(`${index + 1}. ${team.teamName}`);
        console.log(`   - Kontakt: ${team.contactPerson}`);
        console.log(`   - Email: ${team.email}`);
        console.log(`   - Telefon: ${team.phone}`);
        console.log(`   - ID: ${team.id}`);
        console.log(`   - Status: ${team.status || 'nekontaktováno'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  Tabulka "teams" existuje, ale je prázdná.');
      console.log('   Data se budou ukládat při nové registraci.\n');
    }

    // Kontrola tabulky admin
    console.log('👤 Kontroluji tabulku "admin"...');
    const { data: admin, error: adminError } = await supabase
      .from('admin')
      .select('*');

    if (adminError) {
      if (adminError.code === 'PGRST116' || adminError.message.includes('relation') || adminError.message.includes('does not exist')) {
        console.log('❌ Tabulka "admin" neexistuje!');
        console.log('   Musíš spustit SQL migraci.\n');
      } else {
        console.log('❌ Chyba při načítání admin:', adminError.message);
      }
    } else if (admin && admin.length > 0) {
      console.log(`✅ Admin účet existuje: ${admin[0].username}\n`);
    } else {
      console.log('⚠️  Admin účet neexistuje.\n');
    }

    // Kontrola dat v JSON souborech
    const fs = require('fs');
    const path = require('path');
    const teamsFile = path.join(process.cwd(), 'data/teams.json');
    
    if (fs.existsSync(teamsFile)) {
      const jsonTeams = JSON.parse(fs.readFileSync(teamsFile, 'utf-8'));
      console.log(`📁 V JSON souboru je ${jsonTeams.length} týmů`);
      
      if (jsonTeams.length > 0 && (!teams || teams.length === 0)) {
        console.log('\n💡 Můžeš migrovat data z JSON do Supabase:');
        console.log('   npx tsx scripts/migrate-to-supabase.ts\n');
      }
    }

  } catch (error: any) {
    console.error('❌ Chyba:', error.message);
  }
}

checkData();

