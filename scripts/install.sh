#!/bin/bash
set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

echo "🚀 Installing dependencies and PM2..."

# Install PM2 globally
sudo npm install -g pm2

# Install project dependencies
npm install

# Save PM2 so it can restart automatically after reboot
pm2 startup systemd -u ec2-user --hp /home/ec2-user || true
pm2 save

echo "✅ Installation complete!"
