#!/bin/sh
set -eu

# Runtime value > baked default > hardcoded fallback.
RUNTIME_API_URL="${VITE_API_URL:-${BAKED_VITE_API_URL:-http://localhost:3000}}"
RUNTIME_BASE_URL="${VITE_BASE_URL:-${BAKED_VITE_BASE_URL:-/}}"
RUNTIME_PORT="${APP_PORT:-4173}"

export VITE_API_URL="${RUNTIME_API_URL}"
export VITE_BASE_URL="${RUNTIME_BASE_URL}"

echo "Building app with:"
echo "  VITE_API_URL=${VITE_API_URL}"
echo "  VITE_BASE_URL=${VITE_BASE_URL}"

npm run build

exec npm run preview -- --host 0.0.0.0 --port "${RUNTIME_PORT}"
