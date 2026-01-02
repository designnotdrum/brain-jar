# brain-jar Monorepo Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform perplexity-search-plugin into brain-jar monorepo with shared-memory plugin skeleton.

**Architecture:** Monorepo with two plugins (perplexity-search, shared-memory) under `plugins/` directory. Root marketplace.json lists both. Each plugin is self-contained with its own package.json, plugin.json, src/, and skills/.

**Tech Stack:** TypeScript, MCP SDK, Mem0 SDK, better-sqlite3, Jest

---

## Task 1: Create Monorepo Directory Structure

**Files:**
- Create: `plugins/` directory
- Create: `plugins/perplexity-search/` directory
- Create: `plugins/shared-memory/` directory

**Step 1: Create the plugin directories**

```bash
cd /Users/Nick/workspace-local/code/ai-stuff/claude-code/perplexity-search-plugin/.worktrees/brain-jar-monorepo
mkdir -p plugins/perplexity-search
mkdir -p plugins/shared-memory
```

**Step 2: Verify structure**

```bash
ls -la plugins/
```

Expected: Two empty directories `perplexity-search` and `shared-memory`

**Step 3: Commit**

```bash
git add plugins/
git commit -m "chore: create monorepo plugin directories"
```

---

## Task 2: Move perplexity-search Plugin Files

**Files:**
- Move: `src/` → `plugins/perplexity-search/src/`
- Move: `skills/` → `plugins/perplexity-search/skills/`
- Move: `package.json` → `plugins/perplexity-search/package.json`
- Move: `tsconfig.json` → `plugins/perplexity-search/tsconfig.json`
- Move: `jest.config.js` → `plugins/perplexity-search/jest.config.js`
- Move: `config.example.json` → `plugins/perplexity-search/config.example.json`
- Move: `.claude-plugin/plugin.json` → `plugins/perplexity-search/plugin.json`

**Step 1: Move source files**

```bash
cd /Users/Nick/workspace-local/code/ai-stuff/claude-code/perplexity-search-plugin/.worktrees/brain-jar-monorepo
mv src/ plugins/perplexity-search/
mv skills/ plugins/perplexity-search/
mv package.json plugins/perplexity-search/
mv package-lock.json plugins/perplexity-search/
mv tsconfig.json plugins/perplexity-search/
mv jest.config.js plugins/perplexity-search/
mv config.example.json plugins/perplexity-search/
```

**Step 2: Move and flatten plugin.json**

```bash
mv .claude-plugin/plugin.json plugins/perplexity-search/plugin.json
rm -rf .claude-plugin/
```

**Step 3: Verify move**

```bash
ls plugins/perplexity-search/
```

