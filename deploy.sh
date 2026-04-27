#!/usr/bin/env bash
set -euo pipefail

echo "Pull latest code..."
git pull

echo "Start/update stack..."
docker compose up -d --build --remove-orphans

echo "Done. Running containers:"
docker ps
