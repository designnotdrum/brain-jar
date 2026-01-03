/**
 * SmartDetector - Detects user preferences from text.
 * NOTE: This is a simplified detector for perplexity-search.
 * The full inference engine is in shared-memory plugin.
 *
 * Updates to use @brain-jar/core UserProfile schema.
 */

import type { UserProfile } from '@brain-jar/core';

interface Pattern {
  regex: RegExp;
  category: 'language' | 'framework' | 'tool' | 'pattern' | 'learning' | 'expert' | 'proficient';
  extract: (match: RegExpMatchArray) => { value: string };
}

export class SmartDetector {
  private patterns: Pattern[] = [
    // Languages
    {
      regex: /\b(TypeScript|JavaScript|Python|Java|Go|Rust|C\+\+|Ruby|PHP|Swift|Kotlin|C#|Scala|Haskell|Elixir)\b/g,
      category: 'language',
      extract: (match) => ({ value: match[1] })
    },

    // Frameworks
    {
      regex: /\b(React|Vue|Angular|Express|Django|Flask|Rails|Spring|Next\.js|Nuxt|Svelte|FastAPI|NestJS)\b/g,
      category: 'framework',
      extract: (match) => ({ value: match[1] })
    },

    // Tools
    {
      regex: /\b(Docker|Kubernetes|Git|PostgreSQL|MongoDB|Redis|Webpack|Vite|Jest|Vitest|Playwright|Cypress)\b/g,
      category: 'tool',
      extract: (match) => ({ value: match[1] })
    },

    // Patterns
    {
      regex: /\b(MVC|MVVM|microservices|monolith|REST|GraphQL|event-driven|functional programming|OOP|TDD|BDD)\b/gi,
      category: 'pattern',
      extract: (match) => ({ value: match[1] })
    },

    // Learning topics
    {
      regex: /(?:want to learn|learning|study|improve my understanding of)\s+([^.,!?]+)/gi,
      category: 'learning',
      extract: (match) => ({ value: match[1].trim() })
    },

    // Expert topics
    {
      regex: /(?:expert at|expert in|very experienced with|mastered)\s+([^.,!?]+)/gi,
      category: 'expert',
      extract: (match) => ({ value: match[1].trim() })
    },

    // Proficient topics
    {
      regex: /(?:proficient at|proficient in|good at|comfortable with|experienced with)\s+([^.,!?]+)/gi,
      category: 'proficient',
      extract: (match) => ({ value: match[1].trim() })
    }
  ];

  /**
   * Detects preferences from text and returns updated profile.
   * Uses the @brain-jar/core UserProfile schema.
   */
  detectAndUpdate(text: string, profile: UserProfile): UserProfile {
    let updated = false;
    const now = new Date().toISOString();

    // Deep clone the profile
    const newProfile: UserProfile = {
      version: profile.version,
      identity: { ...profile.identity },
      technical: {
        languages: [...profile.technical.languages],
        frameworks: [...profile.technical.frameworks],
        tools: [...profile.technical.tools],
        editors: [...profile.technical.editors],
        patterns: [...profile.technical.patterns],
        operatingSystems: [...profile.technical.operatingSystems],
      },
      workingStyle: {
        verbosity: profile.workingStyle.verbosity,
        learningPace: profile.workingStyle.learningPace,
        communicationStyle: profile.workingStyle.communicationStyle,
        priorities: [...profile.workingStyle.priorities],
      },
      knowledge: {
        expert: [...profile.knowledge.expert],
        proficient: [...profile.knowledge.proficient],
        learning: [...profile.knowledge.learning],
        interests: [...profile.knowledge.interests],
      },
      personal: {
        interests: [...profile.personal.interests],
        goals: [...profile.personal.goals],
        context: [...profile.personal.context],
      },
      meta: {
        ...profile.meta,
        onboardingProgress: { ...profile.meta.onboardingProgress },
      },
    };

    for (const pattern of this.patterns) {
      const matches = Array.from(text.matchAll(pattern.regex));

      for (const match of matches) {
        const extracted = pattern.extract(match);
        const value = extracted.value;

        switch (pattern.category) {
          case 'language':
            if (!newProfile.technical.languages.includes(value)) {
              newProfile.technical.languages.push(value);
              updated = true;
            }
            break;

          case 'framework':
            if (!newProfile.technical.frameworks.includes(value)) {
              newProfile.technical.frameworks.push(value);
              updated = true;
            }
            break;

          case 'tool':
            if (!newProfile.technical.tools.includes(value)) {
              newProfile.technical.tools.push(value);
              updated = true;
            }
            break;

          case 'pattern':
            if (!newProfile.technical.patterns.includes(value)) {
              newProfile.technical.patterns.push(value);
              updated = true;
            }
            break;

          case 'learning': {
            const topics = value.split(/\s+and\s+/);
            for (const topic of topics) {
              const trimmedTopic = topic.trim()
                .replace(/^(?:want to learn|learning|study|improve my understanding of)\s+/i, '');
              if (trimmedTopic && !newProfile.knowledge.learning.includes(trimmedTopic)) {
                newProfile.knowledge.learning.push(trimmedTopic);
                updated = true;
              }
            }
            break;
          }

          case 'expert': {
            const topics = value.split(/\s+and\s+/);
            for (const topic of topics) {
              const trimmedTopic = topic.trim()
                .replace(/^(?:expert at|expert in|very experienced with|mastered)\s+/i, '');
              if (trimmedTopic && !newProfile.knowledge.expert.includes(trimmedTopic)) {
                newProfile.knowledge.expert.push(trimmedTopic);
                updated = true;
              }
            }
            break;
          }

          case 'proficient': {
            const topics = value.split(/\s+and\s+/);
            for (const topic of topics) {
              const trimmedTopic = topic.trim()
                .replace(/^(?:proficient at|proficient in|good at|comfortable with|experienced with)\s+/i, '');
              if (trimmedTopic && !newProfile.knowledge.proficient.includes(trimmedTopic)) {
                newProfile.knowledge.proficient.push(trimmedTopic);
                updated = true;
              }
            }
            break;
          }
        }
      }
    }

    if (updated) {
      newProfile.meta.lastUpdated = now;
    }

    return newProfile;
  }
}
