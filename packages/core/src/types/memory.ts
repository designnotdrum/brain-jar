/**
 * Memory types for brain-jar storage.
 */

export interface Memory {
  id: string;
  content: string;
  scope: string; // 'global' or 'project:<name>'
  tags: string[];
  source: {
    agent: string;
    action?: string;
  };
  created_at: Date;
  updated_at: Date;
}

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

// Activity summary stored in Mem0
export interface ActivitySummary {
  content: string;
  scope: string;
  periodStart: string;
  periodEnd: string;
  memoryCount: number;
  timestamp: string;
  mem0Id?: string;
}
