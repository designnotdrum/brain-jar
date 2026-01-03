/**
 * SummaryManager - Handles automatic activity summary generation.
 *
 * Summaries are triggered by:
 * - Activity threshold: After N memories added to a scope
 * - Time ceiling: Force summary after max interval if any activity
 * - Manual trigger: User can trigger via /summarize skill
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import type { Mem0Client, ActivitySummary, Memory } from '@brain-jar/core';
import type { LocalStore } from './local-store';

const STATE_PATH = path.join(os.homedir(), '.config', 'brain-jar', 'summary-state.json');

// Thresholds
const ACTIVITY_THRESHOLD = 12; // memories before summary
const MIN_INTERVAL_MS = 24 * 60 * 60 * 1000; // 1 day minimum between summaries
const MAX_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week max without summary

interface SummaryState {
  activityCounts: Record<string, number>; // scope -> count since last summary
  lastSummaryTime: Record<string, string>; // scope -> ISO timestamp
}

export class SummaryManager {
  private state: SummaryState = {
    activityCounts: {},
    lastSummaryTime: {},
  };
  private stateLoaded = false;

  constructor(
    private mem0Client: Mem0Client | null,
    private localStore: LocalStore,
    private statePath: string = STATE_PATH
  ) {}

  /**
   * Loads state from disk.
   */
  async loadState(): Promise<void> {
    if (this.stateLoaded) return;

    try {
      const data = await fs.readFile(this.statePath, 'utf-8');
      this.state = JSON.parse(data);
    } catch {
      // File doesn't exist or corrupted - use default
      this.state = { activityCounts: {}, lastSummaryTime: {} };
    }
    this.stateLoaded = true;
  }

  /**
   * Saves state to disk.
   */
  async saveState(): Promise<void> {
    const dir = path.dirname(this.statePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.statePath, JSON.stringify(this.state, null, 2));
  }

  /**
   * Called after every memory is added.
   * Tracks activity and triggers summary if thresholds are met.
   */
  async onMemoryAdded(scope: string): Promise<{ summarized: boolean; summary?: ActivitySummary }> {
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
  shouldGenerateSummary(scope: string): boolean {
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
  async generateSummary(scope: string): Promise<ActivitySummary | null> {
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
    let mem0Id: string | undefined;
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
  async triggerSummary(scope: string): Promise<ActivitySummary | null> {
    return this.generateSummary(scope);
  }

  /**
   * Generates summary content from memories.
   * V1: Simple aggregation without LLM.
   */
  private generateSummaryContent(
    scope: string,
    memories: Memory[],
    periodStart: Date,
    periodEnd: Date
  ): string {
    // Count tags
    const tagCounts: Record<string, number> = {};
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
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
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
  private getDefaultPeriodStart(): Date {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }

  /**
   * Truncates text to a maximum length.
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Gets the current activity count for a scope.
   */
  async getActivityCount(scope: string): Promise<number> {
    await this.loadState();
    return this.state.activityCounts[scope] || 0;
  }

  /**
   * Gets the last summary time for a scope.
   */
  async getLastSummaryTime(scope: string): Promise<Date | null> {
    await this.loadState();
    const str = this.state.lastSummaryTime[scope];
    return str ? new Date(str) : null;
  }
}
