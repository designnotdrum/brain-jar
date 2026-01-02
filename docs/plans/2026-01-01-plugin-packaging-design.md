# Perplexity Search Plugin Packaging Design

## Goal

Package the existing Perplexity Search MCP server as a Claude Code plugin for one-command installation with full automation.

## Requirements

1. **One-command install** - `claude plugin install <path>` handles everything
2. **Interactive setup** - Prompts for API key during install, validates, saves config
3. **Bundled skill** - Skill auto-registers on install, updates with plugin
4. **Personal distribution first** - Install from local path or git URL
5. **Public-ready** - Structure supports future marketplace submission

## Plugin Structure

```
perplexity-search-plugin/
├── manifest.json              # Plugin metadata + MCP server definition
├── dist/
│   └── index.js               # Compiled MCP server
├── skills/
│   └── using-perplexity-for-context.md
├── hooks/
│   └── post-install.js        # Interactive setup wizard
├── src/                       # Source (development only)
├── package.json
└── README.md
```

## manifest.json

```json
{
  "name": "perplexity-search",
  "version": "1.0.0",
  "description": "Web search via Perplexity AI with smart context detection",
  "author": "Nick Mason",
  "license": "MIT",
  "homepage": "https://github.com/...",

  "mcpServers": {
    "perplexity-search": {
      "command": "node",
      "args": ["${pluginDir}/dist/index.js"]
    }
  },

  "skills": ["skills/using-perplexity-for-context.md"],

  "hooks": {
    "postInstall": "hooks/post-install.js"
  }
}
```

## Install Flow

```
claude plugin install ~/path/to/perplexity-search-plugin
  │
  ├─► Copy plugin to ~/.claude/plugins/perplexity-search/
  │
  ├─► Run hooks/post-install.js
  │     ├─► Prompt for Perplexity API key
  │     ├─► Validate key (must start with pplx-)
  │     ├─► Save to ~/.claude/perplexity-search/config.json
  │     └─► Confirm success
  │
  ├─► Register MCP server in Claude settings
  │
  ├─► Register bundled skills
  │
  └─► Done - restart Claude Code to activate
```

## Uninstall Behavior

- Remove plugin files from `~/.claude/plugins/`
- Deregister MCP server from settings
- **Preserve** user config (`~/.claude/perplexity-search/`) - never delete user data

## Changes From Current Implementation

| Current | Plugin Version |
|---------|----------------|
| Wizard runs when MCP starts without config | Wizard runs as post-install hook |
| User manually edits `~/.claude.json` | Plugin system registers MCP automatically |
| Skill copied via wizard prompt | Skill bundled, auto-registered |
| Install = clone + npm install + build | Install = one `claude plugin install` command |

## Files to Create

1. **manifest.json** - Plugin metadata (new)
2. **hooks/post-install.js** - Extract wizard logic from src/index.ts
3. **skills/using-perplexity-for-context.md** - Move from docs/skills/

## Files to Modify

1. **package.json** - Add `build:plugin` script
2. **src/index.ts** - Remove wizard logic (moves to hook), keep MCP server only

## Build Script

Add to package.json:

```json
{
  "scripts": {
    "build:plugin": "npm run build && node scripts/package-plugin.js"
  }
}
```

The `package-plugin.js` script:
1. Creates `release/` directory
2. Copies manifest.json, dist/, skills/, hooks/
3. Outputs ready-to-install plugin package

## Distribution

**Phase 1 (Personal):**
```bash
claude plugin install ~/workspace-local/code/ai-stuff/claude-code/perplexity-search-plugin
# or
claude plugin install https://github.com/nickmason/perplexity-search-plugin
```

**Phase 2 (Public):**
- Push to public GitHub repo
- Submit to marketplace
- Users install: `claude plugin install perplexity-search@marketplace`

## Config Storage

Unchanged from current:
- `~/.claude/perplexity-search/config.json` - API key + settings
- `~/.claude/perplexity-search/user-profile.json` - Profile context data
