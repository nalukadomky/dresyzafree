/**
 * SKRIPT PRO BROWSER KONZOLI - EUROFOTBAL.CZ
 * 
 * INSTRUKCE:
 * 1. Otevřete stránku: https://www.eurofotbal.cz/kluby/cesko/
 * 2. Otevřete Developer Tools (F12)
 * 3. Přejděte na záložku Console
 * 4. Zkopírujte a vložte celý tento skript
 * 5. Stiskněte Enter
 * 6. Počkejte na dokončení
 * 7. Výsledky budou zkopírovány do clipboardu a zobrazeny v konzoli
 */

(async function() {
  console.log('🔍 Začínám stahování klubů z EuroFotbal.cz...\n');
  
  const allClubs = new Set();
  
  // Najdeme všechny odkazy na kluby
  // EuroFotbal.cz zobrazuje kluby jako seznam odkazů
  const clubLinks = document.querySelectorAll('a[href*="/kluby/"]');
  
  console.log(`📋 Nalezeno ${clubLinks.length} odkazů na kluby\n`);
  
  clubLinks.forEach((link, index) => {
    const clubName = link.textContent.trim();
    
    // Filtrujeme pouze platné názvy klubů
    if (clubName && 
        clubName.length > 2 && 
        clubName.length < 100 &&
        !clubName.includes('Kluby') &&
        !clubName.includes('Česko') &&
        !clubName.includes('Přehled') &&
        !clubName.match(/^\d+$/) &&
        !clubName.match(/^[A-Z]$/)) {
      allClubs.add(clubName);
    }
  });
  
  // Pokud jsou kluby v seznamech <li>
  const listItems = document.querySelectorAll('li');
  listItems.forEach(li => {
    const text = li.textContent.trim();
    const link = li.querySelector('a[href*="/kluby/"]');
    
    if (link) {
      const clubName = link.textContent.trim();
      if (clubName && 
          clubName.length > 2 && 
          clubName.length < 100 &&
          !clubName.includes('Kluby') &&
          !clubName.includes('Česko') &&
          !clubName.includes('Přehled') &&
          !clubName.match(/^\d+$/) &&
          !clubName.match(/^[A-Z]$/)) {
        allClubs.add(clubName);
      }
    } else if (text && 
               (text.includes('FK') || text.includes('FC') || text.includes('SK') || 
                text.includes('TJ') || text.includes('AC') || text.includes('Sparta') ||
                text.includes('Slavia') || text.includes('Baník') || text.includes('Bohemians') ||
                text.includes('Dynamo') || text.includes('Viktoria') || text.includes('Slovan') ||
                text.includes('Spartak') || text.includes('Union') || text.includes('Admira') ||
                text.includes('Dukla') || text.includes('Zbrojovka') || text.includes('Vysočina'))) {
      const cleanText = text.trim();
      if (cleanText.length > 2 && cleanText.length < 100 &&
          !cleanText.includes('Kluby') &&
          !cleanText.includes('Česko') &&
          !cleanText.includes('Přehled') &&
          !cleanText.match(/^\d+$/) &&
          !cleanText.match(/^[A-Z]$/)) {
        allClubs.add(cleanText);
      }
    }
  });
  
  // Seřadíme výsledky
  const sortedClubs = Array.from(allClubs).sort();
  
  console.log(`📊 Statistiky:`);
  console.log(`   Celkem nalezeno: ${sortedClubs.length} unikátních klubů\n`);
  
  // Vytvoříme formátovaný výstup
  const clubsString = sortedClubs.map(club => `  '${club.replace(/'/g, "\\'")}',`).join('\n');
  const fullContent = `// Seznam českých fotbalových klubů z EuroFotbal.cz
// Automaticky vygenerováno z oficiálních zdrojů
// Datum: ${new Date().toISOString()}
// Celkem klubů: ${sortedClubs.length}

export const CZECH_FOOTBALL_CLUBS_EUROFOTBAL = [
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
    console.log('⚠ Nepodařilo se zkopírovat do clipboardu, zobrazuji výsledky:');
    console.log(fullContent);
  }
  
  console.log('\n📋 Prvních 50 klubů:');
  sortedClubs.slice(0, 50).forEach((club, i) => {
    console.log(`   ${i + 1}. ${club}`);
  });
  
  if (sortedClubs.length > 50) {
    console.log(`   ... a dalších ${sortedClubs.length - 50} klubů`);
  }
  
  console.log('\n💡 Vložte obsah z clipboardu do souboru data/czech-football-clubs.ts');
  console.log('   nebo použijte výsledky zobrazené výše.\n');
  
  return sortedClubs;
})();

