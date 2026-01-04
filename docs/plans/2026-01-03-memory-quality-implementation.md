# Memory Quality Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the memory quality improvements by adding profile pruning, custom instructions, and a stats tool.

**Architecture:** Entity partitioning is already complete (agent_id for profile-mgr and perplexity). This plan adds pruning logic to keep one profile snapshot per day, custom Mem0 instructions to filter stored content, and a get_memory_stats tool for health checks.

**Tech Stack:** TypeScript, Mem0 v2 API, MCP SDK, Zod

**Status:** Tasks 1-3 (entity partitioning) already completed. This plan covers tasks 4-7.

---

### Task 1: Add Profile Snapshot Pruning Logic

**Files:**
- Modify: `packages/core/src/mem0-client.ts:191-218`

**Step 1: Add helper to get today's date prefix**

After line 146 (after `PROFILE_AGENT_ID`), add:

```typescript
  /**
   * Gets today's date as YYYY-MM-DD for snapshot grouping.
   */
  private static getTodayPrefix(): string {
    return new Date().toISOString().split('T')[0];
  }
```

**Step 2: Add method to get today's existing snapshots**

After `getProfileHistory` method (around line 266), add:

```typescript
  /**
   * Gets all profile snapshots from today (for pruning).
   * Returns array of { id, timestamp } sorted oldest first.
   */
  private async getTodaysSnapshots(): Promise<Array<{ id: string; timestamp: string }>> {
    try {
      const response = await this.client.getAll({
        user_id: this.userId,
        agent_id: Mem0Client.PROFILE_AGENT_ID,
      });
      const results: Mem0Memory[] = this.extractResults(response);
      const todayPrefix = Mem0Client.getTodayPrefix();

      return results
        .filter((r) => r.metadata?.type === 'profile-snapshot')
        .filter((r) => {
          const ts = (r.metadata?.timestamp as string) || '';
          return ts.startsWith(todayPrefix);
        })
        .map((r) => ({
          id: r.id,
          timestamp: (r.metadata?.timestamp as string) || '',
        }))
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp)); // Oldest first
    } catch (error) {
      console.warn('Failed to get today snapshots:', error);
      return [];
    }
  }
```

**Step 3: Update saveProfileSnapshot to prune before saving**

Replace the `saveProfileSnapshot` method with:

```typescript
  /**
   * Saves a new profile snapshot to Mem0.
   * Uses agent_id 'profile-mgr' to partition from regular memories.
   * Prunes older snapshots from today (keeps only the latest).
   */
  async saveProfileSnapshot(profile: UserProfile): Promise<string | null> {
    try {
      // Delete any existing snapshots from today (keep only latest)
      const todaysSnapshots = await this.getTodaysSnapshots();
      for (const snapshot of todaysSnapshots) {
        await this.delete(snapshot.id);
      }

      const timestamp = new Date().toISOString();
      // v2 API: add() expects messages array
      const messages = [{ role: 'user', content: JSON.stringify(profile) }];
      const result = await this.client.add(messages, {
        user_id: this.userId,
        agent_id: Mem0Client.PROFILE_AGENT_ID,
        infer: false, // Store raw JSON without semantic extraction
        metadata: {
          type: 'profile-snapshot',
          timestamp,
          version: profile.version || '1.0.0',
          scope: 'global',
        },
      });
      const results = this.extractResults<Mem0AddResult>(result);
      const firstResult = results[0];
      return firstResult?.id || firstResult?.event_id || result?.id || result?.event_id || null;
    } catch (error) {
      console.warn('Failed to save profile snapshot to Mem0:', error);
      return null;
    }
  }
```

**Step 4: Build to verify**

Run: `npm run build:core`
Expected: Build succeeds with no errors

**Step 5: Commit**

```bash
git add packages/core/src/mem0-client.ts
git commit -m "feat(core): add profile snapshot pruning (one per day max)"
```

---

### Task 2: Add One-Time Migration for Existing Snapshots

**Files:**
- Modify: `packages/core/src/mem0-client.ts`
- Modify: `plugins/shared-memory/src/index.ts:80-90`

**Step 1: Add pruneProfileHistory method to Mem0Client**

After `getTodaysSnapshots` method, add:

```typescript
  /**
   * One-time migration: Prune profile history to one snapshot per day.
   * Keeps the latest snapshot from each day, deletes the rest.
   * Returns count of deleted snapshots.
   */
  async pruneProfileHistory(): Promise<number> {
    try {
      const response = await this.client.getAll({
        user_id: this.userId,
        agent_id: Mem0Client.PROFILE_AGENT_ID,
      });
      const results: Mem0Memory[] = this.extractResults(response);

      // Group snapshots by day
      const byDay = new Map<string, Array<{ id: string; timestamp: string }>>();

      for (const r of results) {
        if (r.metadata?.type !== 'profile-snapshot') continue;
        const ts = (r.metadata?.timestamp as string) || r.created_at || '';
        const day = ts.split('T')[0];
        if (!day) continue;

        if (!byDay.has(day)) {
          byDay.set(day, []);
        }
        byDay.get(day)!.push({ id: r.id, timestamp: ts });
      }

      // For each day, keep only the latest snapshot
      let deletedCount = 0;
      for (const [_day, snapshots] of byDay) {
        if (snapshots.length <= 1) continue;

        // Sort by timestamp descending, keep first (latest), delete rest
        snapshots.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        for (let i = 1; i < snapshots.length; i++) {
          const deleted = await this.delete(snapshots[i].id);
          if (deleted) deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.warn('Failed to prune profile history:', error);
      return 0;
    }
  }
```

