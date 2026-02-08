# Získání všech klubů z FAČR

## Problém
Stránka FAČR vyžaduje POST requesty s WebActionInfo tokenem, který se mění při každém requestu. Jednoduché HTTP requesty bez správné session nefungují.

## Řešení

### Metoda 1: Browser Console Script (DOPORUČENO)

1. Otevřete stránku: http://skfs.msquare.cz/cz/s2213/Adresare/c2242-Kluby/multipage-2214-1-6
2. Otevřete Developer Tools (F12)
3. Přejděte na záložku Console
4. Zkopírujte a vložte celý obsah souboru `scripts/fetch-all-facr-clubs-browser-console.js`
5. Stiskněte Enter
6. Počkejte na dokončení (může trvat několik minut pro všechny soutěže)
7. Výsledky budou zkopírovány do clipboardu
8. Vložte obsah do souboru `data/czech-football-clubs.ts` nebo použijte zobrazené výsledky

### Metoda 2: Puppeteer (Pokročilé)

1. Nainstalujte Puppeteer: `npm install puppeteer`
2. Spusťte: `node scripts/fetch-all-facr-clubs-puppeteer.js`
3. Skript automaticky projde všechny soutěže a aktualizuje soubor

### Metoda 3: Ruční procházení

1. Otevřete stránku v prohlížeči
2. Pro každou soutěž v dropdownu:
   - Vyberte soutěž
   - Počkejte na načtení klubů
   - Zkopírujte názvy klubů z `<h4>` tagů
   - Přidejte je do `data/czech-football-clubs.ts`

## Aktuální stav

- V souboru `data/czech-football-clubs.ts` je aktuálně **427 klubů**
- Z toho **12 klubů** je z výchozí stránky FAČR
- Pro získání všech klubů ze všech soutěží je potřeba použít jednu z výše uvedených metod

## Poznámky

- Stránka používá AJAX pro načítání klubů, takže je potřeba počkat na načtení po změně soutěže
- Doporučená doba čekání: 2-3 sekundy mezi změnami soutěží
- Celkový čas pro všechny soutěže: cca 2-5 minut

