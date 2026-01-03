"use strict";
/**
 * SummaryManager - Handles automatic activity summary generation.
 *
 * Summaries are triggered by:
 * - Activity threshold: After N memories added to a scope
 * - Time ceiling: Force summary after max interval if any activity
 * - Manual trigger: User can trigger via /summarize skill
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryManager = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const STATE_PATH = path.join(os.homedir(), '.config', 'brain-jar', 'summary-state.json');
// Thresholds
const ACTIVITY_THRESHOLD = 12; // memories before summary
const MIN_INTERVAL_MS = 24 * 60 * 60 * 1000; // 1 day minimum between summaries
const MAX_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week max without summary
class SummaryManager {
    mem0Client;
    localStore;
    statePath;
    state = {
        activityCounts: {},
        lastSummaryTime: {},
    };
    stateLoaded = false;
    constructor(mem0Client, localStore, statePath = STATE_PATH) {
        this.mem0Client = mem0Client;
        this.localStore = localStore;
        this.statePath = statePath;
    }
    /**
     * Loads state from disk.
     */
    async loadState() {
        if (this.stateLoaded)
            return;
        try {
            const data = await fs.readFile(this.statePath, 'utf-8');
            this.state = JSON.parse(data);
        }
        catch {
            // File doesn't exist or corrupted - use default
            this.state = { activityCounts: {}, lastSummaryTime: {} };
        }
        this.stateLoaded = true;
    }
    /**
     * Saves state to disk.
     */
    async saveState() {
        const dir = path.dirname(this.statePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(this.statePath, JSON.stringify(this.state, null, 2));
    }
    /**
     * Called after every memory is added.
     * Tracks activity and triggers summary if thresholds are met.
     */
    async onMemoryAdded(scope) {
        await this.loadState();
        // Increment activity count
        this.state.activityCounts[scope] = (this.state.activityCounts[scope] || 0) + 1;
        await this.saveState();
        // Check if summary should be generated
        if (this.shouldGenerateSummary(scope)) {
            const summary = await this.generateSummary(scope);
            return { summarized: true, summary: summary || undefined };
        }
        return { summarized: false };
    }
    /**
     * Checks if a summary should be generated for this scope.
     */
    shouldGenerateSummary(scope) {
        const count = this.state.activityCounts[scope] || 0;
        const lastSummaryStr = this.state.lastSummaryTime[scope];
        const now = Date.now();
        // First summary: require threshold
        if (!lastSummaryStr) {
            return count >= ACTIVITY_THRESHOLD;
        }
        const lastSummary = new Date(lastSummaryStr).getTime();
        const timeSinceLastSummary = now - lastSummary;
        // Time ceiling: force summary if >1 week and any activity
        if (timeSinceLastSummary >= MAX_INTERVAL_MS && count > 0) {
            return true;
        }
        // Activity threshold: only if past time floor
        if (count >= ACTIVITY_THRESHOLD && timeSinceLastSummary >= MIN_INTERVAL_MS) {
            return true;
        }
        return false;
    }
    /**
     * Generates and stores a summary for a scope.
     */
    async generateSummary(scope) {
        await this.loadState();
        // Get last summary time to determine period start
        const lastSummaryStr = this.state.lastSummaryTime[scope];
        const periodStart = lastSummaryStr ? new Date(lastSummaryStr) : this.getDefaultPeriodStart();
        const periodEnd = new Date();
        // Get memories in this period
        const memories = this.localStore.getByDateRange(scope, periodStart, periodEnd);
        if (memories.length === 0) {
            return null;
        }
        // Generate summary content
        const content = this.generateSummaryContent(scope, memories, periodStart, periodEnd);
        // Store in Mem0 if configured
        let mem0Id;
        if (this.mem0Client) {
            const id = await this.mem0Client.saveSummary(scope, content, periodStart, periodEnd, memories.length);
            mem0Id = id || undefined;
        }
        // Update state
        this.state.activityCounts[scope] = 0;
        this.state.lastSummaryTime[scope] = periodEnd.toISOString();
        await this.saveState();
        console.log(`[SummaryManager] Generated summary for ${scope}: ${memories.length} memories`);
        return {
            content,
            scope,
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
            memoryCount: memories.length,
            timestamp: periodEnd.toISOString(),
            mem0Id,
        };
    }
    /**
     * Manual trigger for summary generation.
     */
    async triggerSummary(scope) {
        return this.generateSummary(scope);
    }
    /**
     * Generates summary content from memories.
     * V1: Simple aggregation without LLM.
     */
    generateSummaryContent(scope, memories, periodStart, periodEnd) {
        // Count tags
        const tagCounts = {};
        for (const m of memories) {
            for (const tag of m.tags) {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
        }
        // Get top tags
        const topTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag]) => tag);
        // Format period
        const formatDate = (d) => d.toISOString().split('T')[0];
        const period = `${formatDate(periodStart)} to ${formatDate(periodEnd)}`;
        // Get key items (most recent)
        const keyItems = memories
            .slice(0, 5)
            .map((m) => `- ${this.truncate(m.content, 100)}`)
            .join('\n');
        // Build summary
        const parts = [`Activity summary for ${scope} (${memories.length} memories, ${period})`];
        if (topTags.length > 0) {
            parts.push(`Top themes: ${topTags.join(', ')}`);
        }
        if (keyItems) {
            parts.push(`\nKey items:\n${keyItems}`);
        }
        return parts.join('\n');
    }
    /**
     * Default period start for first summary (7 days ago).
     */
    getDefaultPeriodStart() {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d;
    }
    /**
     * Truncates text to a maximum length.
     */
    truncate(text, maxLength) {
        if (text.length <= maxLength)
            return text;
        return text.substring(0, maxLength - 3) + '...';
    }
    /**
     * Gets the current activity count for a scope.
     */
    async getActivityCount(scope) {
        await this.loadState();
        return this.state.activityCounts[scope] || 0;
    }
    /**
     * Gets the last summary time for a scope.
     */
    async getLastSummaryTime(scope) {
        await this.loadState();
        const str = this.state.lastSummaryTime[scope];
        return str ? new Date(str) : null;
    }
}
exports.SummaryManager = SummaryManager;
//# sourceMappingURL=summary-manager.js.map