Expected: `src/`, `skills/`, `package.json`, `plugin.json`, `tsconfig.json`, `jest.config.js`, `config.example.json`

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move perplexity-search to plugins directory"
```

---

## Task 3: Update perplexity-search plugin.json Paths

**Files:**
- Modify: `plugins/perplexity-search/plugin.json`

**Step 1: Read current plugin.json**

Check current content to understand structure.

**Step 2: Update paths**

The plugin.json needs updated paths since it's no longer in `.claude-plugin/`:

```json
{
  "name": "perplexity-search",
  "version": "1.0.0",
  "description": "Web search via Perplexity AI with smart context detection",
  "author": {
    "name": "Nick Mason"
  },
  "license": "MIT",
  "keywords": ["perplexity", "search", "mcp", "web-search"],
  "mcpServers": {
    "perplexity-search": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/dist/index.js"]
    }
  },
  "skills": "./skills/"
}
```

Note: `${CLAUDE_PLUGIN_ROOT}` will resolve to the plugin directory, so paths remain the same.

**Step 3: Commit**

```bash
git add plugins/perplexity-search/plugin.json
git commit -m "fix: update perplexity-search plugin.json paths"
```

---

## Task 4: Create Root marketplace.json

**Files:**
- Create: `.claude-plugin/marketplace.json`

**Step 1: Create .claude-plugin directory**

```bash
cd /Users/Nick/workspace-local/code/ai-stuff/claude-code/perplexity-search-plugin/.worktrees/brain-jar-monorepo
mkdir -p .claude-plugin
```

**Step 2: Write marketplace.json**

```json
{
  "name": "brain-jar",
  "description": "Claude Code plugins for enhanced agent memory and search",
  "owner": {
    "name": "Nick Mason"
  },
  "plugins": [
    {
      "name": "perplexity-search",
      "description": "Web search via Perplexity AI with smart context detection",
      "version": "1.0.0",
      "source": "./plugins/perplexity-search",
      "author": {
        "name": "Nick Mason"
      }
    },
    {
      "name": "shared-memory",
      "description": "Persistent memory across agents with semantic search",
      "version": "0.1.0",
      "source": "./plugins/shared-memory",
      "author": {
        "name": "Nick Mason"
      }
    }
  ]
}
```

**Step 3: Commit**

```bash
git add .claude-plugin/marketplace.json
git commit -m "feat: add brain-jar marketplace.json"
```

---

## Task 5: Verify perplexity-search Still Works

**Files:**
- Test: `plugins/perplexity-search/src/**/*.test.ts`

**Step 1: Install dependencies**

```bash
cd /Users/Nick/workspace-local/code/ai-stuff/claude-code/perplexity-search-plugin/.worktrees/brain-jar-monorepo/plugins/perplexity-search
npm install
```

**Step 2: Run tests**

```bash
npm test
```

Expected: All 22 tests pass

**Step 3: Build**

```bash
npm run build
```

Expected: TypeScript compiles to `dist/` without errors

**Step 4: Commit if any fixes needed**

If tests or build fail, fix issues and commit.

---

## Task 6: Create shared-memory Plugin Skeleton - package.json

**Files:**
- Create: `plugins/shared-memory/package.json`

**Step 1: Write package.json**

```json
{
  "name": "shared-memory-mcp",
  "version": "0.1.0",
  "description": "MCP server providing persistent memory across agents via Mem0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "postinstall": "npm run build",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "typecheck": "tsc --noEmit"
  },
  "keywords": ["mcp", "memory", "mem0", "claude-code"],
  "author": "Nick Mason",
  "license": "MIT",
  "type": "commonjs",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.25.1",
    "mem0ai": "^0.1.0",
    "better-sqlite3": "^11.0.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^25.0.3",
    "jest": "^29.7.0",
    "ts-jest": "^29.4.6",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3"
  }
}
```

**Step 2: Commit**

```bash
git add plugins/shared-memory/package.json
git commit -m "feat(shared-memory): add package.json"
```

---

## Task 7: Create shared-memory Plugin Skeleton - TypeScript Config

**Files:**
- Create: `plugins/shared-memory/tsconfig.json`
- Create: `plugins/shared-memory/jest.config.js`

**Step 1: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 2: Write jest.config.js**

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts'],
};
```

**Step 3: Commit**

```bash
git add plugins/shared-memory/tsconfig.json plugins/shared-memory/jest.config.js
git commit -m "feat(shared-memory): add TypeScript and Jest config"
```

---

## Task 8: Create shared-memory Plugin Skeleton - plugin.json

**Files:**
- Create: `plugins/shared-memory/plugin.json`

**Step 1: Write plugin.json**

```json
{
  "name": "shared-memory",
  "version": "0.1.0",
  "description": "Persistent memory across agents with semantic search",
  "author": {
    "name": "Nick Mason"
  },
  "license": "MIT",
  "keywords": ["memory", "mem0", "mcp", "persistence"],
  "mcpServers": {
    "shared-memory": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/dist/index.js"]
    }
  },
  "skills": "./skills/"
}
```

**Step 2: Commit**

```bash
git add plugins/shared-memory/plugin.json
git commit -m "feat(shared-memory): add plugin.json manifest"
```

