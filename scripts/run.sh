#!/bin/bash
set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

echo "🚀 Starting app with PM2..."

# Start the app using npm start, managed by PM2
pm2 start npm --name "my-api" -- run start

# Optional: show PM2 list
pm2 list

echo "✅ App started under PM2!"
