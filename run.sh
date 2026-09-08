#!/usr/bin/env bash
# Starts the ElderSphere frontend for local development.
# - Installs dependencies on first run (if node_modules is missing).
# - Runs the Vite dev server in the foreground.
#
# Usage: ./run.sh
# Expects the backend to be reachable at the URL in .env (VITE_API_BASE_URL) —
# start it first with ../eldersphere-be/run.sh if it isn't already running.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

PORT="${PORT:-5174}"

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT is already in use — is the frontend already running?"
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "==> Installing dependencies (first run)..."
  npm install
fi

if ! curl -sf http://localhost:8080/api/v1/health >/dev/null 2>&1; then
  echo "WARNING: backend does not appear to be running at http://localhost:8080"
  echo "         Start it first with: ../eldersphere-be/run.sh"
  echo ""
fi

echo "==> Starting ElderSphere frontend on port $PORT..."
echo "    App will be at http://localhost:$PORT"
echo ""

exec npm run dev -- --port "$PORT"
