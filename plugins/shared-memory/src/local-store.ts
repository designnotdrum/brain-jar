import Database from 'better-sqlite3';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import type { Memory } from '@brain-jar/core';

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
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

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

  /**
   * Get memories within a date range for a scope.
   */
  getByDateRange(scope: string, start: Date, end: Date): Memory[] {
    const stmt = this.db.prepare(`
      SELECT * FROM memories
      WHERE scope = ?
        AND created_at >= ?
        AND created_at <= ?
      ORDER BY created_at DESC
    `);
    const rows = stmt.all(scope, start.toISOString(), end.toISOString()) as LocalMemory[];
    return rows.map((row) => this.toMemory(row));
  }

  /**
   * Count memories added since a given date for a scope.
   */
  countSince(scope: string, since: Date): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM memories
      WHERE scope = ? AND created_at >= ?
    `);
    const result = stmt.get(scope, since.toISOString()) as { count: number };
    return result.count;
  }

  /**
   * Get all unique scopes with activity.
   */
  getActiveScopes(): string[] {
    const stmt = this.db.prepare(`SELECT DISTINCT scope FROM memories`);
    const rows = stmt.all() as { scope: string }[];
    return rows.map((r) => r.scope);
  }

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
