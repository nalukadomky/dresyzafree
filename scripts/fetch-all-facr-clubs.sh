#!/bin/bash

# Skript pro získání VŠECH klubů z FAČR webu procházením všech soutěží

BASE_URL="http://skfs.msquare.cz/cz/s2213/Adresare/c2242-Kluby/multipage-2214-1-6"
OUTPUT_FILE="data/czech-football-clubs-facr.txt"
TEMP_DIR=$(mktemp -d)

echo "🔍 Začínám stahování všech klubů z FAČR..."
echo ""

# Stáhneme základní HTML a extrahujeme všechny soutěže
echo "📋 Načítám seznam soutěží..."
curl -s "$BASE_URL" > "$TEMP_DIR/base.html"

# Extrahujeme hodnoty soutěží
COMPETITIONS=$(grep -oE '<option value="[0-9]+">[^<]+</option>' "$TEMP_DIR/base.html" | grep -v 'value=""' | sed 's/<option value="\([0-9]*\)">\([^<]*\)<\/option>/\1|\2/')

TOTAL=$(echo "$COMPETITIONS" | wc -l | tr -d ' ')
echo "✅ Nalezeno $TOTAL soutěží"
echo ""

# Projdeme každou soutěž
COUNTER=0
ALL_CLUBS=""

while IFS='|' read -r VALUE NAME; do
    COUNTER=$((COUNTER + 1))
    echo "[$COUNTER/$TOTAL] Zpracovávám: $NAME"
    
    # Zkusíme získat kluby pro tuto soutěž
    # Stránka může vyžadovat POST, ale zkusíme GET s parametrem
    HTML=$(curl -s "$BASE_URL?DisciplineId=$VALUE")
    
    # Extrahujeme kluby z <h4> tagů
    CLUBS=$(echo "$HTML" | grep -oE '<h4[^>]*>[^<]+</h4>' | sed 's/<h4[^>]*>\([^<]*\)<\/h4>/\1/' | grep -v 'WebActionInfo' | grep -v 'SKFS' | grep -v '^[0-9]*$' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | grep -v '^$')
    
    if [ -n "$CLUBS" ]; then
        CLUB_COUNT=$(echo "$CLUBS" | wc -l | tr -d ' ')
        echo "  ✓ Nalezeno $CLUB_COUNT klubů"
        ALL_CLUBS="${ALL_CLUBS}${CLUBS}"$'\n'
    else
        echo "  ⚠ Nenalezeny žádné kluby"
    fi
    
    # Malá pauza
    sleep 0.3
done <<< "$COMPETITIONS"

echo ""
echo "📊 Zpracovávám výsledky..."

# Odstraníme duplicity a seřadíme
UNIQUE_CLUBS=$(echo "$ALL_CLUBS" | sort -u | grep -v '^$')
TOTAL_CLUBS=$(echo "$UNIQUE_CLUBS" | wc -l | tr -d ' ')

echo "✅ Celkem nalezeno $TOTAL_CLUBS unikátních klubů"
echo ""

# Uložíme do souboru
echo "$UNIQUE_CLUBS" > "$OUTPUT_FILE"
echo "💾 Seznam klubů uložen do: $OUTPUT_FILE"

# Vyčistíme
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Hotovo!"

