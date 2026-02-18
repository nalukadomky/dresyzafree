/**
 * Test přidání hráče – ověří, že players API funguje
 * Spusť: npx tsx scripts/test-add-player.ts
 */

const BASE = 'http://localhost:3000';

async function main() {
  const unique = `test-${Date.now()}`;
  const teamData = {
    teamName: 'Test tým',
    contactPerson: 'Test',
    phone: '+420123456789',
    email: `${unique}@test.cz`,
    leagues: ['Chance liga'],
    username: unique,
    password: 'Heslo123!',
  };

  console.log('1. Registrace test týmu...');
  const regRes = await fetch(`${BASE}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(teamData),
  });
  if (!regRes.ok) {
    const err = await regRes.json();
    throw new Error(`Registrace selhala: ${JSON.stringify(err)}`);
  }
  console.log('   OK');

  console.log('2. Přihlášení...');
  const loginRes = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: unique, password: 'Heslo123!' }),
  });
  if (!loginRes.ok) {
    const err = await loginRes.json();
    throw new Error(`Login selhal: ${JSON.stringify(err)}`);
  }
  const { token, team } = await loginRes.json();
  const teamId = team.id;
  console.log('   OK, teamId:', teamId);

  console.log('3. Přidání hráče...');
  const addRes = await fetch(`${BASE}/api/teams/${teamId}/players`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: 'Jan Test' }),
  });
  if (!addRes.ok) {
    const err = await addRes.json();
    throw new Error(`Přidání hráče selhalo: ${JSON.stringify(err)}`);
  }
  const { player } = await addRes.json();
  console.log('   OK, přidán hráč:', player.name, '(id:', player.id + ')');

  console.log('4. Ověření – načtení seznamu hráčů...');
  const listRes = await fetch(`${BASE}/api/teams/${teamId}/players`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listRes.ok) throw new Error('Načtení hráčů selhalo');
  const { players } = await listRes.json();
  console.log('   OK, počet hráčů:', players.length);
  if (players.length > 0) {
    console.log('   Hráči:', players.map((p: { name: string }) => p.name).join(', '));
  }

  console.log('\n✓ Všechny testy prošly – přidávání hráčů funguje.');
}

main().catch((e) => {
  console.error('\n✗ Chyba:', e.message);
  process.exit(1);
});
