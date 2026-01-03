#!/usr/bin/env node
/**
 * Perplexity Search MCP Server launcher.
 *
 * Uses pre-built bundle when available (marketplace installs).
 * Falls back to npm install + build for development.
 */
const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');

const root = __dirname;
process.chdir(root);

const bundlePath = join(root, 'dist', 'bundle.js');
const indexPath = join(root, 'dist', 'index.js');

// Prefer bundle (no npm install needed)
if (existsSync(bundlePath)) {
  require(bundlePath);
} else if (existsSync(indexPath)) {
  // Development: dist exists but no bundle
  require(indexPath);
} else {
  // Full development setup: install deps and build
  console.error('[perplexity-search] Development mode: installing dependencies...');
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  console.error('[perplexity-search] Building...');
  execSync('npm run build', { stdio: 'inherit' });
  require(indexPath);
}
