/**
 * Run SQL migration against Supabase via Management API.
 * 
 * Usage:
 *   1. Get Personal Access Token from https://supabase.com/dashboard/account/tokens
 *   2. Add to .env.local: SUPABASE_ACCESS_TOKEN=sbp_xxxxx
 *   3. Run: node scripts/run-migration.mjs
 * 
 * Or pass token directly:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxxxx node scripts/run-migration.mjs
 */
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const token = process.env.SUPABASE_ACCESS_TOKEN;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!token) {
  console.error('ERROR: SUPABASE_ACCESS_TOKEN is not set.');
  console.error('');
  console.error('To get a Personal Access Token:');
  console.error('  1. Go to https://supabase.com/dashboard/account/tokens');
  console.error('  2. Click "Generate new token"');
  console.error('  3. Add to .env.local: SUPABASE_ACCESS_TOKEN=sbp_xxxxx');
  console.error('');
  console.error('Or run with: SUPABASE_ACCESS_TOKEN=sbp_xxxxx node scripts/run-migration.mjs');
  process.exit(1);
}

const match = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/);
const ref = match?.[1];

if (!ref) {
  console.error('ERROR: Could not extract project ref from NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

const sql = readFileSync('scripts/migrate-website-and-players.sql', 'utf-8');

console.log(`Project: ${ref}`);
console.log(`Running migration (${sql.length} chars)...`);
console.log('');

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: sql,
    read_only: false,
  }),
});

if (res.ok) {
  const data = await res.json();
  console.log('Migration completed successfully!');
  console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
} else {
  const text = await res.text();
  console.error(`Migration FAILED (HTTP ${res.status}):`);
  console.error(text);
  process.exit(1);
}
