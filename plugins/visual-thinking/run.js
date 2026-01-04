#!/usr/bin/env node
/**
 * Visual Thinking MCP Server launcher.
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
const distPkgPath = join(root, 'dist', 'package.json');

// Check if better-sqlite3 native module is installed
const hasSqlite = existsSync(join(root, 'node_modules', 'better-sqlite3'));

// Prefer bundle (minimal install needed)
if (existsSync(bundlePath)) {
  if (!hasSqlite && existsSync(distPkgPath)) {
    // Install only native modules from dist/package.json (fast)
    console.error('[visual-thinking] Installing native modules...');
    execSync('npm install --prefix . --package-lock=false', {
      stdio: 'inherit',
      cwd: join(root, 'dist'),
      env: { ...process.env, npm_config_package_lock: 'false' }
    });
    // Move node_modules to root for bundle to find
    if (existsSync(join(root, 'dist', 'node_modules'))) {
      // Merge into existing node_modules if present, otherwise move
      if (existsSync(join(root, 'node_modules'))) {
        execSync('cp -r dist/node_modules/* node_modules/', { cwd: root });
        execSync('rm -rf dist/node_modules', { cwd: root });
      } else {
        execSync('mv dist/node_modules .', { cwd: root });
      }
    }
  }
  require(bundlePath);
} else if (existsSync(indexPath)) {
  // Development: dist exists but no bundle
  if (!hasSqlite) {
    console.error('[visual-thinking] Installing dependencies...');
    execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  }
  require(indexPath);
} else {
  // Full development setup: install deps and build
  console.error('[visual-thinking] Development mode: installing dependencies...');
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  console.error('[visual-thinking] Building...');
  execSync('npm run build', { stdio: 'inherit' });
  require(indexPath);
}
