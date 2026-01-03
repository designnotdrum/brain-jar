/**
 * InferenceEngine - Detects user preferences from text and codebase.
 *
 * Returns InferredPreference objects that require user confirmation
 * before being added to the profile.
 */
import type { InferredPreference, UserProfile } from '@brain-jar/core';
export declare class InferenceEngine {
    private textPatterns;
    /**
     * Detects potential preferences from text input.
     * Returns inferences that should be confirmed with the user.
     */
    detectFromText(text: string, profile: UserProfile): Omit<InferredPreference, 'id' | 'status' | 'createdAt'>[];
    /**
     * Analyzes codebase to infer tech preferences.
     * Scans package.json, config files, etc.
     */
    detectFromCodebase(cwd: string, profile: UserProfile): Promise<Omit<InferredPreference, 'id' | 'status' | 'createdAt'>[]>;
    /**
     * Checks if a value is already in the profile.
     */
    private isAlreadyInProfile;
    /**
     * Splits a comma-separated list into array.
     */
    private splitList;
    /**
     * Cleans up extracted topic text.
     */
    private cleanTopic;
    /**
     * Truncates evidence to reasonable length.
     */
    private truncateEvidence;
}
//# sourceMappingURL=inference-engine.d.ts.map