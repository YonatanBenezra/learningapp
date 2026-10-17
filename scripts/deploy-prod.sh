#!/usr/bin/env bash
# Run on labpath-prod after: cd ~/learningapp && git pull --ff-only origin main
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/learningapp}"
cd "$APP_DIR"

npm ci
npm run prisma:generate -w @labpath/api
npm run prisma:migrate:deploy -w @labpath/api
npm run content:sync-catalogue -w @labpath/api
npm run content:seed-core-15 -w @labpath/api
npm run build:api

cd apps/web
NEXT_PUBLIC_API_URL="/api" npm run build
cd "$APP_DIR"

pm2 restart api web worker
pm2 save

curl -sS http://127.0.0.1:3001/api/health
echo ""
curl -sS http://127.0.0.1:3001/api/health/ready
echo ""