---

## Task 9: Create shared-memory MCP Server - Types

**Files:**
- Create: `plugins/shared-memory/src/types.ts`

**Step 1: Write types**

```typescript
export interface Memory {
  id: string;
  content: string;
  scope: string; // 'global' or 'project:<name>'
  tags: string[];
  source: {
    agent: string;
    action?: string;
  };
  created_at: Date;
  updated_at: Date;
}

export interface AddMemoryInput {
  content: string;
  scope?: string;
  tags?: string[];
}

export interface SearchMemoryInput {
  query: string;
  scope?: string;
  limit?: number;
}

export interface ListMemoriesInput {
  scope?: string;
  tags?: string[];
  since?: string;
  limit?: number;
}

export interface ConfigStatus {
  status: 'configured' | 'missing';
  apiKey?: string;
  configPath: string;
}
```

**Step 2: Commit**

```bash
git add plugins/shared-memory/src/types.ts
git commit -m "feat(shared-memory): add type definitions"
```

---

## Task 10: Create shared-memory MCP Server - Local Store

**Files:**
- Create: `plugins/shared-memory/src/local-store.ts`
- Create: `plugins/shared-memory/src/local-store.test.ts`

**Step 1: Write the test file**

```typescript
import { LocalStore } from './local-store';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('LocalStore', () => {
  let store: LocalStore;
  let testDbPath: string;

  beforeEach(() => {
    testDbPath = path.join(os.tmpdir(), `test-memory-${Date.now()}.db`);
    store = new LocalStore(testDbPath);
  });

  afterEach(() => {
    store.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('add', () => {
    it('should add a memory and return it with id', () => {
      const memory = store.add({
        content: 'Test memory content',
        scope: 'global',
        tags: ['test'],
      });

      expect(memory.id).toBeDefined();
      expect(memory.content).toBe('Test memory content');
      expect(memory.scope).toBe('global');
      expect(memory.tags).toEqual(['test']);
    });
  });

  describe('search', () => {
    it('should find memories by content substring', () => {
      store.add({ content: 'User prefers TypeScript', scope: 'global', tags: [] });
      store.add({ content: 'Project uses React', scope: 'project:test', tags: [] });

      const results = store.search('TypeScript');
      expect(results).toHaveLength(1);
      expect(results[0].content).toContain('TypeScript');
    });

    it('should filter by scope', () => {
      store.add({ content: 'Global memory', scope: 'global', tags: [] });
      store.add({ content: 'Project memory', scope: 'project:test', tags: [] });

      const results = store.search('memory', 'global');
      expect(results).toHaveLength(1);
      expect(results[0].scope).toBe('global');
    });
  });

  describe('list', () => {
    it('should list all memories', () => {
      store.add({ content: 'Memory 1', scope: 'global', tags: [] });
      store.add({ content: 'Memory 2', scope: 'global', tags: [] });

      const results = store.list();
      expect(results).toHaveLength(2);
    });

    it('should filter by tags', () => {
      store.add({ content: 'Tagged', scope: 'global', tags: ['important'] });
      store.add({ content: 'Untagged', scope: 'global', tags: [] });

      const results = store.list({ tags: ['important'] });
      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('Tagged');
    });
  });

  describe('delete', () => {
    it('should delete a memory by id', () => {
      const memory = store.add({ content: 'To delete', scope: 'global', tags: [] });

      const deleted = store.delete(memory.id);
      expect(deleted).toBe(true);

      const results = store.list();
      expect(results).toHaveLength(0);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/Nick/workspace-local/code/ai-stuff/claude-code/perplexity-search-plugin/.worktrees/brain-jar-monorepo/plugins/shared-memory
npm install
npm test
```

Expected: FAIL - LocalStore not found

**Step 3: Write the implementation**

