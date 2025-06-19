#!/bin/bash

# NewsFlow Memory-Optimized Startup Script
# This script handles the WebAssembly memory error

echo "Starting NewsFlow with memory optimizations..."

# Set Node.js memory options
export NODE_OPTIONS="--max-old-space-size=512 --optimize-for-size --gc-interval=100"

# Check if built version exists
if [ ! -f "dist/index.js" ]; then
    echo "Building NewsFlow..."
    NODE_OPTIONS="--max-old-space-size=1024" npm run build
fi

# Start the application
echo "Starting NewsFlow server..."
NODE_ENV=production node dist/index.js