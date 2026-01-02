# Brain-Jar Development Guidelines

## Plugin Structure (CRITICAL)

**Claude Code expects `plugin.json` inside a `.claude-plugin/` subdirectory, NOT at the root level!**

```
plugins/my-plugin/
├── .claude-plugin/
│   └── plugin.json      <-- MUST be here!
├── run.js
├── package.json
├── src/
│   └── index.ts
├── dist/
└── skills/
```

## UX Patterns for Claude Code Plugins

### N00b-Proof Installation

All plugins MUST work immediately after marketplace installation with zero manual steps:

1. **Auto-install dependencies**: `run.js` checks for `node_modules` and runs `npm install` if missing
2. **Auto-build**: `run.js` checks for `dist` and runs `npm run build` if missing
3. **Prompt for config on first run**: Use `@inquirer/prompts` in `run.js` to ask for API keys BEFORE starting the MCP server
4. **Graceful fallback**: If user skips config, plugin should still work with reduced functionality (e.g., local-only storage)

### run.js Pattern

Every plugin needs a `run.js` that:

```javascript
#!/usr/bin/env node
const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');

const root = __dirname;
process.chdir(root);

// 1. Auto-install
if (!existsSync(join(root, 'node_modules'))) {
  execSync('npm install', { stdio: 'inherit' });
}

// 2. Auto-build
if (!existsSync(join(root, 'dist'))) {
  execSync('npm run build', { stdio: 'inherit' });
}

// 3. Check config and prompt if missing (use @inquirer/prompts)
// ... prompt logic here ...

// 4. Start MCP server
require('./dist/index.js');
```

### Config Prompting

- Use `@inquirer/prompts` for terminal-based prompts
- Prompt happens in `run.js` BEFORE requiring the MCP server
- Always allow skipping (press Enter for default/none)
- Save config to appropriate location (`~/.config/brain-jar/` or `~/.claude/plugin-name/`)

### MCP Server Behavior

- Server MUST start even without full config (graceful degradation)
- Log warnings to stderr about missing config, don't exit
- Tools should return helpful messages when features are unavailable due to missing config

### plugin.json Pattern

File location: `.claude-plugin/plugin.json`

```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "mcpServers": {
    "plugin-name": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/run.js"]
    }
  },
  "skills": "./skills/"
}
```

### Version Bumping

When making changes, update version in ALL these files:
- `package.json`
- `.claude-plugin/plugin.json`
- `src/index.ts` (McpServer version)
- Root `.claude-plugin/marketplace.json`

## Testing

Before pushing:
1. Remove config files to test first-run experience
2. Clear plugin cache: `rm -rf ~/.claude/plugins/cache/brain-jar`
3. Reinstall from marketplace
4. Verify prompt appears and plugin works
