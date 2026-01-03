/**
 * Tests for ProfileManager.
 *
 * Tests read-only profile access:
 * - Loading profile (returns default if missing)
 * - Checking if profile needs refresh (>2 days since last update)
 *
 * Note: Profile is managed by shared-memory plugin. This is read-only access.
 */

import { ProfileManager } from './manager';
import type { UserProfile } from '@brain-jar/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Mock profile directory for tests
const TEST_PROFILE_DIR = path.join(os.tmpdir(), 'perplexity-test-profiles');
const TEST_PROFILE_PATH = path.join(TEST_PROFILE_DIR, 'profile.json');

function createTestProfile(overrides: Partial<UserProfile> = {}): UserProfile {
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
    ...overrides,
  };
}

describe('ProfileManager', () => {
  let manager: ProfileManager;

  beforeEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_PROFILE_DIR, { recursive: true, force: true });
    } catch {}
    await fs.mkdir(TEST_PROFILE_DIR, { recursive: true });

    manager = new ProfileManager(TEST_PROFILE_PATH);
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_PROFILE_DIR, { recursive: true, force: true });
    } catch {}
  });

  test('returns default profile if none exists', async () => {
    const profile = await manager.load();

    expect(profile.version).toBe('1.0.0');
    expect(profile.technical.languages).toEqual([]);
    expect(profile.workingStyle.priorities).toEqual([]);
    expect(profile.meta.lastUpdated).toBeDefined();
  });

  test('loads existing profile', async () => {
    const existingProfile = createTestProfile({
      identity: { role: 'Developer' },
      technical: {
        languages: ['TypeScript', 'Python'],
        frameworks: ['React', 'FastAPI'],
        tools: ['VS Code', 'Git'],
        editors: ['VS Code'],
        patterns: ['TDD', 'Clean Code'],
        operatingSystems: ['macOS'],
      },
      workingStyle: {
        verbosity: 'detailed',
        learningPace: 'adaptive',
        communicationStyle: 'direct',
        priorities: ['correctness', 'performance'],
      },
      knowledge: {
        expert: ['JavaScript'],
        proficient: ['Python'],
        learning: ['Rust'],
        interests: ['AI'],
      },
    });

    await fs.writeFile(TEST_PROFILE_PATH, JSON.stringify(existingProfile, null, 2));

    const profile = await manager.load();

    expect(profile.technical.languages).toEqual(['TypeScript', 'Python']);
    expect(profile.workingStyle.communicationStyle).toBe('direct');
  });

  test('handles corrupted JSON file gracefully', async () => {
    // Write invalid JSON to profile file
    await fs.writeFile(TEST_PROFILE_PATH, '{ invalid json content }');

    // Mock console.warn to verify it's called
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const profile = await manager.load();

    // Should return default profile instead of crashing
    expect(profile.version).toBe('1.0.0');
    expect(profile.technical.languages).toEqual([]);

    // Should log a warning about corrupted file
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Profile file corrupted'),
      expect.any(String)
    );

    warnSpy.mockRestore();
  });

  test('checks if profile needs refresh (2 day threshold)', async () => {
    // Fresh profile should not need refresh
    const freshProfile = createTestProfile({
      meta: {
        onboardingComplete: false,
        onboardingProgress: {
          identity: false,
          technical: false,
          workingStyle: false,
          personal: false,
        },
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    });
    await fs.writeFile(TEST_PROFILE_PATH, JSON.stringify(freshProfile, null, 2));
    expect(await manager.needsRefresh()).toBe(false);

    // 1 day old profile should not need refresh
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const oldProfile = createTestProfile({
      meta: {
        onboardingComplete: false,
        onboardingProgress: {
          identity: false,
          technical: false,
          workingStyle: false,
          personal: false,
        },
        lastUpdated: oneDayAgo.toISOString(),
        createdAt: oneDayAgo.toISOString(),
      },
    });
    await fs.writeFile(TEST_PROFILE_PATH, JSON.stringify(oldProfile, null, 2));
    expect(await manager.needsRefresh()).toBe(false);

    // 3 day old profile should need refresh
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const staleProfile = createTestProfile({
      meta: {
        onboardingComplete: false,
        onboardingProgress: {
          identity: false,
          technical: false,
          workingStyle: false,
          personal: false,
        },
        lastUpdated: threeDaysAgo.toISOString(),
        createdAt: threeDaysAgo.toISOString(),
      },
    });
    await fs.writeFile(TEST_PROFILE_PATH, JSON.stringify(staleProfile, null, 2));
    expect(await manager.needsRefresh()).toBe(true);
  });
});
