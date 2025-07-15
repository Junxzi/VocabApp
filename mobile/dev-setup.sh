#!/usr/bin/env bash
set -e

echo "🚀 Starting development environment"

# 0. Cleanup existing servers to avoid port conflicts
echo "[0/3] Cleaning up any running servers..."
pkill -f 'react-native start' 2>/dev/null || true
pkill -f 'tsx server/index.ts' 2>/dev/null || true
pkill -f 'node dist/index.js' 2>/dev/null || true

# 1. Backend server
echo "[1/3] Starting backend server..."
(
  cd ../server
  npm run dev
)&
BACKEND_PID=$!

# 2. Metro Bundler
echo "[2/4] Starting Metro Bundler..."
npx react-native start --reset-cache &
METRO_PID=$!

# 3. CocoaPods dependencies
echo "[3/4] Installing iOS CocoaPods dependencies..."
cd ios
pod install
cd ..

# 4. Build & install iOS app
echo "[4/4] Building and installing iOS app on Simulator..."
npx react-native run-ios

echo ""
echo "✅ Development environment is up!"
echo "   Backend PID: $BACKEND_PID"
echo "   Metro PID:   $METRO_PID"
echo ""
echo "To stop everything, run: kill $BACKEND_PID $METRO_PID"