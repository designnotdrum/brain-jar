/**
 * Tests for PerplexitySearchTool.
 *
 * Coverage:
 * - Basic search without profile context
 * - Query enrichment with profile data
 * - Error handling for API failures
 */

import { PerplexitySearchTool } from './perplexity-search';
import { ProfileManager } from '../profile/manager';
import type { UserProfile } from '@brain-jar/core';

// Create a shared mock create function
const mockCreate = jest.fn();

// Mock the Perplexity client
jest.mock('@perplexity-ai/perplexity_ai', () => {
  return {
    Perplexity: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }))
  };
});

// Mock @brain-jar/core to avoid Mem0 initialization
jest.mock('@brain-jar/core', () => ({
  loadConfig: jest.fn().mockReturnValue(null),
  Mem0Client: jest.fn(),
}));

describe('PerplexitySearchTool', () => {
  let tool: PerplexitySearchTool;
  let mockProfileManager: ProfileManager;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock profile manager
    mockProfileManager = {
      load: jest.fn()
    } as any;

    // Create tool instance
    tool = new PerplexitySearchTool('test-api-key', mockProfileManager);
  });

  describe('search without profile context', () => {
    it('should search using raw query when profile context disabled', async () => {
      const mockResponse = {
        id: 'test-id',
        model: 'sonar',
        created: Date.now(),
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        citations: ['https://example.com'],
        object: 'chat.completion',
        choices: [{
          index: 0,
          finish_reason: 'stop',
          message: {
            role: 'assistant',
            content: 'Search results for TypeScript'
          },
          delta: { role: 'assistant', content: '' }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await tool.search({
        query: 'TypeScript best practices',
        include_profile_context: false
      });

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'sonar',
        messages: [
          {
            role: 'user',
            content: 'TypeScript best practices'
          }
        ]
      });

      expect(result.content[0].text).toBe('Search results for TypeScript');
      expect(mockProfileManager.load).not.toHaveBeenCalled();
    });
  });

  describe('search with profile context', () => {
    it('should enrich query with profile data when enabled', async () => {
      const now = new Date().toISOString();
      const mockProfile: UserProfile = {
        version: '1.0.0',
        identity: {
          role: 'Developer',
        },
        technical: {
          languages: ['TypeScript', 'Python'],
          frameworks: ['React', 'Node.js'],
          tools: ['VS Code', 'Git'],
          editors: ['VS Code'],
          patterns: ['functional programming'],
          operatingSystems: [],
        },
        workingStyle: {
          verbosity: 'detailed',
          learningPace: 'adaptive',
          communicationStyle: 'technical',
          priorities: ['code quality', 'performance'],
        },
        knowledge: {
          expert: ['JavaScript'],
          proficient: ['TypeScript'],
          learning: ['Rust'],
          interests: [],
        },
        personal: {
          interests: [],
          goals: [],
          context: [],
        },
        meta: {
          onboardingComplete: true,
          onboardingProgress: {
            identity: true,
            technical: true,
            workingStyle: true,
            personal: true,
          },
          lastUpdated: now,
          createdAt: now,
        },
      };

      (mockProfileManager.load as any).mockResolvedValue(mockProfile);

      const mockResponse = {
        id: 'test-id',
        model: 'sonar',
        created: Date.now(),
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        citations: ['https://example.com'],
        object: 'chat.completion',
        choices: [{
          index: 0,
          finish_reason: 'stop',
          message: {
            role: 'assistant',
            content: 'Enriched search results'
          },
          delta: { role: 'assistant', content: '' }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await tool.search({
        query: 'error handling',
        include_profile_context: true
      });

      // Verify profile was loaded
      expect(mockProfileManager.load).toHaveBeenCalled();

      // Verify enriched query was sent
      const call = mockCreate.mock.calls[0][0];
      expect(call.messages[0].content).toContain('error handling');
      expect(call.messages[0].content).toContain('TypeScript');
      expect(call.messages[0].content).toContain('React');

      expect(result.content[0].text).toBe('Enriched search results');
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('API rate limit exceeded'));

      await expect(tool.search({
        query: 'test query',
        include_profile_context: false
      })).rejects.toThrow('Perplexity search failed: API rate limit exceeded');
    });
  });
});
