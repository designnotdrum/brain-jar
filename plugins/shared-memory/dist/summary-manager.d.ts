/**
 * SummaryManager - Handles automatic activity summary generation.
 *
 * Summaries are triggered by:
 * - Activity threshold: After N memories added to a scope
 * - Time ceiling: Force summary after max interval if any activity
 * - Manual trigger: User can trigger via /summarize skill
 */
import type { Mem0Client, ActivitySummary } from './mem0-client';
import type { LocalStore } from './local-store';
export declare class SummaryManager {
    private mem0Client;
    private localStore;
    private statePath;
    private state;
    private stateLoaded;
    constructor(mem0Client: Mem0Client | null, localStore: LocalStore, statePath?: string);
    /**
     * Loads state from disk.
     */
    loadState(): Promise<void>;
    /**
     * Saves state to disk.
     */
    saveState(): Promise<void>;
    /**
     * Called after every memory is added.
     * Tracks activity and triggers summary if thresholds are met.
     */
    onMemoryAdded(scope: string): Promise<{
        summarized: boolean;
        summary?: ActivitySummary;
    }>;
    /**
     * Checks if a summary should be generated for this scope.
     */
    shouldGenerateSummary(scope: string): boolean;
    /**
     * Generates and stores a summary for a scope.
     */
    generateSummary(scope: string): Promise<ActivitySummary | null>;
    /**
     * Manual trigger for summary generation.
     */
    triggerSummary(scope: string): Promise<ActivitySummary | null>;
    /**
     * Generates summary content from memories.
     * V1: Simple aggregation without LLM.
     */
    private generateSummaryContent;
    /**
     * Default period start for first summary (7 days ago).
     */
    private getDefaultPeriodStart;
    /**
     * Truncates text to a maximum length.
     */
    private truncate;
    /**
     * Gets the current activity count for a scope.
     */
    getActivityCount(scope: string): Promise<number>;
    /**
     * Gets the last summary time for a scope.
     */
    getLastSummaryTime(scope: string): Promise<Date | null>;
}
//# sourceMappingURL=summary-manager.d.ts.map