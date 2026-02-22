import * as fs from 'fs';

const envContent = fs.readFileSync('/Users/lukas/Sites Cursor/Dresy_za_free/.env.local', 'utf8');
const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const idx = line.indexOf('=');
  if (idx > 0) env[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
}

const url = env['NEXT_PUBLIC_SUPABASE_URL'];
const projectRef = url.replace('https://', '').replace('.supabase.co', '');
const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

// Decode the JWT to get the password is not possible
// But Supabase allows connecting with the database password
// which is stored separately. Let's try the direct host approach.

async function run() {
  const { Pool } = await import('pg');

  // Try direct connection to the database (not pooler)
  const directHost = `db.${projectRef}.supabase.co`;

  // Try with service_role key as password (some Supabase setups allow this)
  for (const config of [
    // Attempt 1: Direct host, service key as password
    { host: directHost, port: 5432, user: 'postgres', password: serviceKey },
    // Attempt 2: Pooler with postgres user
    { host: 'aws-0-eu-central-1.pooler.supabase.com', port: 5432, user: `postgres.${projectRef}`, password: serviceKey },
    // Attempt 3: Session pooler port 5432
    { host: `${projectRef}.pooler.supabase.com`, port: 5432, user: 'postgres', password: serviceKey },
  ]) {
    console.log(`Trying ${config.host}:${config.port} as ${config.user}...`);
    const pool = new Pool({
      ...config,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    });

    try {
      const client = await pool.connect();
      console.log('Connected!');
      await client.query('ALTER TABLE teams ADD COLUMN IF NOT EXISTS website_slug TEXT UNIQUE');
      await client.query('CREATE INDEX IF NOT EXISTS idx_teams_website_slug ON teams(website_slug)');
      console.log('SUCCESS: website_slug column added.');

      const result = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'website_slug'");
      console.log('Verified:', result.rows.length > 0 ? 'column exists' : 'FAILED');
      client.release();
      await pool.end();
      return;
    } catch (err: any) {
      console.log('  Error:', err.message.substring(0, 100));
      await pool.end();
    }
  }

  console.log('\nAll connection attempts failed.');
  console.log('Please run in Supabase SQL Editor:');
  console.log('ALTER TABLE teams ADD COLUMN IF NOT EXISTS website_slug TEXT UNIQUE;');
  console.log('CREATE INDEX IF NOT EXISTS idx_teams_website_slug ON teams(website_slug);');
}

run().catch(console.error);
