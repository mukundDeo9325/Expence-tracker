#!/usr/bin/env bash
# TrackMySpends launcher. Ports and the backend entry point come from config.json.
#
#   ./entrypoint.sh             start the backend and the frontend together
#   ./entrypoint.sh backend     start only the API
#   ./entrypoint.sh frontend    start only the Expo app
#   ./entrypoint.sh help        show this message
#
# The backend needs MongoDB running at MONGO_URL (see backend/.env).
# The frontend works on its own: expenses are stored on the device.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG="$ROOT/config.json"

config_value() {
  python3 - "$CONFIG" "$1" <<'PY'
import json, sys

value = json.load(open(sys.argv[1]))
for key in sys.argv[2].split("."):
    value = value[key]
print(value)
PY
}

usage() {
  sed -n '2,10p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

start_backend() {
  local host port entry
  host="$(config_value backend.host)"
  port="$(config_value backend.port)"
  entry="$(config_value backend.entry)"

  cd "$ROOT/backend"
  if [ ! -d .venv ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
  fi
  # shellcheck disable=SC1091
  source .venv/bin/activate

  if [ ! -f .venv/.deps-installed ] || [ requirements.txt -nt .venv/.deps-installed ]; then
    echo "Installing backend dependencies..."
    # emergentintegrations is not on public PyPI and server.py does not import it,
    # so it is skipped here. Everything else in requirements.txt is installed.
    grep -v '^emergentintegrations' requirements.txt > .venv/requirements.filtered.txt
    pip install -r .venv/requirements.filtered.txt
    touch .venv/.deps-installed
  fi

  exec uvicorn "$entry" --host "$host" --port "$port" --reload
}

start_frontend() {
  local port
  port="$(config_value frontend.port)"

  cd "$ROOT/frontend"
  if [ ! -d node_modules ]; then
    echo "Installing frontend dependencies..."
    yarn install
  fi

  yarn start --port "$port"
}

case "${1:-all}" in
  backend)
    start_backend
    ;;
  frontend)
    start_frontend
    ;;
  all)
    (start_backend) &
    BACKEND_PID=$!
    trap 'kill "$BACKEND_PID" 2>/dev/null || true' EXIT INT TERM
    start_frontend
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    echo "Unknown option: $1" >&2
    usage >&2
    exit 1
    ;;
esac
