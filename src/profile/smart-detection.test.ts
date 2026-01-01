import { SmartDetector } from './smart-detection';
import type { UserProfile } from './types';

describe('SmartDetector', () => {
  let detector: SmartDetector;
  let baseProfile: UserProfile;

  beforeEach(() => {
    detector = new SmartDetector();
    baseProfile = {
      preferences: {
        languages: [],
        learningGoals: [],
        currentProjects: [],
        toolsAndFrameworks: [],
        expertiseLevel: {},
        avoidPatterns: []
      },
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  });

  it('detects language preferences', () => {
    const text = 'I prefer writing code in TypeScript and Python';
    const updated = detector.detectAndUpdate(text, baseProfile);

    expect(updated.preferences.languages).toContain('TypeScript');
    expect(updated.preferences.languages).toContain('Python');
  });

  it('detects learning goals', () => {
    const text = 'I want to learn machine learning and improve my understanding of async patterns';
    const updated = detector.detectAndUpdate(text, baseProfile);

    expect(updated.preferences.learningGoals).toContain('machine learning');
    expect(updated.preferences.learningGoals).toContain('async patterns');
  });

  it('detects current projects', () => {
    const text = "I'm working on a web scraper and building an API server";
    const updated = detector.detectAndUpdate(text, baseProfile);

    expect(updated.preferences.currentProjects).toContain('web scraper');
    expect(updated.preferences.currentProjects).toContain('API server');
  });

  it('detects tools and frameworks', () => {
    const text = 'I use React and Express in my projects';
    const updated = detector.detectAndUpdate(text, baseProfile);

    expect(updated.preferences.toolsAndFrameworks).toContain('React');
    expect(updated.preferences.toolsAndFrameworks).toContain('Express');
  });

  it('detects expertise levels', () => {
    const text = "I'm a beginner at Rust but expert in JavaScript";
    const updated = detector.detectAndUpdate(text, baseProfile);

    expect(updated.preferences.expertiseLevel['Rust']).toBe('beginner');
    expect(updated.preferences.expertiseLevel['JavaScript']).toBe('expert');
  });

  it('detects avoidance patterns', () => {
    const text = "Don't use any as a type and avoid using var in JavaScript";
    const updated = detector.detectAndUpdate(text, baseProfile);

    expect(updated.preferences.avoidPatterns).toContain('any as a type');
    expect(updated.preferences.avoidPatterns).toContain('var in JavaScript');
  });

  it('updates lastUpdated timestamp', () => {
    const oldTimestamp = baseProfile.lastUpdated;
    const text = 'I prefer TypeScript';

    // Small delay to ensure timestamp difference
    setTimeout(() => {
      const updated = detector.detectAndUpdate(text, baseProfile);
      expect(updated.lastUpdated.getTime()).toBeGreaterThan(oldTimestamp.getTime());
    }, 10);
  });

  it('returns unchanged profile for non-preference statements', () => {
    const text = 'The weather is nice today';
    const updated = detector.detectAndUpdate(text, baseProfile);

    expect(updated).toEqual(baseProfile);
  });
});