```typescript
import Database from 'better-sqlite3';
import * as crypto from 'crypto';
import { Memory } from './types';

interface LocalMemory {
  id: string;
  content: string;
  scope: string;
  tags: string; // JSON string
  source_agent: string;
  source_action: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddInput {
  content: string;
  scope: string;
  tags: string[];
  source?: { agent: string; action?: string };
}

export interface ListOptions {
  scope?: string;
  tags?: string[];
  since?: Date;
  limit?: number;
}

export class LocalStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        scope TEXT NOT NULL DEFAULT 'global',
        tags TEXT NOT NULL DEFAULT '[]',
        source_agent TEXT NOT NULL DEFAULT 'claude-code',
        source_action TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_scope ON memories(scope);
      CREATE INDEX IF NOT EXISTS idx_created ON memories(created_at);
    `);
  }

  add(input: AddInput): Memory {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO memories (id, content, scope, tags, source_agent, source_action, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.content,
      input.scope,
      JSON.stringify(input.tags),
      input.source?.agent || 'claude-code',
      input.source?.action || null,
      now,
      now
    );

    return this.toMemory({
      id,
      content: input.content,
      scope: input.scope,
      tags: JSON.stringify(input.tags),
      source_agent: input.source?.agent || 'claude-code',
      source_action: input.source?.action || null,
      created_at: now,
      updated_at: now,
    });
  }

  search(query: string, scope?: string, limit: number = 10): Memory[] {
    let sql = `SELECT * FROM memories WHERE content LIKE ?`;
    const params: (string | number)[] = [`%${query}%`];

    if (scope) {
      sql += ` AND scope = ?`;
      params.push(scope);
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as LocalMemory[];
    return rows.map((row) => this.toMemory(row));
  }

  list(options: ListOptions = {}): Memory[] {
    let sql = `SELECT * FROM memories WHERE 1=1`;
    const params: (string | number)[] = [];

    if (options.scope) {
      sql += ` AND scope = ?`;
      params.push(options.scope);
    }

    if (options.tags && options.tags.length > 0) {
      for (const tag of options.tags) {
        sql += ` AND tags LIKE ?`;
        params.push(`%"${tag}"%`);
      }
    }

    if (options.since) {
      sql += ` AND created_at >= ?`;
      params.push(options.since.toISOString());
    }

    sql += ` ORDER BY created_at DESC`;

    if (options.limit) {
      sql += ` LIMIT ?`;
      params.push(options.limit);
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as LocalMemory[];
    return rows.map((row) => this.toMemory(row));
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM memories WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  close(): void {
    this.db.close();
  }

  private toMemory(row: LocalMemory): Memory {
    return {
      id: row.id,
      content: row.content,
      scope: row.scope,
      tags: JSON.parse(row.tags),
      source: {
        agent: row.source_agent,
        action: row.source_action || undefined,
      },
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All tests pass

**Step 5: Commit**

```bash
git add plugins/shared-memory/src/local-store.ts plugins/shared-memory/src/local-store.test.ts
git commit -m "feat(shared-memory): add local SQLite store with tests"
```

---

## Task 11: Create shared-memory MCP Server - Mem0 Client

**Files:**
- Create: `plugins/shared-memory/src/mem0-client.ts`

**Step 1: Write the Mem0 client wrapper**

```typescript
import { Memory } from './types';

// Mem0 SDK types (simplified)
interface Mem0Memory {
  id: string;
  memory: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

interface Mem0SearchResult {
  id: string;
  memory: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export class Mem0Client {
  private client: any; // mem0ai client
  private userId: string;

  constructor(apiKey: string, userId: string = 'default') {
    // Dynamic import to handle optional dependency
    const { MemoryClient } = require('mem0ai');
    this.client = new MemoryClient({ api_key: apiKey });
    this.userId = userId;
  }

  async add(content: string, metadata: Record<string, unknown> = {}): Promise<string> {
    const result = await this.client.add(content, {
      user_id: this.userId,
      metadata,
    });
    return result.id;
  }

  async search(query: string, limit: number = 10): Promise<Memory[]> {
    const results: Mem0SearchResult[] = await this.client.search(query, {
      user_id: this.userId,
      limit,
    });

    return results.map((r) => ({
      id: r.id,
      content: r.memory,
      scope: (r.metadata?.scope as string) || 'global',
      tags: (r.metadata?.tags as string[]) || [],
      source: {
        agent: (r.metadata?.source_agent as string) || 'unknown',
        action: r.metadata?.source_action as string | undefined,
      },
      created_at: new Date(),
      updated_at: new Date(),
    }));
  }

  async getAll(): Promise<Memory[]> {
    const results: Mem0Memory[] = await this.client.getAll({
      user_id: this.userId,
    });

    return results.map((r) => ({
      id: r.id,
      content: r.memory,
      scope: (r.metadata?.scope as string) || 'global',
      tags: (r.metadata?.tags as string[]) || [],
      source: {
        agent: (r.metadata?.source_agent as string) || 'unknown',
        action: r.metadata?.source_action as string | undefined,
      },
      created_at: r.created_at ? new Date(r.created_at) : new Date(),
      updated_at: r.updated_at ? new Date(r.updated_at) : new Date(),
    }));
  }

  async delete(memoryId: string): Promise<boolean> {
    try {
      await this.client.delete(memoryId);
      return true;
    } catch {
      return false;
    }
  }
}
```

**Step 2: Commit**

```bash
git add plugins/shared-memory/src/mem0-client.ts
git commit -m "feat(shared-memory): add Mem0 client wrapper"
```

---

## Task 12: Create shared-memory MCP Server - Config & Startup

**Files:**
- Create: `plugins/shared-memory/src/config.ts`

**Step 1: Write config module**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ConfigStatus } from './types';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'brain-jar');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface Config {
  mem0_api_key: string;
  default_scope: string;
  auto_summarize: boolean;
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function checkConfig(): ConfigStatus {
  if (!fs.existsSync(CONFIG_FILE)) {
    return { status: 'missing', configPath: CONFIG_FILE };
  }

  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(content) as Partial<Config>;

    if (!config.mem0_api_key) {
      return { status: 'missing', configPath: CONFIG_FILE };
    }

    return {
      status: 'configured',
      apiKey: config.mem0_api_key,
      configPath: CONFIG_FILE,
    };
  } catch {
    return { status: 'missing', configPath: CONFIG_FILE };
  }
}

export function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function loadConfig(): Config | null {
  const status = checkConfig();
  if (status.status === 'missing') {
    return null;
  }

  const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
  return JSON.parse(content) as Config;
}

export function getMissingConfigMessage(): string {
  return `
🧠 Mem0 API Key Required

To use shared-memory, you need a Mem0 API key:

1. Go to https://app.mem0.ai
2. Sign up (free tier: 10,000 memories)
3. Navigate to Settings → API Keys
4. Create and copy your key

Then run: node dist/index.js --setup

Or create ${CONFIG_FILE} with:
{
  "mem0_api_key": "your-key-here",
  "default_scope": "global",
  "auto_summarize": true
}
`.trim();
}
```

**Step 2: Commit**

```bash
git add plugins/shared-memory/src/config.ts
git commit -m "feat(shared-memory): add config management"
```

---

## Task 13: Create shared-memory MCP Server - Main Entry

**Files:**
- Create: `plugins/shared-memory/src/index.ts`

**Step 1: Write the MCP server**

```typescript
#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as path from 'path';
import * as os from 'os';

import { LocalStore } from './local-store';
import { Mem0Client } from './mem0-client';
import { checkConfig, loadConfig, saveConfig, getMissingConfigMessage, getConfigPath } from './config';
import { AddMemoryInput, SearchMemoryInput, ListMemoriesInput } from './types';

const LOCAL_DB_PATH = path.join(os.homedir(), '.config', 'brain-jar', 'local.db');

async function runSetup(): Promise<void> {
  const { input } = await import('@inquirer/prompts');

  console.log('\n🧠 Shared Memory Setup\n');
  console.log('To get your Mem0 API key:');
  console.log('1. Go to https://app.mem0.ai');
  console.log('2. Sign up (free tier: 10,000 memories)');
  console.log('3. Navigate to Settings → API Keys');
  console.log('4. Create and copy your key\n');

  const apiKey = await input({
    message: 'Enter your Mem0 API key:',
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return 'API key is required';
      }
      return true;
    },
  });

  saveConfig({
    mem0_api_key: apiKey.trim(),
    default_scope: 'global',
    auto_summarize: true,
  });

  console.log(`\n✓ Configuration saved to ${getConfigPath()}`);
  console.log('✓ Ready to use shared-memory!\n');
}

async function main(): Promise<void> {
  // Handle --setup flag
  if (process.argv.includes('--setup')) {
    await runSetup();
    process.exit(0);
  }

  // Check configuration
  const configStatus = checkConfig();
  if (configStatus.status === 'missing') {
    console.error(getMissingConfigMessage());
    process.exit(1);
  }

  const config = loadConfig()!;
  const localStore = new LocalStore(LOCAL_DB_PATH);
  const mem0Client = new Mem0Client(config.mem0_api_key);

  // Create MCP server
  const server = new McpServer({
    name: 'shared-memory',
    version: '0.1.0',
  });

  // Register tools
  server.tool(
    'add_memory',
    'Store a memory with enriched context',
    {
      content: z.string().describe('The memory content with context and sentiment'),
      scope: z.string().optional().describe('Scope: "global" or "project:<name>"'),
      tags: z.array(z.string()).optional().describe('Tags for categorization'),
    },
    async (args: AddMemoryInput) => {
      const scope = args.scope || config.default_scope;
      const tags = args.tags || [];

      // Store locally first (working memory)
      const memory = localStore.add({
        content: args.content,
        scope,
        tags,
        source: { agent: 'claude-code', action: 'explicit' },
      });

      // Also sync to Mem0 (persistent memory)
      try {
        await mem0Client.add(args.content, {
          scope,
          tags,
          source_agent: 'claude-code',
          source_action: 'explicit',
        });
      } catch (error) {
        // Log but don't fail - local storage succeeded
        console.error('[shared-memory] Mem0 sync failed:', error);
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `Memory stored (id: ${memory.id})`,
          },
        ],
      };
    }
  );

  server.tool(
    'search_memory',
    'Search memories semantically',
    {
      query: z.string().describe('Natural language search query'),
      scope: z.string().optional().describe('Filter by scope'),
      limit: z.number().optional().describe('Maximum results (default: 10)'),
    },
    async (args: SearchMemoryInput) => {
      const limit = args.limit || 10;

      // Try local first
      let results = localStore.search(args.query, args.scope, limit);

      // If few local results, also search Mem0
      if (results.length < limit) {
        try {
          const mem0Results = await mem0Client.search(args.query, limit);
          // Merge, avoiding duplicates by content
          const existingContent = new Set(results.map((r) => r.content));
          for (const r of mem0Results) {
            if (!existingContent.has(r.content)) {
              results.push(r);
            }
          }
        } catch (error) {
          console.error('[shared-memory] Mem0 search failed:', error);
        }
      }

      // Apply scope filter if specified
      if (args.scope) {
        results = results.filter((r) => r.scope === args.scope || r.scope === 'global');
      }

      return {
        content: [
          {
            type: 'text' as const,
            text:
              results.length > 0
                ? results.map((m) => `[${m.scope}] ${m.content}`).join('\n\n---\n\n')
                : 'No memories found.',
          },
        ],
      };
    }
  );

  server.tool(
    'list_memories',
    'List recent memories',
    {
      scope: z.string().optional().describe('Filter by scope'),
      tags: z.array(z.string()).optional().describe('Filter by tags'),
      limit: z.number().optional().describe('Maximum results'),
    },
    async (args: ListMemoriesInput) => {
      const results = localStore.list({
        scope: args.scope,
        tags: args.tags,
        limit: args.limit,
      });

      return {
        content: [
          {
            type: 'text' as const,
            text:
              results.length > 0
                ? results
                    .map(
                      (m) =>
                        `[${m.scope}] (${m.tags.join(', ') || 'no tags'})\n${m.content}`
                    )
                    .join('\n\n---\n\n')
                : 'No memories found.',
          },
        ],
      };
    }
  );

  server.tool(
    'delete_memory',
    'Delete a memory by ID',
    {
      id: z.string().describe('Memory ID to delete'),
    },
    async (args: { id: string }) => {
      const deleted = localStore.delete(args.id);

      // Also try to delete from Mem0
      try {
        await mem0Client.delete(args.id);
      } catch {
        // Ignore - might not exist in Mem0
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: deleted ? `Memory ${args.id} deleted.` : `Memory ${args.id} not found.`,
          },
        ],
      };
    }
  );

  // Connect transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[shared-memory] MCP server running on stdio');
}

