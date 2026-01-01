import type { UserProfile } from './types';

interface Pattern {
  regex: RegExp;
  category: 'language' | 'learningGoal' | 'currentProject' | 'toolFramework' | 'expertise' | 'avoidance';
  extract: (match: RegExpMatchArray) => { key?: string; value: string | number };
}

export class SmartDetector {
  private patterns: Pattern[] = [
    // Language preferences
    {
      regex: /(?:prefer|use|write|code in|like)\s+(?:writing\s+)?(?:code\s+in\s+)?(\w+)/gi,
      category: 'language',
      extract: (match) => ({ value: match[1] })
    },
    {
      regex: /\b(TypeScript|JavaScript|Python|Java|Go|Rust|C\+\+|Ruby|PHP|Swift|Kotlin)\b/g,
      category: 'language',
      extract: (match) => ({ value: match[1] })
    },

    // Learning goals
    {
      regex: /(?:want to learn|learning|study|improve my understanding of)\s+([^.,!?]+)/gi,
      category: 'learningGoal',
      extract: (match) => ({ value: match[1].trim() })
    },

    // Current projects
    {
      regex: /(?:working on|building|developing)\s+(?:a\s+)?([^.,!?]+)/gi,
      category: 'currentProject',
      extract: (match) => ({ value: match[1].trim() })
    },

    // Tools and frameworks
    {
      regex: /(?:use|using|work with)\s+(\w+)/gi,
      category: 'toolFramework',
      extract: (match) => ({ value: match[1] })
    },
    {
      regex: /\b(React|Vue|Angular|Express|Django|Flask|Rails|Spring|Next\.js|Nuxt|Svelte)\b/g,
      category: 'toolFramework',
      extract: (match) => ({ value: match[1] })
    },

    // Expertise levels
    {
      regex: /(beginner|intermediate|expert|advanced)\s+(?:at|in)\s+(\w+)/gi,
      category: 'expertise',
      extract: (match) => ({ key: match[2], value: match[1].toLowerCase() })
    },

    // Avoidance patterns
    {
      regex: /(?:don't use|avoid using|never use)\s+([^.,!?]+)/gi,
      category: 'avoidance',
      extract: (match) => ({ value: match[1].trim() })
    }
  ];

  detectAndUpdate(text: string, profile: UserProfile): UserProfile {
    let updated = false;
    const newProfile = { ...profile };

    // Deep copy preferences to avoid mutations
    newProfile.preferences = {
      languages: [...profile.preferences.languages],
      learningGoals: [...profile.preferences.learningGoals],
      currentProjects: [...profile.preferences.currentProjects],
      toolsAndFrameworks: [...profile.preferences.toolsAndFrameworks],
      expertiseLevel: { ...profile.preferences.expertiseLevel },
      avoidPatterns: [...profile.preferences.avoidPatterns]
    };

    for (const pattern of this.patterns) {
      const matches = Array.from(text.matchAll(pattern.regex));

      for (const match of matches) {
        const extracted = pattern.extract(match);

        switch (pattern.category) {
          case 'language':
            if (!newProfile.preferences.languages.includes(extracted.value as string)) {
              newProfile.preferences.languages.push(extracted.value as string);
              updated = true;
            }
            break;

          case 'learningGoal': {
            // Split by "and" to handle multiple goals in one sentence
            const goals = (extracted.value as string).split(/\s+and\s+/);
            for (const goal of goals) {
              // Remove common trigger phrases that might be included
              let trimmedGoal = goal.trim()
                .replace(/^(?:want to learn|learning|study|improve my understanding of)\s+/i, '');
              if (trimmedGoal && !newProfile.preferences.learningGoals.includes(trimmedGoal)) {
                newProfile.preferences.learningGoals.push(trimmedGoal);
                updated = true;
              }
            }
            break;
          }

          case 'currentProject': {
            // Split by "and" to handle multiple projects in one sentence
            const projects = (extracted.value as string).split(/\s+and\s+/);
            for (const project of projects) {
              // Remove common trigger phrases that might be included
              let trimmedProject = project.trim()
                .replace(/^(?:working on|building|developing)\s+(?:a\s+|an\s+)?/i, '');
              if (trimmedProject && !newProfile.preferences.currentProjects.includes(trimmedProject)) {
                newProfile.preferences.currentProjects.push(trimmedProject);
                updated = true;
              }
            }
            break;
          }

          case 'toolFramework':
            if (!newProfile.preferences.toolsAndFrameworks.includes(extracted.value as string)) {
              newProfile.preferences.toolsAndFrameworks.push(extracted.value as string);
              updated = true;
            }
            break;

          case 'expertise':
            if (extracted.key) {
              newProfile.preferences.expertiseLevel[extracted.key] = extracted.value as string;
              updated = true;
            }
            break;

          case 'avoidance': {
            // Split by "and" to handle multiple patterns in one sentence
            const patterns = (extracted.value as string).split(/\s+and\s+(?:avoid using\s+)?/);
            for (const patternText of patterns) {
              const trimmedPattern = patternText.trim();
              if (trimmedPattern && !newProfile.preferences.avoidPatterns.includes(trimmedPattern)) {
                newProfile.preferences.avoidPatterns.push(trimmedPattern);
                updated = true;
              }
            }
            break;
          }
        }
      }
    }

    if (updated) {
      newProfile.lastUpdated = new Date();
    }

    return newProfile;
  }
}
