#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT=3000

log() {
  echo "[dev:reset] $*"
}

get_port_pids() {
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null | sort -u || true
}

get_pid_cwd() {
  local pid="$1"
  lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | awk '/^n/{print substr($0,2)}' | head -n 1
}

get_pid_args() {
  local pid="$1"
  ps -p "$pid" -o args= 2>/dev/null || true
}

is_next_process() {
  local args="$1"
  [[ "$args" == *"next dev"* || "$args" == *"next/dist"* || "$args" == *"next-server"* ]]
}

PORT_PIDS=()
while IFS= read -r pid; do
  [[ -n "$pid" ]] && PORT_PIDS+=("$pid")
done < <(get_port_pids)

if (( ${#PORT_PIDS[@]} == 0 )); then
  log "No listener on :$PORT."
else
  WORKSPACE_PIDS=()
  FOREIGN_PIDS=()

  for pid in "${PORT_PIDS[@]}"; do
    cwd="$(get_pid_cwd "$pid")"
    args="$(get_pid_args "$pid")"
    if [[ "$cwd" == "$ROOT_DIR" ]] && is_next_process "$args"; then
      WORKSPACE_PIDS+=("$pid")
    else
      FOREIGN_PIDS+=("$pid")
    fi
  done

  if (( ${#FOREIGN_PIDS[@]} > 0 )); then
    log "Refusing to kill non-workspace listener(s) on :$PORT: ${FOREIGN_PIDS[*]}"
    log "Run diagnostics: npm run diag:chunks"
    exit 1
  fi

  if (( ${#WORKSPACE_PIDS[@]} > 1 )); then
    log "Detected multiple workspace Next listeners: ${WORKSPACE_PIDS[*]}"
  fi

  if (( ${#WORKSPACE_PIDS[@]} > 0 )); then
    log "Stopping workspace Next listener(s): ${WORKSPACE_PIDS[*]}"
    kill "${WORKSPACE_PIDS[@]}"
  fi
fi

for _ in {1..20}; do
  sleep 0.2
  if [[ -z "$(get_port_pids)" ]]; then
    break
  fi
done

if [[ -n "$(get_port_pids)" ]]; then
  log "Port :$PORT is still occupied. Aborting."
  log "Run diagnostics: npm run diag:chunks"
  exit 1
fi

cd "$ROOT_DIR"
log "Removing .next cache"
rm -rf .next

log "Starting clean dev server"
exec npm run dev