main().catch((error) => {
  console.error('[shared-memory] Fatal error:', error);
  process.exit(1);
});
```

**Step 2: Commit**

```bash
git add plugins/shared-memory/src/index.ts
git commit -m "feat(shared-memory): add MCP server with memory tools"
```

---

## Task 14: Create shared-memory Skill

**Files:**
- Create: `plugins/shared-memory/skills/managing-memory/SKILL.md`

**Step 1: Create skills directory**

```bash
mkdir -p plugins/shared-memory/skills/managing-memory
```

**Step 2: Write the skill**

```markdown
---
name: managing-memory
description: "Guide for storing enriched memories that capture decisions, preferences, and context. Use when making significant decisions or learning user preferences."
allowed-tools:
  - mcp__shared-memory__add_memory
  - mcp__shared-memory__search_memory
  - mcp__shared-memory__list_memories
  - mcp__shared-memory__delete_memory
---

# Managing Memory

## When to Store Memories

Store memories when you observe:
- **Decisions** - User chooses one approach over another
- **Preferences** - User expresses likes/dislikes about tools, patterns, or approaches
- **Reactions** - Strong positive or negative responses (enthusiasm, frustration)
- **Context** - Important background about projects, goals, or constraints

## How to Write Enriched Memories

Bad (too dry):
```
User chose Neon for database.
```

