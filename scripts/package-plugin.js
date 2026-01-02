#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const RELEASE_DIR = 'release';

// Files/directories to include in plugin
const INCLUDE = [
  '.claude-plugin',
  'dist',
  'skills',
  'package.json',
  'README.md',
];

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function main() {
  // Clean release directory
  if (fs.existsSync(RELEASE_DIR)) {
    fs.rmSync(RELEASE_DIR, { recursive: true });
  }
  fs.mkdirSync(RELEASE_DIR);

  // Copy included files
  for (const item of INCLUDE) {
    const src = path.join(process.cwd(), item);
    const dest = path.join(process.cwd(), RELEASE_DIR, item);

    if (fs.existsSync(src)) {
      copyRecursive(src, dest);
      console.log(`✓ Copied ${item}`);
    } else {
      console.warn(`⚠ Skipped ${item} (not found)`);
    }
  }

  // Read version from package.json
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

  console.log(`\n✅ Plugin packaged to ${RELEASE_DIR}/`);
  console.log(`   Version: ${pkg.version}`);
  console.log(`\nTo install locally:`);
  console.log(`   claude plugin install ${path.resolve(RELEASE_DIR)}`);
}

main();
