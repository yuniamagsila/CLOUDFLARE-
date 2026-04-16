#!/usr/bin/env bash
set -euo pipefail

echo "== KARYO OS Cloudflare Deploy =="

npm run build
npm run d1:migrate:remote
npm run deploy:worker
npm run deploy:pages

echo "Deploy complete"
