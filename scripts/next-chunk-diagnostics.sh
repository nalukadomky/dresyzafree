#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${1:-3000}"

echo "=== Next Chunk Diagnostics ==="
echo "Workspace: $ROOT_DIR"
echo "Port: $PORT"
echo

echo "== Active listeners on :$PORT =="
lsof -nP -iTCP:"$PORT" -sTCP:LISTEN || true
echo

echo "== .next entries =="
ls -la "$ROOT_DIR" | grep '\.next' || true
echo

echo "== .next/server/chunks =="
ls -la "$ROOT_DIR/.next/server/chunks" 2>/dev/null || echo "No chunks directory"
echo

echo "== webpack-runtime.js (first 80 lines) =="
sed -n '1,80p' "$ROOT_DIR/.next/server/webpack-runtime.js" 2>/dev/null || echo "No webpack-runtime.js"
echo
