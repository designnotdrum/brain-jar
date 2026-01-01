/**
 * User preferences for smart detection and profile management.
 */
export interface UserPreferences {
  languages: string[];
  learningGoals: string[];
  currentProjects: string[];
  toolsAndFrameworks: string[];
  expertiseLevel: Record<string, string>;
  avoidPatterns: string[];
}

/**
 * User profile structure for smart detection.
 */
export interface UserProfile {
  preferences: UserPreferences;
  createdAt: Date;
  lastUpdated: Date;
}
