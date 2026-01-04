import type { Memory } from '@brain-jar/core';
export interface AddInput {
    content: string;
    scope: string;
    tags: string[];
    source?: {
        agent: string;
        action?: string;
    };
}
export interface ListOptions {
    scope?: string;
    tags?: string[];
    since?: Date;
    limit?: number;
}
export declare class LocalStore {
    private db;
    constructor(dbPath: string);
    private init;
    add(input: AddInput): Memory;
    search(query: string, scope?: string, limit?: number): Memory[];
    list(options?: ListOptions): Memory[];
    delete(id: string): boolean;
    /**
     * Get memories within a date range for a scope.
     */
    getByDateRange(scope: string, start: Date, end: Date): Memory[];
    /**
     * Count memories added since a given date for a scope.
     */
    countSince(scope: string, since: Date): number;
    /**
     * Get all unique scopes with activity.
     */
    getActiveScopes(): string[];
    /**
     * Get memory statistics for health checks.
     */
    getStats(): {
        total: number;
        by_scope: Record<string, number>;
        by_tag: Record<string, number>;
        date_range: {
            oldest: string | null;
            newest: string | null;
        };
    };
    close(): void;
    private toMemory;
}
//# sourceMappingURL=local-store.d.ts.map