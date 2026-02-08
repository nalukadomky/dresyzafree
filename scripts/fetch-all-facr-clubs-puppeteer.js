/**
 * Skript pro získání VŠECH klubů z FAČR pomocí Puppeteer
 * Tento skript automaticky projde všechny soutěže a stáhne kluby
 * 
 * Instalace: npm install puppeteer
 * Spuštění: node scripts/fetch-all-facr-clubs-puppeteer.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://skfs.msquare.cz/cz/s2213/Adresare/c2242-Kluby/multipage-2214-1-6';

async function fetchAllClubs() {
  console.log('🔍 Začínám stahování všech klubů z FAČR pomocí Puppeteer...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Zobrazíme browser pro debugging
    defaultViewport: { width: 1280, height: 720 }
  });
  
  try {
    const page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    
    console.log('📋 Načítám seznam soutěží...');
    
    // Získáme všechny možnosti z selectu
    const competitions = await page.evaluate(() => {
      const select = document.querySelector('select[name*="DisciplineId"]') || 
                     document.querySelector('#filter_club_list_filter_class-club') ||
                     document.querySelector('select[id*="class-club"]');
      
      if (!select) return [];
      
      const options = Array.from(select.options);
      return options
        .filter(opt => opt.value && opt.value !== '')
        .map(opt => ({
          value: opt.value,
          name: opt.text.trim()
        }));
    });
    
    console.log(`✅ Nalezeno ${competitions.length} soutěží\n`);
    
    const allClubs = new Set();
    
    // Projdeme každou soutěž
    for (let i = 0; i < competitions.length; i++) {
      const competition = competitions[i];
      process.stdout.write(`[${i + 1}/${competitions.length}] Zpracovávám: ${competition.name}... `);
      
      try {
        // Vybereme soutěž
        await page.evaluate((value) => {
          const select = document.querySelector('select[name*="DisciplineId"]') || 
                         document.querySelector('#filter_club_list_filter_class-club') ||
                         document.querySelector('select[id*="class-club"]');
          if (select) {
            select.value = value;
            const event = new Event('change', { bubbles: true });
            select.dispatchEvent(event);
          }
        }, competition.value);
        
        // Počkáme na načtení klubů (stránka používá AJAX)
        await page.waitForTimeout(2000);
        
        // Extrahujeme kluby
        const clubs = await page.evaluate(() => {
          const h4Elements = document.querySelectorAll('h4');
          return Array.from(h4Elements)
            .map(el => el.textContent.trim())
            .filter(text => 
              text && 
              text.length > 2 && 
              !text.includes('WebActionInfo') &&
              !text.includes('SKFS') &&
              !text.match(/^\d+$/) &&
              text.length < 100
            );
        });
        
        if (clubs.length > 0) {
          console.log(`✓ ${clubs.length} klubů`);
          clubs.forEach(club => allClubs.add(club));
        } else {
          console.log(`⚠ 0 klubů`);
        }
      } catch (error) {
        console.log(`✗ Chyba: ${error.message}`);
      }
    }
    
    // Seřadíme výsledky
    const sortedClubs = Array.from(allClubs).sort();
    
    console.log(`\n📊 Statistiky:`);
    console.log(`   Celkem nalezeno: ${sortedClubs.length} unikátních klubů\n`);
    
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
    const combinedClubs = Array.from(new Set([...existingClubs, ...sortedClubs]));
    combinedClubs.sort();
    
    console.log(`📝 Aktualizuji seznam klubů...`);
    console.log(`   Původní kluby: ${existingClubs.length}`);
    console.log(`   Nové kluby z FAČR: ${sortedClubs.length}`);
    console.log(`   Celkem po sloučení: ${combinedClubs.length}\n`);
    
    // Uložení do souboru
    const content = `// Seznam českých fotbalových klubů
// Automaticky vygenerováno z FAČR zdrojů (Středočeský kraj)
// Datum: ${new Date().toISOString()}
// Počet soutěží: ${competitions.length}
// Kluby z FAČR: ${sortedClubs.length}
// Celkem klubů: ${combinedClubs.length}

export const CZECH_FOOTBALL_CLUBS = [
${combinedClubs.map(club => `  '${club.replace(/'/g, "\\'")}',`).join('\n')}
];
`;
    
    fs.writeFileSync(existingClubsPath, content, 'utf-8');
    console.log(`✅ Seznam klubů aktualizován: ${existingClubsPath}`);
    
  } finally {
    await browser.close();
  }
}

// Zkontrolujeme, jestli je Puppeteer nainstalovaný
try {
  require('puppeteer');
  fetchAllClubs().catch(console.error);
} catch (error) {
  console.error('❌ Puppeteer není nainstalovaný!');
  console.error('📦 Instalujte ho pomocí: npm install puppeteer');
  console.error('\n💡 Alternativně můžete použít skript pro browser konzoli:');
  console.error('   scripts/fetch-all-facr-clubs-automated.js');
  process.exit(1);
}

