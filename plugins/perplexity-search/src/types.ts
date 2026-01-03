/**
 * Type definitions for the Perplexity Search Plugin.
 *
 * Re-exports UserProfile from @brain-jar/core for schema compatibility
 * across all brain-jar plugins.
 */

// Re-export UserProfile from core for compatibility
export { UserProfile } from '@brain-jar/core';

/**
 * Configuration for Perplexity API client.
 */
export interface PerplexityConfig {
  /**
   * Perplexity API key.
   * @security This field contains sensitive credentials and should never be logged or exposed.
   */
  apiKey: string;
  /**
   * Default maximum number of search results to return.
   * @range 1-10 (Perplexity API limitation)
   */
  defaultMaxResults?: number;
}

/**
 * Parameters for a Perplexity search request.
 */
export interface PerplexitySearchParams {
  query: string;
  /**
   * Maximum number of search results to return.
   * @range 1-10 (Perplexity API limitation)
   */
  max_results?: number;
  include_profile_context?: boolean;
}

/**
 * Individual search result item returned by Perplexity API.
 */
export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  date?: string;
  last_updated?: string;
}

/**
 * Response structure from Perplexity search API.
 */
export interface PerplexitySearchResult {
  id: string;
  server_time: number;
  results: SearchResultItem[];
}
