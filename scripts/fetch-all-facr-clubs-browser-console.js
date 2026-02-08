/**
 * SKRIPT PRO BROWSER KONZOLI
 * 
 * INSTRUKCE:
 * 1. Otevřete stránku: http://skfs.msquare.cz/cz/s2213/Adresare/c2242-Kluby/multipage-2214-1-6
 * 2. Otevřete Developer Tools (F12)
 * 3. Přejděte na záložku Console
 * 4. Zkopírujte a vložte celý tento skript
 * 5. Stiskněte Enter
 * 6. Počkejte na dokončení (může trvat několik minut)
 * 7. Výsledky budou zkopírovány do clipboardu a zobrazeny v konzoli
 */

(async function() {
  console.log('🔍 Začínám stahování všech klubů z FAČR...\n');
  
  // Najdeme select element
  const select = document.querySelector('select[name*="DisciplineId"]') || 
                 document.querySelector('#filter_club_list_filter_class-club') ||
                 document.querySelector('select[id*="class-club"]');
  
  if (!select) {
    console.error('❌ Nepodařilo se najít select element!');
    console.error('Zkontrolujte, že jste na správné stránce.');
    return;
  }
  
  console.log(`✅ Nalezen select element s ${select.options.length} možnostmi\n`);
  
  const allClubs = new Set();
  const competitions = [];
  
  // Získáme seznam všech soutěží
  for (let i = 0; i < select.options.length; i++) {
    const option = select.options[i];
    if (option.value && option.value !== '') {
      competitions.push({
        value: option.value,
        name: option.text.trim()
      });
    }
  }
  
  console.log(`📋 Nalezeno ${competitions.length} soutěží\n`);
  console.log('⏳ Začínám procházení soutěží (může trvat několik minut)...\n');
  
  // Projdeme každou soutěž
  for (let i = 0; i < competitions.length; i++) {
    const competition = competitions[i];
    process.stdout?.write(`[${i + 1}/${competitions.length}] ${competition.name}... `) || 
    console.log(`[${i + 1}/${competitions.length}] Zpracovávám: ${competition.name}`);
    
    try {
      // Vybereme soutěž
      select.value = competition.value;
      
      // Spustíme change event (stránka používá onchange)
      const event = new Event('change', { bubbles: true });
      select.dispatchEvent(event);
      
      // Počkáme na načtení (stránka používá AJAX)
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Extrahujeme kluby z <h4> tagů
      const h4Elements = document.querySelectorAll('h4');
      const clubs = Array.from(h4Elements)
        .map(el => el.textContent.trim())
        .filter(text => 
          text && 
          text.length > 2 && 
          !text.includes('WebActionInfo') &&
          !text.includes('SKFS') &&
          !text.match(/^\d+$/) &&
          text.length < 100
        );
      
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
  
  // Vytvoříme formátovaný výstup pro TypeScript
  const clubsString = sortedClubs.map(club => `  '${club.replace(/'/g, "\\'")}',`).join('\n');
  const fullContent = `// Seznam českých fotbalových klubů z FAČR (Středočeský kraj)
// Automaticky vygenerováno z oficiálních zdrojů
// Datum: ${new Date().toISOString()}
// Počet soutěží: ${competitions.length}
// Celkem klubů: ${sortedClubs.length}

export const CZECH_FOOTBALL_CLUBS_FAČR = [
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
  
  console.log('\n📋 Prvních 30 klubů:');
  sortedClubs.slice(0, 30).forEach((club, i) => {
    console.log(`   ${i + 1}. ${club}`);
  });
  
  if (sortedClubs.length > 30) {
    console.log(`   ... a dalších ${sortedClubs.length - 30} klubů`);
  }
  
  console.log('\n💡 Vložte obsah z clipboardu do souboru data/czech-football-clubs.ts');
  console.log('   nebo použijte výsledky zobrazené výše.\n');
  
  // Vrátíme výsledky pro případné další použití
  return sortedClubs;
})();

