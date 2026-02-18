/**
 * Ověří existenci týmu a umožní nastavit nové heslo
 * Spusť: npx dotenv -e .env.local -- tsx scripts/check-reset-team.ts
 *    nebo: node -r dotenv/config node_modules/.bin/tsx scripts/check-reset-team.ts (s dotenv path .env.local)
 *
 * Použití:
 *   npx tsx scripts/check-reset-team.ts                    # pouze zkontrolovat kaja@kaja.cz
 *   npx tsx scripts/check-reset-team.ts kaja@kaja.cz       # zkontrolovat daný email
 *   npx tsx scripts/check-reset-team.ts kaja@kaja.cz NOVE_HESLO  # nastavit nové heslo
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error('Nastav NEXT_PUBLIC_SUPABASE_URL a SUPABASE_SERVICE_ROLE_KEY v .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  const email = process.argv[2] || 'kaja@kaja.cz';
  const newPassword = process.argv[3];

  const { data: byEmail, error: e1 } = await supabase
    .from('teams')
    .select('id, teamname, username, email, createdat')
    .ilike('email', email)
    .maybeSingle();

  const { data: byUsername, error: e2 } = await supabase
    .from('teams')
    .select('id, teamname, username, email, createdat')
    .ilike('username', email)
    .maybeSingle();

  const team = byEmail || byUsername;
  const err = e1 || e2;

  if (err) {
    console.error('Chyba:', err.message);
    process.exit(1);
  }

  if (!team) {
    console.log(`Tým s emailem/username "${email}" nebyl nalezen.`);
    return;
  }

  console.log('Nalezen tým:');
  console.log('  ID:', team.id);
  console.log('  Název:', team.teamname);
  console.log('  Username:', team.username);
  console.log('  Email:', team.email);
  console.log('  Vytvořeno:', team.createdat);

  if (newPassword) {
    const hashed = await bcrypt.hash(newPassword, 10);
    const { error: updateErr } = await supabase
      .from('teams')
      .update({ password: hashed })
      .eq('id', team.id);

    if (updateErr) {
      console.error('Chyba při nastavování hesla:', updateErr.message);
      process.exit(1);
    }
    console.log('\nHeslo bylo úspěšně změněno.');
  } else {
    console.log('\nPro nastavení nového hesla spusť:');
    console.log(`  npx tsx scripts/check-reset-team.ts ${email} NOVE_HESLO`);
  }
}

main();
