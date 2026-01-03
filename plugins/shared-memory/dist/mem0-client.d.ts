import { Memory } from './types';
import { UserProfile } from './profile/types';
export interface ProfileSnapshot {
    profile: UserProfile;
    timestamp: string;
    mem0Id?: string;
}
export interface ActivitySummary {
    content: string;
    scope: string;
    periodStart: string;
    periodEnd: string;
    memoryCount: number;
    timestamp: string;
    mem0Id?: string;
}
export declare class Mem0Client {
    private client;
    private userId;
    constructor(apiKey: string, userId?: string);
    private extractResults;
    add(content: string, metadata?: Record<string, unknown>): Promise<string>;
    search(query: string, limit?: number): Promise<Memory[]>;
    getAll(): Promise<Memory[]>;
    delete(memoryId: string): Promise<boolean>;
    /**
     * Gets the latest profile snapshot from Mem0.
     * Returns null if no profile exists.
     */
    getLatestProfile(): Promise<ProfileSnapshot | null>;
    /**
     * Saves a new profile snapshot to Mem0.
     * Always creates a new memory (append-only).
     */
    saveProfileSnapshot(profile: UserProfile): Promise<string | null>;
    /**
     * Gets profile history from Mem0.
     * Returns all snapshots, optionally filtered by date.
     */
    getProfileHistory(since?: Date, limit?: number): Promise<ProfileSnapshot[]>;
    /**
     * Saves an activity summary to Mem0.
     */
    saveSummary(scope: string, content: string, periodStart: Date, periodEnd: Date, memoryCount: number): Promise<string | null>;
    /**
     * Gets activity summaries from Mem0.
     */
    getSummaries(scope?: string, since?: Date, limit?: number): Promise<ActivitySummary[]>;
    /**
     * Gets the most recent summary for a scope.
     */
    getLatestSummary(scope: string): Promise<ActivitySummary | null>;
}
//# sourceMappingURL=mem0-client.d.ts.map