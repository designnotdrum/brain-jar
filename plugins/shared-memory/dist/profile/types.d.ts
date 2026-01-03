/**
 * Profile types for holistic user learning.
 * Shared across all brain-jar plugins.
 */
export interface UserProfile {
    version: string;
    identity: {
        name?: string;
        pronouns?: string;
        timezone?: string;
        location?: string;
        role?: string;
        organization?: string;
    };
    technical: {
        languages: string[];
        frameworks: string[];
        tools: string[];
        editors: string[];
        patterns: string[];
        operatingSystems: string[];
    };
    workingStyle: {
        verbosity: 'concise' | 'detailed' | 'adaptive';
        learningPace: 'fast' | 'thorough' | 'adaptive';
        communicationStyle?: string;
        priorities: string[];
    };
    knowledge: {
        expert: string[];
        proficient: string[];
        learning: string[];
        interests: string[];
    };
    personal: {
        interests: string[];
        goals: string[];
        context: string[];
    };
    meta: {
        onboardingComplete: boolean;
        onboardingProgress: {
            identity: boolean;
            technical: boolean;
            workingStyle: boolean;
            personal: boolean;
        };
        lastUpdated: string;
        lastOnboardingPrompt?: string;
        createdAt: string;
    };
}
export interface InferredPreference {
    id: string;
    field: string;
    value: string | string[];
    confidence: 'high' | 'medium' | 'low';
    evidence: string;
    source: 'codebase' | 'conversation' | 'config';
    status: 'pending' | 'confirmed' | 'rejected';
    createdAt: string;
}
export interface OnboardingQuestion {
    category: 'identity' | 'technical' | 'workingStyle' | 'personal';
    field: string;
    question: string;
    followUp?: string;
    examples?: string[];
    optional: boolean;
}
export type ProfileSection = 'all' | 'identity' | 'technical' | 'workingStyle' | 'knowledge' | 'personal' | 'meta';
//# sourceMappingURL=types.d.ts.map