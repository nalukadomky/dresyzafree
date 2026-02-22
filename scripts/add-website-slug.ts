import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envContent = fs.readFileSync('/Users/lukas/Sites Cursor/Dresy_za_free/.env.local', 'utf8');
const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const idx = line.indexOf('=');
  if (idx > 0) {
    env[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
  }
}

const url = env['NEXT_PUBLIC_SUPABASE_URL'];
const key = env['SUPABASE_SERVICE_ROLE_KEY'];

const client = createClient(url, key);

async function main() {
  // Check if column already exists
  const { error: checkErr } = await client.from('teams').select('website_slug').limit(1);
  if (!checkErr) {
    console.log('Column website_slug already exists. Nothing to do.');
    return;
  }

  console.log('Column website_slug missing. Adding via raw SQL...');

  // Use Supabase's SQL endpoint (management API)
  const projectRef = url.replace('https://', '').replace('.supabase.co', '');
  const mgmtUrl = `https://${projectRef}.supabase.co/rest/v1/`;

  // Since we can't run DDL via PostgREST, we need to use a workaround
  // Create a temporary function to add the column
  const { error: rpcErr } = await client.rpc('add_website_slug_column');

  if (rpcErr) {
    console.log('RPC not available. Please run this SQL manually in Supabase SQL Editor:');
    console.log('');
    console.log('ALTER TABLE teams ADD COLUMN IF NOT EXISTS website_slug TEXT UNIQUE;');
    console.log('CREATE INDEX IF NOT EXISTS idx_teams_website_slug ON teams(website_slug);');
    console.log('');
    console.log('Or create this RPC function first:');
    console.log(`
CREATE OR REPLACE FUNCTION add_website_slug_column()
RETURNS void AS $$
BEGIN
  ALTER TABLE teams ADD COLUMN IF NOT EXISTS website_slug TEXT UNIQUE;
  CREATE INDEX IF NOT EXISTS idx_teams_website_slug ON teams(website_slug);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
  } else {
    // Verify
    const { error: verifyErr } = await client.from('teams').select('website_slug').limit(1);
    if (verifyErr) {
      console.log('ERROR: Column still missing after RPC call:', verifyErr.message);
    } else {
      console.log('SUCCESS: website_slug column added.');
    }
  }
}

main().catch(console.error);