Good (captures context and sentiment):
```
User chose Neon over Supabase for Postgres hosting - appreciated the more generous
free tier limits. Showed strong preference for managed solutions: "I'm not running
my own infra" - values simplicity and time savings over control.
```

## Memory Format

Include:
1. **The fact** - What was decided/learned
2. **The why** - Reasoning behind it
3. **The sentiment** - How they felt about it (quote if memorable)
4. **The implication** - What this suggests about future preferences

## Scope Selection

- `global` - Personal preferences, general learnings, cross-project patterns
- `project:<name>` - Specific to current project (detect from working directory)

Use `global` for preferences that apply everywhere. Use `project:` for architectural
decisions, tech choices, and patterns specific to one codebase.

## When to Recall Memories

Before:
- Starting a new feature (search for relevant past decisions)
- Making technology choices (search for preferences)
- Suggesting approaches (search for patterns they liked)

Use natural recall language:
- "Remember when you were working on X, you decided..."
- "You've mentioned before that you prefer..."
- "Based on your experience with Y..."

## Tags to Use

- `preference` - Likes/dislikes
- `decision` - Specific choices made
- `architecture` - System design patterns
- `personality` - Working style, communication preferences
- `project` - Project-specific context
- `session-summary` - End-of-session consolidation
```

**Step 3: Commit**

```bash
git add plugins/shared-memory/skills/
git commit -m "feat(shared-memory): add managing-memory skill"
```

---

## Task 15: Install Dependencies and Test Build

**Files:**
- Test: `plugins/shared-memory/`

**Step 1: Install dependencies**

```bash
cd /Users/Nick/workspace-local/code/ai-stuff/claude-code/perplexity-search-plugin/.worktrees/brain-jar-monorepo/plugins/shared-memory
npm install
```

**Step 2: Run tests**

```bash
npm test
```

Expected: Local store tests pass

**Step 3: Build**

```bash
npm run build
```

Expected: TypeScript compiles without errors

**Step 4: Commit if needed**

Fix any issues and commit.

---

## Task 16: Update Root README

**Files:**
- Modify: `README.md`

**Step 1: Write new README**

```markdown
# brain-jar 🧠🫙

