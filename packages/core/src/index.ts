/**
 * @brain-jar/core
 *
 * Shared core utilities for brain-jar plugins.
 * Provides unified types, Mem0 client, and configuration.
 */

// Types
export * from './types';

// Config utilities
export {
  getConfigDir,
  getConfigPath,
  checkConfig,
  saveConfig,
  loadConfig,
  getMissingConfigMessage,
} from './config';

// Mem0 client
export { Mem0Client } from './mem0-client';
