# Získání všech klubů z různých zdrojů

## Dostupné zdroje

### 1. EuroFotbal.cz (DOPORUČENO - 18137 klubů)
**URL:** https://www.eurofotbal.cz/kluby/cesko/

**Postup:**
1. Otevřete stránku v prohlížeči
2. Otevřete Developer Tools (F12) → Console
3. Zkopírujte a vložte obsah souboru `scripts/fetch-clubs-eurofotbal-browser.js`
4. Stiskněte Enter
5. Výsledky budou zkopírovány do clipboardu

**Výhody:**
- Obsahuje nejvíce klubů (18137)
- Jednoduchá struktura stránky
- Rychlé načtení

### 2. Wikipedie (soutěže)
**URL:** https://cs.wikipedia.org/wiki/Systém_fotbalových_soutěží_v_Česku

**Postup:**
1. Otevřete stránku v prohlížeči
2. Otevřete Developer Tools (F12) → Console
3. Zkopírujte a vložte obsah souboru `scripts/fetch-clubs-wikipedia-browser.js`
4. Stiskněte Enter
5. Výsledky budou zkopírovány do clipboardu

**Výhody:**
- Oficiální zdroj
- Strukturované podle soutěží
- Obsahuje informace o soutěžích

### 3. FAČR (Středočeský kraj)
**URL:** http://skfs.msquare.cz/cz/s2213/Adresare/c2242-Kluby/multipage-2214-1-6

**Postup:**
1. Otevřete stránku v prohlížeči
2. Otevřete Developer Tools (F12) → Console
3. Zkopírujte a vložte obsah souboru `scripts/fetch-all-facr-clubs-browser-console.js`
4. Stiskněte Enter
5. Počkejte na dokončení (projde všechny soutěže)
6. Výsledky budou zkopírovány do clipboardu

**Výhody:**
- Oficiální zdroj FAČR
- Obsahuje kluby z konkrétního kraje
- Strukturované podle soutěží

**Nevýhody:**
- Pouze Středočeský kraj
- Vyžaduje procházení všech soutěží (trvá několik minut)

## Aktualizace souboru

Po získání klubů z jakéhokoliv zdroje:

1. Zkopírujte výsledky z clipboardu
2. Otevřete soubor `data/czech-football-clubs.ts`
3. Nahraďte nebo sloučte s existujícími kluby
4. Ujistěte se, že jsou odstraněny duplicity

## Aktuální stav

- V souboru `data/czech-football-clubs.ts` je aktuálně **427 klubů**
- Z toho **12 klubů** je z FAČR (Středočeský kraj)
- Zbytek je z ručně vytvořeného seznamu

## Doporučení

Pro nejkompletnější seznam použijte **EuroFotbal.cz**, který obsahuje 18137 klubů.

