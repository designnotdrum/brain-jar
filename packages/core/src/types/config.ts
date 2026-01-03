/**
 * Configuration types for brain-jar plugins.
 */

export interface BrainJarConfig {
  mem0_api_key: string;
  default_scope: string;
  auto_summarize: boolean;
}

export interface ConfigStatus {
  status: 'configured' | 'missing';
  apiKey?: string;
  configPath: string;
}
