/**
 * Re-export shared types from @brain-jar/core.
 */
export { Memory, ConfigStatus } from '@brain-jar/core';

/**
 * MCP tool input types (plugin-specific).
 */
export interface AddMemoryInput {
  content: string;
  scope?: string;
  tags?: string[];
}

export interface SearchMemoryInput {
  query: string;
  scope?: string;
  limit?: number;
}

export interface ListMemoriesInput {
  scope?: string;
  tags?: string[];
  since?: string;
  limit?: number;
}
