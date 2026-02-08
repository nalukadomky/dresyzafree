/**
 * Skript pro získání VŠECH klubů z FAČR webu procházením všech soutěží
 * Používá Node.js s fetch API
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://skfs.msquare.cz/cz/s2213/Adresare/c2242-Kluby/multipage-2214-1-6';

async function fetchHTML(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return await response.text();
  } catch (error) {
    console.error(`Chyba při stahování ${url}:`, error.message);
    return '';
  }
}

function extractCompetitions(html) {
  const competitions = [];
  const optionRegex = /<option value="(\d+)">([^<]+)<\/option>/g;
  let match;
  
  while ((match = optionRegex.exec(html)) !== null) {
    const value = match[1];
    const name = match[2].trim();
    if (value && name && name !== '') {
      competitions.push({ value, name });
    }
  }
  
  return competitions;
}

function extractWebActionInfo(html) {
  const match = html.match(/name="WebActionInfo" value="([^"]+)"/);
  return match ? match[1] : null;
}

function extractClubs(html) {
  const clubs = [];
  const h4Regex = /<h4[^>]*>([^<]+)<\/h4>/g;
  let match;
  
  while ((match = h4Regex.exec(html)) !== null) {
    const clubName = match[1].trim();
    if (clubName && 
        clubName.length > 2 && 
        !clubName.includes('WebActionInfo') &&
        !clubName.includes('SKFS') &&
        !clubName.match(/^\d+$/) &&
        clubName.length < 100) {
      clubs.push(clubName);
    }
  }
  
  return clubs;
}

async function fetchClubsForCompetition(competitionValue, competitionName, webActionInfo) {
  try {
    // Vytvoříme POST data
    const formData = new URLSearchParams();
    formData.append('filter_club_list_filter_filter_club_list_filter_DisciplineId', competitionValue);
    formData.append('filter_club_list_filter_filter_club_list_filter_Name', '');
    formData.append('WebActionInfo', webActionInfo);
    
    const html = await fetchHTML(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': BASE_URL,
      },
      body: formData.toString()
    });
    
    const clubs = extractClubs(html);
    return clubs;
  } catch (error) {
    console.error(`  ✗ Chyba při načítání klubů ze soutěže ${competitionName}:`, error.message);
    return [];
  }
}

async function main() {
  console.log('🔍 Začínám stahování všech klubů z FAČR...\n');
  
  // Získáme základní HTML
  console.log('📋 Načítám seznam soutěží...');
  const baseHTML = await fetchHTML(BASE_URL);
  const competitions = extractCompetitions(baseHTML);
  const webActionInfo = extractWebActionInfo(baseHTML);
  
  if (!webActionInfo) {
    console.error('❌ Nepodařilo se získat WebActionInfo token!');
    return;
  }
  
  console.log(`✅ Nalezeno ${competitions.length} soutěží\n`);
  
  const allClubs = [];
  let processed = 0;
  let totalClubs = 0;
  
  // Projdeme každou soutěž
  for (const competition of competitions) {
    processed++;
    process.stdout.write(`[${processed}/${competitions.length}] Zpracovávám: ${competition.name}... `);
    
    const clubs = await fetchClubsForCompetition(competition.value, competition.name, webActionInfo);
    
    if (clubs.length > 0) {
      console.log(`✓ ${clubs.length} klubů`);
      allClubs.push(...clubs);
      totalClubs += clubs.length;
    } else {
      console.log(`⚠ 0 klubů`);
    }
    
    // Malá pauza, abychom nepřetížili server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Odstranění duplicit
  const uniqueClubs = Array.from(new Set(allClubs));
  uniqueClubs.sort();
  
  console.log(`\n📊 Statistiky:`);
  console.log(`   Celkem nalezeno: ${totalClubs} klubů`);
  console.log(`   Po odstranění duplicit: ${uniqueClubs.length} unikátních klubů\n`);
  
  // Načteme existující kluby
  const existingClubsPath = path.join(process.cwd(), 'data', 'czech-football-clubs.ts');
  let existingClubs = [];
  
  if (fs.existsSync(existingClubsPath)) {
    const existingContent = fs.readFileSync(existingClubsPath, 'utf-8');
    const existingMatch = existingContent.match(/'([^']+)'/g);
    if (existingMatch) {
      existingClubs = existingMatch.map(m => m.replace(/'/g, ''));
    }
  }
  
  // Zkombinujeme existující a nové kluby
  const combinedClubs = Array.from(new Set([...existingClubs, ...uniqueClubs]));
  combinedClubs.sort();
  
  console.log(`📝 Aktualizuji seznam klubů...`);
  console.log(`   Původní kluby: ${existingClubs.length}`);
  console.log(`   Nové kluby z FAČR: ${uniqueClubs.length}`);
  console.log(`   Celkem po sloučení: ${combinedClubs.length}\n`);
  
  // Uložení do souboru
  const content = `// Seznam českých fotbalových klubů
// Automaticky vygenerováno z FAČR zdrojů (Středočeský kraj)
// Datum: ${new Date().toISOString()}
// Počet soutěží: ${competitions.length}
// Kluby z FAČR: ${uniqueClubs.length}
// Celkem klubů: ${combinedClubs.length}

export const CZECH_FOOTBALL_CLUBS = [
${combinedClubs.map(club => `  '${club.replace(/'/g, "\\'")}',`).join('\n')}
];
`;
  
  fs.writeFileSync(existingClubsPath, content, 'utf-8');
  console.log(`✅ Seznam klubů aktualizován: ${existingClubsPath}`);
}

main().catch(console.error);

