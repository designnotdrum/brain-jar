# Perplexity Search + Shared Memory Integration Design

**Date:** 2026-01-03
**Status:** ✅ Implemented
**Author:** Nick Mason + Claude

## Overview

Integrate perplexity-search and shared-memory plugins to enable:
1. **Profile compatibility** - Both plugins use the same profile schema
2. **Search memory** - Store past searches with summaries in Mem0
3. **Context-aware searching** - Use memories to enhance search queries

## Architecture

### Shared Core Package

Create `packages/core/` with shared code:

```
packages/core/
├── src/
│   ├── index.ts           # Public exports
│   ├── mem0-client.ts     # Mem0Client class
│   ├── config.ts          # loadConfig(), checkConfig()
│   └── types/
│       ├── profile.ts     # UserProfile, ProfileSnapshot
│       ├── memory.ts      # Memory, Summary interfaces
│       └── config.ts      # BrainJarConfig interface
├── package.json           # name: "@brain-jar/core"
└── tsconfig.json
```

Both plugins depend on `"@brain-jar/core": "workspace:*"`.

### shared-memory Changes

- Remove `src/mem0-client.ts`, `src/config.ts`, profile types
- Import from `@brain-jar/core`
- Keep plugin-specific: MCP tools, local-store, summary-manager, profile manager

### perplexity-search Changes

1. **Fix profile schema** - Use `UserProfile` from core
   - `profile.technical.languages` (not `profile.profile.technicalPreferences.languages`)

2. **Add Mem0 integration:**
   ```typescript
   const config = await loadConfig();
   this.mem0Client = config?.mem0_api_key
     ? new Mem0Client(config.mem0_api_key)
     : null;
   ```

3. **Store search summaries:**
   ```typescript
   if (this.mem0Client) {
     await this.mem0Client.add(
       `Searched: "${query}" - Found: ${summary}`,
       { type: 'search', query, scope: 'global' }
     );
   }
   ```

4. **Context-aware searching:**
   ```typescript
   const context = await this.mem0Client?.search(query, { limit: 3 });
   // Enrich query with recent relevant memories
   ```

## Graceful Degradation

| Config State | Profile Context | Search Memory | Basic Search |
|--------------|-----------------|---------------|--------------|
| Full config | Yes | Yes | Yes |
| No Mem0 key | Yes (local) | No | Yes |
| No config | No | No | Yes |

Errors are logged but never fail the search.

## Migration Steps

1. Create `packages/core/` - Extract from shared-memory
2. Update shared-memory - Import from core, delete duplicates
3. Update perplexity-search - Import from core, add Mem0 features
4. Run `npm install` from root (workspace linking)
5. Build all packages
6. Test independently

## Version Changes

- `@brain-jar/core`: 1.0.0 (new)
- `shared-memory`: 1.4.0 → 2.0.0 (breaking: extracted core)
- `perplexity-search`: 1.0.0 → 2.0.0 (breaking: new schema + Mem0)

## Workspace Setup

Root `package.json`:
```json
{
  "private": true,
  "workspaces": ["packages/*", "plugins/*"]
}
```

## Open Questions

None - design approved.
