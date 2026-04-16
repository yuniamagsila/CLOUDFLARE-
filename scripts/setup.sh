#!/usr/bin/env bash
set -euo pipefail

echo "== KARYO OS Cloudflare Setup =="

command -v node >/dev/null 2>&1 || { echo "Node.js >= 20 required"; exit 1; }
node -e "process.exit(parseInt(process.versions.node, 10) >= 20 ? 0 : 1)" || { echo "Node.js >= 20 required"; exit 1; }

npm ci

if [[ ! -f .env.local ]]; then
  cat > .env.local <<ENV
VITE_APP_NAME=Karyo OS
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=/api
ENV
  echo "Created .env.local"
fi

echo "Setup complete"