**Step 2: Export the method type in core index**

The method is already on the class, no additional export needed.

**Step 3: Call prune on startup in shared-memory**

In `plugins/shared-memory/src/index.ts`, after the profile sync block (around line 89), add:

```typescript
    // One-time migration: prune duplicate profile snapshots
    try {
      const pruned = await mem0Client.pruneProfileHistory();
      if (pruned > 0) {
        console.error(`[shared-memory] Pruned ${pruned} duplicate profile snapshot(s)`);
      }
    } catch (error) {
      console.error('[shared-memory] Profile prune failed:', error);
    }
```

**Step 4: Build both packages**

Run: `npm run build:core && npm run build:shared-memory`
Expected: Both build successfully

**Step 5: Commit**

```bash
git add packages/core/src/mem0-client.ts plugins/shared-memory/src/index.ts
git commit -m "feat(shared-memory): add one-time migration to prune profile snapshots"
```

---

### Task 3: Add Custom Mem0 Instructions

**Files:**
- Modify: `packages/core/src/mem0-client.ts:54-75`
- Create: `packages/core/src/instructions.ts`

**Step 1: Create instructions module**

Create `packages/core/src/instructions.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const USER_INSTRUCTIONS_PATH = path.join(
  os.homedir(),
  '.config',
  'brain-jar',
  'mem0-instructions.txt'
);

const DEFAULT_INSTRUCTIONS = `Brain-jar memory assistant rules:

STORE:
- Decisions and their rationale
- User preferences explicitly stated
- Project-specific context and learnings
- Technical discoveries and solutions
- Workflow patterns that worked well

IGNORE:
- Facts about user identity, skills, or preferences (route to profile)
- Search queries (handled by perplexity namespace)
- Transient debugging context
- Speculation (might, maybe, possibly)
- Duplicate information already stored

CONSOLIDATE:
- If a fact updates an existing memory, update rather than add
- Prefer specific over general ("uses TypeScript 5.3" over "uses TypeScript")`;

/**
 * Gets Mem0 instructions, preferring user override if it exists.
 */
export function getInstructions(): string {
  try {
    if (fs.existsSync(USER_INSTRUCTIONS_PATH)) {
      return fs.readFileSync(USER_INSTRUCTIONS_PATH, 'utf-8').trim();
    }
  } catch {
    // Fall through to default
  }
  return DEFAULT_INSTRUCTIONS;
}

export { USER_INSTRUCTIONS_PATH, DEFAULT_INSTRUCTIONS };
```

**Step 2: Export from core index**

In `packages/core/src/index.ts`, add:

```typescript
export { getInstructions, USER_INSTRUCTIONS_PATH, DEFAULT_INSTRUCTIONS } from './instructions';
```

**Step 3: Update Mem0Client.add to use instructions**

In `packages/core/src/mem0-client.ts`, add import at top:

```typescript
import { getInstructions } from './instructions';
```

Then update the `add` method to include instructions:

```typescript
  async add(
    content: string,
    metadata: Record<string, unknown> = {},
    options?: { agentId?: string; skipInstructions?: boolean }
  ): Promise<string> {
    // v2 API: add() expects messages array as first param
    const messages = [{ role: 'user', content }];
    const addOptions: Record<string, unknown> = {
      user_id: this.userId,
      metadata,
    };
    // Add agent_id for partitioning if specified
    if (options?.agentId) {
      addOptions.agent_id = options.agentId;
    }
    // Add custom instructions for memory filtering (skip for partitioned data)
    if (!options?.skipInstructions && !options?.agentId) {
      addOptions.instructions = getInstructions();
    }
    const result = await this.client.add(messages, addOptions);
    // v2 returns array with event_id for async processing, or id for sync
    const results = this.extractResults<Mem0AddResult>(result);
    const firstResult = results[0];
    // Return id if available, otherwise event_id for async tracking
    return firstResult?.id || firstResult?.event_id || result?.id || result?.event_id || '';
  }
```

**Step 4: Build core**

