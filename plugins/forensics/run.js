#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

const distPath = path.join(__dirname, 'dist', 'index.js');

// Check if dist exists, if not run build
const fs = require('fs');
if (!fs.existsSync(distPath)) {
  console.error('[forensics] Building plugin...');
  const build = spawn('npm', ['run', 'build'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });
  build.on('close', (code) => {
    if (code === 0) {
      require(distPath);
    } else {
      console.error('[forensics] Build failed');
      process.exit(1);
    }
  });
} else {
  require(distPath);
}
