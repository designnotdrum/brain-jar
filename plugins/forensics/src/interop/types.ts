/**
 * Forensics-specific memory types.
 * These are stored in Mem0 with metadata.type prefixes.
 */

export type InvestigationMode = 'protocol' | 'feature' | 'codebase' | 'decision' | 'format';
export type InvestigationStatus = 'active' | 'paused' | 'complete';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

// Endpoint discovered during protocol analysis
export interface Endpoint {
  method: string;
  path: string;
  description?: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  requestSchema?: unknown;
  responseSchema?: unknown;
  statusCodes?: number[];
}

// Auth pattern discovered during analysis
export interface AuthPattern {
  type: 'bearer' | 'basic' | 'api-key' | 'oauth' | 'jwt' | 'custom';
  location: 'header' | 'query' | 'cookie' | 'body';
  headerName?: string;
  notes?: string;
}

// Feature breakdown from competitive analysis
export interface FeatureBreakdown {
  name: string;
  components: string[];
  flows: string[];
  edgeCases: string[];
  implementation?: string; // Suggested implementation approach
}

// Investigation memory structure
export interface Investigation {
  id: string;
  name: string;
  mode: InvestigationMode;
  status: InvestigationStatus;
  scope: string; // "global" or "project:<name>" - auto-detected from cwd
  created: string;
  updated: string;
  target?: string; // What we're investigating (device, feature, codebase)
  findings: {
    endpoints?: Endpoint[];
    auth?: AuthPattern;
    payloadSchemas?: unknown[];
    features?: FeatureBreakdown[];
    notes?: string[];
  };
  sessionState?: {
    lastStep?: string;
    pendingActions?: string[];
    context?: Record<string, unknown>;
    // Protocol mode state
    hasCapture?: boolean;
    hasSpec?: boolean;
    // Feature mode state
    hasResearch?: boolean;
  };
}

// API spec built from investigation findings
export interface APISpec {
  name: string;
  version: string;
  description?: string;
  baseUrl?: string;
  auth?: AuthPattern;
  endpoints: Endpoint[];
  created: string;
  updated: string;
  investigationId?: string;
}

// Memory metadata types (for Mem0 storage)
export const FORENSICS_TYPES = {
  investigation: 'forensics:investigation',
  concept: 'forensics:concept',
  spec: 'forensics:spec',
} as const;
