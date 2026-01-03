/**
 * ProfileManager - CRUD operations for shared user profile.
 *
 * Profile is shared across all brain-jar plugins at:
 * ~/.config/brain-jar/user-profile.json
 *
 * Profile is synced to Mem0 as append-only snapshots using infer:false
 * to preserve raw JSON. This enables profile portability across machines
 * and historical analysis ("You, Wrapped").
 */
import type { Mem0Client, UserProfile, ProfileSnapshot, OnboardingQuestion, InferredPreference } from '@brain-jar/core';
declare const PROFILE_PATH: string;
declare const INFERENCES_PATH: string;
export declare class ProfileManager {
    private profilePath;
    private inferencesPath;
    private mem0Client;
    private lastSyncedProfile;
    constructor(profilePath?: string, inferencesPath?: string);
    /**
     * Sets the Mem0 client for cloud sync.
     * Call this after construction if Mem0 is configured.
     */
    setMem0Client(client: Mem0Client): void;
    /**
     * Loads user profile from disk.
     * Creates default profile if none exists.
     */
    load(): Promise<UserProfile>;
    /**
     * Saves profile to disk and syncs to Mem0 if configured.
     */
    save(profile: UserProfile, skipMem0Sync?: boolean): Promise<void>;
    /**
     * Syncs profile from Mem0 on startup.
     * - If Mem0 has a newer profile, pull it (and save locally)
     * - If local is newer or Mem0 is empty, push local to Mem0
     * - If no Mem0 client, skip sync
     */
    syncFromMem0(): Promise<{
        action: 'pulled' | 'pushed' | 'skipped';
        profile: UserProfile;
    }>;
    /**
     * Pushes a new profile snapshot to Mem0.
     * Uses infer:false to store raw JSON without semantic extraction.
     */
    pushSnapshot(profile: UserProfile): Promise<boolean>;
    /**
     * Gets profile history from Mem0.
     * Returns snapshots sorted newest-first.
     */
    getHistory(since?: Date, limit?: number): Promise<ProfileSnapshot[]>;
    /**
     * Gets a value from the profile using dot-path notation.
     * e.g., get('identity.name') or get('technical.languages')
     */
    get<T>(dotPath: string): Promise<T | undefined>;
    /**
     * Sets a value in the profile using dot-path notation.
     */
    set(dotPath: string, value: unknown): Promise<void>;
    /**
     * Appends values to an array field in the profile.
     */
    addToArray(dotPath: string, values: string[]): Promise<void>;
    /**
     * Returns the next batch of onboarding questions based on profile gaps.
     */
    getNextOnboardingQuestions(profile: UserProfile, count?: number): OnboardingQuestion[];
    /**
     * Checks if onboarding is complete.
     */
    isOnboardingComplete(profile: UserProfile): boolean;
    /**
     * Marks a category as complete and checks overall completion.
     */
    markCategoryComplete(category: keyof UserProfile['meta']['onboardingProgress']): Promise<void>;
    /**
     * Records when we last prompted the user for onboarding questions.
     */
    recordOnboardingPrompt(): Promise<void>;
    /**
     * Checks if enough time has passed to ask more onboarding questions.
     * Returns true if > 3 days since last prompt.
     */
    shouldPromptOnboarding(profile: UserProfile): Promise<boolean>;
    /**
     * Loads pending inferences from disk.
     */
    loadInferences(): Promise<InferredPreference[]>;
    /**
     * Saves pending inferences to disk.
     */
    saveInferences(inferences: InferredPreference[]): Promise<void>;
    /**
     * Adds a new inference to pending list.
     */
    addInference(inference: Omit<InferredPreference, 'id' | 'status' | 'createdAt'>): Promise<InferredPreference>;
    /**
     * Confirms an inference and applies it to the profile.
     */
    confirmInference(inferenceId: string): Promise<boolean>;
    /**
     * Rejects an inference.
     */
    rejectInference(inferenceId: string): Promise<boolean>;
    /**
     * Gets pending inferences.
     */
    getPendingInferences(): Promise<InferredPreference[]>;
    /**
     * Creates a default profile with empty/default values.
     */
    private createDefaultProfile;
    /**
     * Migrates old profile versions to current schema.
     */
    private migrateIfNeeded;
}
export { PROFILE_PATH, INFERENCES_PATH };
//# sourceMappingURL=manager.d.ts.map