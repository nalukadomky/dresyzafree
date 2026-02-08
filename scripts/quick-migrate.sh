#!/bin/bash

echo "🚀 Rychlá migrace do Supabase"
echo ""
echo "Tento skript potřebuje database password z Supabase."
echo "Najdeš ho v: Settings → Database → Connection string"
echo ""
echo "Zkusím použít Supabase CLI pro migraci..."
echo ""

# Zkusíme použít Supabase CLI
npx supabase link --project-ref hcmeehplfkywifolcgio 2>&1 || {
  echo "⚠️  Supabase CLI linkování selhalo"
  echo ""
  echo "📋 Musíš spustit SQL migraci ručně:"
  echo "   1. Otevři: https://app.supabase.com/project/hcmeehplfkywifolcgio/sql/new"
  echo "   2. Zkopíruj SQL z: supabase/migrations/001_initial_schema.sql"
  echo "   3. Vlož a klikni Run"
  echo ""
  exit 1
}

echo "✅ Projekt propojen!"
echo "📦 Spouštím migraci..."
npx supabase db push

