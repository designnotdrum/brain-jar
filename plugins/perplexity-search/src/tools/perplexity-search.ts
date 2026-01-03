/**
 * PerplexitySearchTool - Executes searches using Perplexity API.
 *
 * Responsibilities:
 * - Perform searches via Perplexity API
 * - Optionally enrich queries with user profile context
 * - Store search results in Mem0 (if configured)
 * - Get relevant context from past searches
 * - Format results for MCP tool responses
 */

import { Perplexity } from '@perplexity-ai/perplexity_ai';
import { Mem0Client, loadConfig, type UserProfile } from '@brain-jar/core';
import { ProfileManager } from '../profile/manager';
import { PerplexitySearchParams } from '../types';

export class PerplexitySearchTool {
  private client: any;
  private mem0Client: Mem0Client | null = null;

  constructor(
    apiKey: string,
    private profileManager: ProfileManager
  ) {
    this.client = new Perplexity({ apiKey });

    // Initialize Mem0 if brain-jar config exists
    try {
      const config = loadConfig();
      if (config?.mem0_api_key) {
        this.mem0Client = new Mem0Client(config.mem0_api_key);
      }
    } catch {
      // No Mem0 config - search memory disabled
    }
  }

  /**
   * Executes a search with optional profile enrichment.
   */
  async search(params: PerplexitySearchParams): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      let query = params.query;

      // Enrich query with profile context if requested
      if (params.include_profile_context) {
        const profile = await this.profileManager.load();
        const contextString = this.buildContextString(profile);
        if (contextString) {
          query = `${params.query}\n\nUser context: ${contextString}`;
        }
      }

      // Get relevant context from past searches (if Mem0 configured)
      if (this.mem0Client && params.include_profile_context) {
        const searchContext = await this.mem0Client.getSearchContext(params.query, 3);
        if (searchContext.length > 0) {
          query += `\n\nRelevant past searches:\n${searchContext.join('\n')}`;
        }
      }

      // Call Perplexity API
      const response = await this.client.chat.completions.create({
        model: 'sonar',
        messages: [
          {
            role: 'user',
            content: query
          }
        ]
      });

      // Extract content from response
      const content = response.choices[0].message.content;

      // Store search result in Mem0 (non-blocking)
      if (this.mem0Client) {
        const summary = this.summarizeResult(content);
        this.mem0Client.storeSearchResult(params.query, summary).catch((err) => {
          console.error('[perplexity-search] Failed to store search result:', err);
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: content
          }
        ]
      };
    } catch (error) {
      const err = error as Error;
      throw new Error(`Perplexity search failed: ${err.message}`);
    }
  }

  /**
   * Builds a context string from user profile.
   * Uses the correct UserProfile schema from @brain-jar/core.
   */
  private buildContextString(profile: UserProfile): string {
    const parts: string[] = [];

    // Add identity context
    if (profile.identity?.role) {
      parts.push(`Role: ${profile.identity.role}`);
    }

    // Add technical preferences
    if (profile.technical?.languages?.length > 0) {
      parts.push(`Languages: ${profile.technical.languages.join(', ')}`);
    }
    if (profile.technical?.frameworks?.length > 0) {
      parts.push(`Frameworks: ${profile.technical.frameworks.join(', ')}`);
    }

    // Add working style
    if (profile.workingStyle?.verbosity && profile.workingStyle.verbosity !== 'adaptive') {
      parts.push(`Prefers ${profile.workingStyle.verbosity} explanations`);
    }

    // Add knowledge level
    if (profile.knowledge?.expert?.length > 0) {
      parts.push(`Expert in: ${profile.knowledge.expert.join(', ')}`);
    }
    if (profile.knowledge?.learning?.length > 0) {
      parts.push(`Currently learning: ${profile.knowledge.learning.join(', ')}`);
    }

    return parts.join('; ');
  }

  /**
   * Summarizes search result for storage.
   * Extracts first ~100 chars as summary.
   */
  private summarizeResult(content: string): string {
    const cleaned = content.replace(/\n+/g, ' ').trim();
    if (cleaned.length <= 100) return cleaned;
    return cleaned.substring(0, 97) + '...';
  }
}
