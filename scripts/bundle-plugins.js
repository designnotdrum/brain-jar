#!/usr/bin/env node
/**
 * Bundle plugins for standalone operation.
 *
 * This creates a single-file bundle for each plugin that includes all
 * dependencies, allowing them to run without npm install when installed
 * from the marketplace.
 */

const { build } = require('esbuild');
const path = require('path');
const fs = require('fs');

const PLUGINS_DIR = path.join(__dirname, '..', 'plugins');

// Plugins to bundle
const PLUGINS = [
  'shared-memory',
  'perplexity-search',
  'forensics',
  'pattern-radar',
  'visual-thinking',
];

// Packages that must remain external (native modules, etc.)
// These will need to be installed at runtime
const ALWAYS_EXTERNAL = [
  // better-sqlite3 is a native module
  'better-sqlite3',
];

async function bundlePlugin(pluginName) {
  const pluginDir = path.join(PLUGINS_DIR, pluginName);
  const entryPoint = path.join(pluginDir, 'src', 'index.ts');
  const outfile = path.join(pluginDir, 'dist', 'bundle.js');

  console.log(`Bundling ${pluginName}...`);

  // Check if entry point exists
  if (!fs.existsSync(entryPoint)) {
    console.error(`  Entry point not found: ${entryPoint}`);
    return false;
  }

  // Ensure dist directory exists
  const distDir = path.join(pluginDir, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  try {
    await build({
      entryPoints: [entryPoint],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outfile,
      format: 'cjs',
      external: ALWAYS_EXTERNAL,
      // Resolve @brain-jar/core from workspace
      alias: {
        '@brain-jar/core': path.join(__dirname, '..', 'packages', 'core', 'src', 'index.ts'),
      },
      sourcemap: false,
      minify: false, // Keep readable for debugging
      // Handle __dirname and __filename in the bundle
      define: {
        'import.meta.url': 'undefined', // Disable ESM-specific features
      },
    });

    console.log(`  Created: ${outfile}`);

    // Create distribution package.json without @brain-jar/core
    const pkgPath = path.join(pluginDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    // Remove workspace dependencies
    if (pkg.dependencies) {
      delete pkg.dependencies['@brain-jar/core'];
    }

    // Keep only native module dependencies that can't be bundled
    const nativeDeps = {};
    for (const dep of ALWAYS_EXTERNAL) {
      if (pkg.dependencies && pkg.dependencies[dep]) {
        nativeDeps[dep] = pkg.dependencies[dep];
      }
    }
    pkg.dependencies = nativeDeps;

    // Remove devDependencies for distribution
    delete pkg.devDependencies;

    // Remove all scripts except start (prevents postinstall from running)
    pkg.scripts = {};

    // Write distribution package.json
    const distPkgPath = path.join(distDir, 'package.json');
    fs.writeFileSync(distPkgPath, JSON.stringify(pkg, null, 2));
    console.log(`  Created: ${distPkgPath}`);

    return true;
  } catch (error) {
    console.error(`  Bundle failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('Bundling plugins for standalone operation...\n');

  let success = 0;
  let failed = 0;

  for (const plugin of PLUGINS) {
    if (await bundlePlugin(plugin)) {
      success++;
    } else {
      failed++;
    }
  }

  console.log(`\nComplete: ${success} succeeded, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
