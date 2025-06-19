#!/bin/bash

# NewsFlow Minimal Installation Script
echo "Installing NewsFlow with minimal dependencies..."

# Backup current package.json
cp package.json package.json.backup

# Install only essential dependencies
npm install --save \
  express@^4.21.2 \
  mysql2@^3.14.1 \
  drizzle-orm@^0.39.3 \
  rss-parser@^3.13.0 \
  openai@^5.3.0 \
  openid-client@^6.5.1 \
  passport@^0.7.0 \
  express-session@^1.18.1 \
  zod@^3.24.2 \
  nanoid@^5.1.5

# Install essential dev dependencies
npm install --save-dev \
  @types/express@4.17.21 \
  @types/node@20.16.11 \
  typescript@5.6.3 \
  tsx@^4.19.1 \
  esbuild@^0.25.0 \
  drizzle-kit@^0.30.4

# Remove heavy dependencies
npm uninstall \
  @radix-ui/react-accordion \
  @radix-ui/react-alert-dialog \
  @radix-ui/react-aspect-ratio \
  @radix-ui/react-avatar \
  @radix-ui/react-checkbox \
  @radix-ui/react-collapsible \
  @radix-ui/react-context-menu \
  @radix-ui/react-hover-card \
  @radix-ui/react-menubar \
  @radix-ui/react-navigation-menu \
  @radix-ui/react-popover \
  @radix-ui/react-progress \
  @radix-ui/react-radio-group \
  @radix-ui/react-scroll-area \
  @radix-ui/react-separator \
  @radix-ui/react-slider \
  @radix-ui/react-switch \
  @radix-ui/react-toggle \
  @radix-ui/react-toggle-group \
  @radix-ui/react-tooltip \
  embla-carousel-react \
  framer-motion \
  recharts \
  better-sqlite3 \
  @neondatabase/serverless

echo "Minimal installation complete!"
echo "Run with: NODE_OPTIONS='--max-old-space-size=512' npm start"