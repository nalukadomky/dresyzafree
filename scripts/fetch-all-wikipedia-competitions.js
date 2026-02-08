/**
 * SKRIPT PRO BROWSER KONZOLI - WIKIPEDIE - VŠECHNY SOUTĚŽE
 * 
 * Tento skript projde všechny ligy a soutěže na Wikipedii včetně 7. ligy (I. B třídy)
 * a dalších nižších lig, kde jsou kluby jako Rejšice
 * 
 * INSTRUKCE:
 * 1. Otevřete stránku: https://cs.wikipedia.org/wiki/Systém_fotbalových_soutěží_v_Česku
 * 2. Otevřete Developer Tools (F12) → Console
 * 3. Zkopírujte a vložte celý tento skript
 * 4. Stiskněte Enter
 * 5. Počkejte na dokončení (může trvat několik minut)
 * 6. Výsledky budou zkopírovány do clipboardu
 */

(async function() {
  console.log('🔍 Začínám stahování klubů z Wikipedie - všechny soutěže včetně 7. ligy...\n');
  
  // Rozšířený seznam URL soutěží včetně nižších lig
  const competitionUrls = [
    // 1-2. liga
    'https://cs.wikipedia.org/wiki/1._%C4%8Desk%C3%A1_fotbalov%C3%A1_liga',
    'https://cs.wikipedia.org/wiki/2._%C4%8Desk%C3%A1_fotbalov%C3%A1_liga',
    
    // 3. ligy
    'https://cs.wikipedia.org/wiki/%C4%8Cesk%C3%A1_fotbalov%C3%A1_liga',
    'https://cs.wikipedia.org/wiki/Moravskoslezsk%C3%A1_fotbalov%C3%A1_liga',
    
    // 4. ligy (Divize)
    'https://cs.wikipedia.org/wiki/Divize_A',
    'https://cs.wikipedia.org/wiki/Divize_B',
    'https://cs.wikipedia.org/wiki/Divize_C',
    'https://cs.wikipedia.org/wiki/Divize_D',
    'https://cs.wikipedia.org/wiki/Divize_E',
    'https://cs.wikipedia.org/wiki/Divize_F',
    
    // 5. ligy (krajské přebory)
    'https://cs.wikipedia.org/wiki/Krajsk%C3%A9_p%C5%99ebory',
    'https://cs.wikipedia.org/wiki/Pra%C5%BEsk%C3%BD_p%C5%99ebor',
    
    // 6. ligy (I. A třídy)
    'https://cs.wikipedia.org/wiki/Fotbalov%C3%A9_I._A_t%C5%99%C3%ADdy',
    
    // 7. ligy (I. B třídy) - TADY JSOU KLUBY JAKO REJŠICE
    'https://cs.wikipedia.org/wiki/Fotbalov%C3%A9_I._B_t%C5%99%C3%ADdy',
    
    // 8. ligy (II. třídy)
    'https://cs.wikipedia.org/wiki/Fotbalov%C3%A9_II._t%C5%99%C3%ADdy',
    
    // 9. ligy (III. třídy)
    'https://cs.wikipedia.org/wiki/Fotbalov%C3%A9_III._t%C5%99%C3%ADdy',
    
    // 10. ligy (IV. třídy)
    'https://cs.wikipedia.org/wiki/Fotbalov%C3%A9_IV._t%C5%99%C3%ADdy',
  ];
  
  // Také najdeme všechny odkazy na konkrétní krajské soutěže ze stránky o systému soutěží
  const systemPageUrl = 'https://cs.wikipedia.org/wiki/Syst%C3%A9m_fotbalov%C3%BDch_sout%C4%9B%C5%BE%C3%AD_v_%C4%8Cesku';
  
  const allClubs = new Set();
  const allCompetitionUrls = [...competitionUrls];
  
  console.log(`📋 Začínám s ${allCompetitionUrls.length} základními soutěžemi...\n`);
  
  // Funkce pro extrakci klubů z HTML
  function extractClubsFromHTML(html) {
    const clubs = new Set();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // 1. Tabulky s kluby
    const tableCells = doc.querySelectorAll('td, th');
    tableCells.forEach(cell => {
      const text = cell.textContent.trim();
      if (text && 
          (text.includes('FK') || text.includes('FC') || text.includes('SK') || 
           text.includes('TJ') || text.includes('AC') || text.includes('Sparta') ||
           text.includes('Slavia') || text.includes('Baník') || text.includes('Bohemians') ||
           text.includes('Dynamo') || text.includes('Viktoria') || text.includes('Slovan') ||
           text.includes('Spartak') || text.includes('Union') || text.includes('Admira') ||
           text.includes('Dukla') || text.includes('Zbrojovka') || text.includes('Vysočina') ||
           text.includes('Rejšice') || text.includes('Sokol') || text.includes('Tatran'))) {
        const cleanText = text
          .replace(/\[.*?\]/g, '')
          .replace(/\([^)]*\)/g, '')
          .replace(/^\d+\.\s*/, '') // Odstraníme čísla na začátku
          .trim();
        
        if (cleanText.length > 2 && cleanText.length < 100 && 
            !cleanText.match(/^(P|Z|V|R|B|M|G|A|D|S|K|L|O|N|H|T|I|E|C|F|J|U|W|X|Y|Z)$/i) &&
            !cleanText.match(/^\d+$/) &&
            !cleanText.includes('Poznámka') &&
            !cleanText.includes('Reference') &&
            !cleanText.includes('Externí') &&
            !cleanText.includes('Kategorie') &&
            !cleanText.includes('Soutěž') &&
            !cleanText.includes('Liga')) {
          clubs.add(cleanText);
        }
      }
    });
    
    // 2. Seznamy klubů
    const listItems = doc.querySelectorAll('li');
    listItems.forEach(li => {
      const text = li.textContent.trim();
      if (text && 
          (text.includes('FK') || text.includes('FC') || text.includes('SK') || 
           text.includes('TJ') || text.includes('AC') || text.includes('Sparta') ||
           text.includes('Slavia') || text.includes('Baník') || text.includes('Bohemians') ||
           text.includes('Dynamo') || text.includes('Viktoria') || text.includes('Slovan') ||
           text.includes('Spartak') || text.includes('Union') || text.includes('Admira') ||
           text.includes('Dukla') || text.includes('Zbrojovka') || text.includes('Vysočina') ||
           text.includes('Rejšice') || text.includes('Sokol') || text.includes('Tatran'))) {
        const cleanText = text
          .replace(/\[.*?\]/g, '')
          .replace(/\([^)]*\)/g, '')
          .replace(/^\d+\.\s*/, '')
          .trim();
        
        if (cleanText.length > 2 && cleanText.length < 100 && 
            !cleanText.match(/^(P|Z|V|R|B|M|G|A|D|S|K|L|O|N|H|T|I|E|C|F|J|U|W|X|Y|Z)$/i) &&
            !cleanText.match(/^\d+$/) &&
            !cleanText.includes('Poznámka') &&
            !cleanText.includes('Reference')) {
          clubs.add(cleanText);
        }
      }
    });
    
    // 3. Odkazy na kluby
    const links = doc.querySelectorAll('a[href*="wiki"]');
    links.forEach(link => {
      const text = link.textContent.trim();
      if (text && 
          (text.includes('FK') || text.includes('FC') || text.includes('SK') || 
           text.includes('TJ') || text.includes('AC') || text.includes('Sparta') ||
           text.includes('Slavia') || text.includes('Baník') || text.includes('Bohemians') ||
           text.includes('Dynamo') || text.includes('Viktoria') || text.includes('Slovan') ||
           text.includes('Spartak') || text.includes('Union') || text.includes('Admira') ||
           text.includes('Dukla') || text.includes('Zbrojovka') || text.includes('Vysočina') ||
           text.includes('Rejšice') || text.includes('Sokol') || text.includes('Tatran'))) {
        const cleanText = text
          .replace(/\[.*?\]/g, '')
          .trim();
        
        if (cleanText.length > 2 && cleanText.length < 100 && 
            !cleanText.match(/^(P|Z|V|R|B|M|G|A|D|S|K|L|O|N|H|T|I|E|C|F|J|U|W|X|Y|Z)$/i) &&
            !cleanText.match(/^\d+$/) &&
            !cleanText.includes('Poznámka') &&
            !cleanText.includes('Reference')) {
          clubs.add(cleanText);
        }
      }
    });
    
    return Array.from(clubs);
  }
  
  // Projdeme všechny soutěže
  for (let i = 0; i < allCompetitionUrls.length; i++) {
    const url = allCompetitionUrls[i];
    const competitionName = decodeURIComponent(url.split('/').pop().replace(/_/g, ' '));
    
    console.log(`[${i + 1}/${allCompetitionUrls.length}] Zpracovávám: ${competitionName}`);
    
    try {
      const response = await fetch(url);
      const html = await response.text();
      const clubs = extractClubsFromHTML(html);
      
      if (clubs.length > 0) {
        console.log(`  ✓ Nalezeno ${clubs.length} klubů`);
        clubs.forEach(club => allClubs.add(club));
      } else {
        console.log(`  ⚠ Nenalezeny žádné kluby`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`  ✗ Chyba: ${error.message}`);
    }
  }
  
  // Seřadíme výsledky
  const sortedClubs = Array.from(allClubs).sort();
  
  console.log(`\n📊 Statistiky:`);
  console.log(`   Celkem nalezeno: ${sortedClubs.length} unikátních klubů`);
  
  // Zkontrolujeme, jestli je Rejšice v seznamu
  const rejsiceFound = sortedClubs.some(club => club.includes('Rejšice'));
  console.log(`   Rejšice nalezeno: ${rejsiceFound ? '✓ ANO' : '✗ NE'}\n`);
  
  // Vytvoříme formátovaný výstup
  const clubsString = sortedClubs.map(club => `  '${club.replace(/'/g, "\\'")}',`).join('\n');
  const fullContent = `// Seznam českých fotbalových klubů z Wikipedie
// Automaticky vygenerováno z oficiálních zdrojů včetně 7. ligy (I. B třídy)
// Datum: ${new Date().toISOString()}
// Celkem klubů: ${sortedClubs.length}

export const CZECH_FOOTBALL_CLUBS_WIKIPEDIA = [
${clubsString}
];`;
  
  // Zkopírujeme do clipboardu
  try {
    const textarea = document.createElement('textarea');
    textarea.value = fullContent;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    console.log('✅ Seznam klubů zkopírován do clipboardu!');
  } catch (error) {
    console.log('⚠ Nepodařilo se zkopírovat do clipboardu');
  }
  
  console.log('\n📋 Prvních 50 klubů:');
  sortedClubs.slice(0, 50).forEach((club, i) => {
    console.log(`   ${i + 1}. ${club}`);
  });
  
  if (sortedClubs.length > 50) {
    console.log(`   ... a dalších ${sortedClubs.length - 50} klubů`);
  }
  
  return sortedClubs;
})();