Claude Code plugins for enhanced agent memory and search.

## Plugins

### perplexity-search

Web search via Perplexity AI with smart context detection.

[Documentation](./plugins/perplexity-search/README.md)

### shared-memory

Persistent memory across agents with semantic search. Memories travel with you across sessions, devices, and other AI agents.

[Documentation](./plugins/shared-memory/README.md)

## Installation

Add this repository as a marketplace in Claude Code:

```
/plugin
→ Add Marketplace
→ designnotdrum/brain-jar
```

Then install individual plugins:

```
/plugin
→ brain-jar
→ Select plugin to install
```

## Architecture

Each plugin is self-contained under `plugins/`:

```
brain-jar/
├── .claude-plugin/
│   └── marketplace.json      # Registry manifest
├── plugins/
│   ├── perplexity-search/    # Web search plugin
│   └── shared-memory/        # Memory plugin
└── README.md
```

## License

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README for brain-jar monorepo"
```

---

## Task 17: Update .gitignore for Monorepo

**Files:**
- Modify: `.gitignore`

**Step 1: Update .gitignore**

Add plugin-specific ignores:

```
# Dependencies
node_modules/
plugins/*/node_modules/

# Build output
dist/
plugins/*/dist/

# Plugin packaging
release/
*.tgz

# Config files with secrets
config.json
plugins/*/config.json

# Worktrees
.worktrees/
worktrees/

# OS files
.DS_Store

# IDE
.idea/
.vscode/
```

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: update .gitignore for monorepo structure"
```

---

## Task 18: Final Verification

**Step 1: Verify perplexity-search works**

```bash
cd /Users/Nick/workspace-local/code/ai-stuff/claude-code/perplexity-search-plugin/.worktrees/brain-jar-monorepo/plugins/perplexity-search
npm test && npm run build
```

Expected: Tests pass, build succeeds

**Step 2: Verify shared-memory works**

```bash
cd /Users/Nick/workspace-local/code/ai-stuff/claude-code/perplexity-search-plugin/.worktrees/brain-jar-monorepo/plugins/shared-memory
npm test && npm run build
```

Expected: Tests pass, build succeeds

**Step 3: Verify marketplace.json is valid**

```bash
cd /Users/Nick/workspace-local/code/ai-stuff/claude-code/perplexity-search-plugin/.worktrees/brain-jar-monorepo
cat .claude-plugin/marketplace.json | jq .
```

Expected: Valid JSON output

---

## Post-Implementation: Rename Repository

After merging to main, rename the GitHub repository:

1. Go to https://github.com/designnotdrum/perplexity-search-plugin/settings
2. Change repository name to `brain-jar`
3. Update local remote:
   ```bash
   git remote set-url origin git@github.com:designnotdrum/brain-jar.git
   ```

---

## Summary

This plan transforms perplexity-search-plugin into the brain-jar monorepo:

1. Tasks 1-5: Restructure to monorepo layout
2. Tasks 6-14: Create shared-memory plugin skeleton
3. Tasks 15-17: Documentation and configuration
4. Task 18: Final verification
5. Post-implementation: Rename repository
