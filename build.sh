#!/bin/bash
echo "🚀 Building KTV Dashboard..."
cd "$(dirname "$0")"
npm install
npm run build
echo "✅ Build complete! Files are in /dist"