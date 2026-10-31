#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=========================================================="
echo " Starting Brightloop Software - Subscription Management   "
echo " (SMS Desktop Application)                               "
echo "=========================================================="

# Check if node/bun is running on port 3001
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
  echo "Backend API is already running on port 3001."
else
  echo "Starting Backend API on port 3001..."
  nohup bun run server/index.ts > /tmp/brightloop-api.log 2>&1 &
  sleep 2
fi

echo "Brightloop SMS is active at:"
echo "👉 http://localhost:3001"
echo ""

# Open browser if DISPLAY is set
if [ -n "$DISPLAY" ]; then
  if which firefox >/dev/null 2>&1; then
    firefox "http://localhost:3001" &
  elif which google-chrome >/dev/null 2>&1; then
    google-chrome --app="http://localhost:3001" &
  elif which xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3001" &
  fi
fi

echo "Application started successfully! Press Ctrl+C to exit launcher."
