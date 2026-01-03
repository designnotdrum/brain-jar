#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');

const root = __dirname;
process.chdir(root);

// Install dependencies if needed
if (!existsSync(join(root, 'node_modules'))) {
  console.error('[forensics] Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
}

// Build if needed
if (!existsSync(join(root, 'dist'))) {
  console.error('[forensics] Building...');
  execSync('npm run build', { stdio: 'inherit' });
}

// Start the MCP server
require('./dist/index.js');
