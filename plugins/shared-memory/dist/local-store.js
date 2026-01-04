"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStore = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class LocalStore {
    db;
    constructor(dbPath) {
        // Ensure directory exists
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        this.db = new better_sqlite3_1.default(dbPath);
        this.init();
    }
    init() {
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
    add(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const stmt = this.db.prepare(`
      INSERT INTO memories (id, content, scope, tags, source_agent, source_action, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(id, input.content, input.scope, JSON.stringify(input.tags), input.source?.agent || 'claude-code', input.source?.action || null, now, now);
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
    search(query, scope, limit = 10) {
        let sql = `SELECT * FROM memories WHERE content LIKE ?`;
        const params = [`%${query}%`];
        if (scope) {
            sql += ` AND scope = ?`;
            params.push(scope);
        }
        sql += ` ORDER BY created_at DESC LIMIT ?`;
        params.push(limit);
        const stmt = this.db.prepare(sql);
        const rows = stmt.all(...params);
        return rows.map((row) => this.toMemory(row));
    }
    list(options = {}) {
        let sql = `SELECT * FROM memories WHERE 1=1`;
        const params = [];
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
        const rows = stmt.all(...params);
        return rows.map((row) => this.toMemory(row));
    }
    delete(id) {
        const stmt = this.db.prepare(`DELETE FROM memories WHERE id = ?`);
        const result = stmt.run(id);
        return result.changes > 0;
    }
    /**
     * Get memories within a date range for a scope.
     */
    getByDateRange(scope, start, end) {
        const stmt = this.db.prepare(`
      SELECT * FROM memories
      WHERE scope = ?
        AND created_at >= ?
        AND created_at <= ?
      ORDER BY created_at DESC
    `);
        const rows = stmt.all(scope, start.toISOString(), end.toISOString());
        return rows.map((row) => this.toMemory(row));
    }
    /**
     * Count memories added since a given date for a scope.
     */
    countSince(scope, since) {
        const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM memories
      WHERE scope = ? AND created_at >= ?
    `);
        const result = stmt.get(scope, since.toISOString());
        return result.count;
    }
    /**
     * Get all unique scopes with activity.
     */
    getActiveScopes() {
        const stmt = this.db.prepare(`SELECT DISTINCT scope FROM memories`);
        const rows = stmt.all();
        return rows.map((r) => r.scope);
    }
    /**
     * Get memory statistics for health checks.
     */
    getStats() {
        // Total count
        const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM memories');
        const total = totalStmt.get().count;
        // By scope
        const scopeStmt = this.db.prepare('SELECT scope, COUNT(*) as count FROM memories GROUP BY scope');
        const scopeRows = scopeStmt.all();
        const by_scope = {};
        for (const row of scopeRows) {
            by_scope[row.scope] = row.count;
        }
        // By tag (approximate - counts memories containing each tag)
        const allStmt = this.db.prepare('SELECT tags FROM memories');
        const allRows = allStmt.all();
        const by_tag = {};
        for (const row of allRows) {
            try {
                const tags = JSON.parse(row.tags);
                for (const tag of tags) {
                    by_tag[tag] = (by_tag[tag] || 0) + 1;
                }
            }
            catch {
                // Skip invalid JSON
            }
        }
        // Date range
        const oldestStmt = this.db.prepare('SELECT created_at FROM memories ORDER BY created_at ASC LIMIT 1');
        const newestStmt = this.db.prepare('SELECT created_at FROM memories ORDER BY created_at DESC LIMIT 1');
        const oldestRow = oldestStmt.get();
        const newestRow = newestStmt.get();
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
    close() {
        this.db.close();
    }
    toMemory(row) {
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
exports.LocalStore = LocalStore;
//# sourceMappingURL=local-store.js.map