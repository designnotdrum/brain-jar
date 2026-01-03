/**
 * ProfileManager - Read-only access to shared brain-jar user profile.
 *
 * The profile is managed by shared-memory plugin. This manager provides
 * read-only access for perplexity-search to personalize queries.
 *
 * Profile location: ~/.config/brain-jar/user-profile.json
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { UserProfile } from '@brain-jar/core';

export class ProfileManager {
  constructor(private profilePath: string) {}

  /**
   * Loads user profile from disk.
   * Returns default profile if none exists.
   */
  async load(): Promise<UserProfile> {
    try {
      const data = await fs.readFile(this.profilePath, 'utf-8');
      const profile = JSON.parse(data) as UserProfile;
      return profile;
    } catch (error) {
      const err = error as NodeJS.ErrnoException | SyntaxError;

      // File doesn't exist - return default
      if ('code' in err && err.code === 'ENOENT') {
        return this.createDefaultProfile();
      }

      // Corrupted JSON - log and return default
      if (error instanceof SyntaxError) {
        console.warn(`Profile file corrupted at ${this.profilePath}, using defaults:`, error.message);
        return this.createDefaultProfile();
      }

      // Other errors (permissions, etc.) - rethrow with context
      throw new Error(`Failed to load profile from ${this.profilePath}: ${err.message}`);
    }
  }

  /**
   * Checks if profile needs refresh.
   * Returns true if more than 2 days since lastUpdated.
   */
  async needsRefresh(): Promise<boolean> {
    const profile = await this.load();
    const lastUpdated = profile.meta?.lastUpdated;
    if (!lastUpdated) return true;

    const lastRefresh = new Date(lastUpdated);
    const now = new Date();
    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;

    return now.getTime() - lastRefresh.getTime() > twoDaysInMs;
  }

  /**
   * Creates a default profile with empty arrays for all fields.
   */
  private createDefaultProfile(): UserProfile {
    const now = new Date().toISOString();

    return {
      version: '1.0.0',
      identity: {},
      technical: {
        languages: [],
        frameworks: [],
        tools: [],
        editors: [],
        patterns: [],
        operatingSystems: [],
      },
      workingStyle: {
        verbosity: 'adaptive',
        learningPace: 'adaptive',
        priorities: [],
      },
      knowledge: {
        expert: [],
        proficient: [],
        learning: [],
        interests: [],
      },
      personal: {
        interests: [],
        goals: [],
        context: [],
      },
      meta: {
        onboardingComplete: false,
        onboardingProgress: {
          identity: false,
          technical: false,
          workingStyle: false,
          personal: false,
        },
        lastUpdated: now,
        createdAt: now,
      },
    };
  }
}
