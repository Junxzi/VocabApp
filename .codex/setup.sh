#!/usr/bin/env bash
set -euo pipefail

# Install dependencies for the root project
echo "Installing root dependencies..."
npm install

# Install dependencies for the React Native mobile app
if [ -d mobile ]; then
  echo "Installing mobile dependencies..."
  pushd mobile
  npm install
  popd
fi

# Run the category setup script
echo "Running category setup script..."
npx -y ts-node server/setup-categories.ts