Run: `npm run build:core`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add packages/core/src/instructions.ts packages/core/src/index.ts packages/core/src/mem0-client.ts
git commit -m "feat(core): add custom Mem0 instructions with user override support"
```

---

### Task 4: Add get_memory_stats MCP Tool

**Files:**
- Modify: `plugins/shared-memory/src/local-store.ts`
- Modify: `plugins/shared-memory/src/index.ts`

**Step 1: Add stats method to LocalStore**

In `plugins/shared-memory/src/local-store.ts`, before the `close` method, add:

```typescript
  /**
   * Get memory statistics for health checks.
   */
  getStats(): {
    total: number;
    by_scope: Record<string, number>;
    by_tag: Record<string, number>;
    date_range: { oldest: string | null; newest: string | null };
  } {
    // Total count
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM memories');
    const total = (totalStmt.get() as { count: number }).count;

    // By scope
    const scopeStmt = this.db.prepare(
      'SELECT scope, COUNT(*) as count FROM memories GROUP BY scope'
    );
    const scopeRows = scopeStmt.all() as { scope: string; count: number }[];
    const by_scope: Record<string, number> = {};
    for (const row of scopeRows) {
      by_scope[row.scope] = row.count;
    }

    // By tag (approximate - counts memories containing each tag)
    const allStmt = this.db.prepare('SELECT tags FROM memories');
    const allRows = allStmt.all() as { tags: string }[];
    const by_tag: Record<string, number> = {};
    for (const row of allRows) {
      try {
        const tags = JSON.parse(row.tags) as string[];
        for (const tag of tags) {
          by_tag[tag] = (by_tag[tag] || 0) + 1;
        }
      } catch {
        // Skip invalid JSON
      }
    }

    // Date range
    const oldestStmt = this.db.prepare(
      'SELECT created_at FROM memories ORDER BY created_at ASC LIMIT 1'
    );
    const newestStmt = this.db.prepare(
      'SELECT created_at FROM memories ORDER BY created_at DESC LIMIT 1'
    );
    const oldestRow = oldestStmt.get() as { created_at: string } | undefined;
    const newestRow = newestStmt.get() as { created_at: string } | undefined;

    return {
      total,
      by_scope,
      by_tag,
      date_range: {
        oldest: oldestRow?.created_at.split('T')[0] || null,
        newest: newestRow?.created_at.split('T')[0] || null,
      },
    };
  }
```

**Step 2: Add get_memory_stats tool to shared-memory**

In `plugins/shared-memory/src/index.ts`, after the `trigger_summary` tool registration (around line 748), add:

```typescript
  server.tool(
    'get_memory_stats',
    'Get memory statistics for health checks (counts by scope, tag, and date range)',
    {},
    async () => {
      const localStats = localStore.getStats();

      // Get Mem0 stats if configured
      let mem0Stats: { total: number; by_agent: Record<string, number> } | null = null;
      let profileSnapshots = 0;

      if (mem0Client) {
        try {
          // Get all memories to count by type
          const allMem0 = await mem0Client.getAll();
          const profileMem0 = await mem0Client.getAll({ agentId: 'profile-mgr' });
          const perplexityMem0 = await mem0Client.getAll({ agentId: 'perplexity' });

          mem0Stats = {
            total: allMem0.length + profileMem0.length + perplexityMem0.length,
            by_agent: {
              'shared-memory': allMem0.length,
              'profile-mgr': profileMem0.length,
              'perplexity': perplexityMem0.length,
            },
          };
          profileSnapshots = profileMem0.length;
        } catch (error) {
          console.error('[shared-memory] Failed to get Mem0 stats:', error);
        }
      }

      const stats = {
        local: localStats,
        mem0: mem0Stats,
        health: {
          profile_snapshots: profileSnapshots,
          mem0_configured: !!mem0Client,
        },
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(stats, null, 2),
          },
        ],
      };
    }
  );
```

**Step 3: Build shared-memory**

Run: `npm run build:shared-memory`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add plugins/shared-memory/src/local-store.ts plugins/shared-memory/src/index.ts
git commit -m "feat(shared-memory): add get_memory_stats tool for health checks"
```

---

### Task 5: Final Build and Version Bump

**Files:**
- Modify: `plugins/shared-memory/.claude-plugin/plugin.json`
- Modify: `plugins/shared-memory/package.json`
- Modify: `packages/core/package.json`

**Step 1: Build all packages**

Run: `npm run build`
Expected: All packages build successfully

**Step 2: Run type check**

Run: `npm run typecheck` (if available) or `npx tsc --noEmit`
Expected: No type errors

**Step 3: Update version numbers**

This is a minor feature release. Update:
- `packages/core/package.json`: `"version": "1.1.0"`
- `plugins/shared-memory/package.json`: `"version": "2.1.0"`
- `plugins/shared-memory/.claude-plugin/plugin.json`: `"version": "2.1.0"`

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(shared-memory): memory quality improvements v2.1.0

- Entity partitioning (agent_id for profile-mgr, perplexity)
- Profile snapshot pruning (one per day max)
- One-time migration for existing snapshots
- Custom Mem0 instructions with user override
- get_memory_stats tool for health checks"
```

---

## Success Criteria

After implementation, verify:

- [ ] `search_memory` results don't include profile snapshots or search queries
- [ ] Profile sync creates max one snapshot per day
- [ ] Existing duplicate snapshots are cleaned up on first startup
- [ ] `get_memory_stats` returns accurate counts by namespace
- [ ] Custom instructions file at `~/.config/brain-jar/mem0-instructions.txt` overrides defaults
