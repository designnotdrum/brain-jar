/**
 * Shared configuration utilities for brain-jar plugins.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BrainJarConfig, ConfigStatus } from './types';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'brain-jar');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function checkConfig(): ConfigStatus {
  if (!fs.existsSync(CONFIG_FILE)) {
    return { status: 'missing', configPath: CONFIG_FILE };
  }

  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(content) as Partial<BrainJarConfig>;

    if (!config.mem0_api_key) {
      return { status: 'missing', configPath: CONFIG_FILE };
    }

    return {
      status: 'configured',
      apiKey: config.mem0_api_key,
      configPath: CONFIG_FILE,
    };
  } catch {
    return { status: 'missing', configPath: CONFIG_FILE };
  }
}

export function saveConfig(config: BrainJarConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function loadConfig(): BrainJarConfig | null {
  const status = checkConfig();
  if (status.status === 'missing') {
    return null;
  }

  const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
  return JSON.parse(content) as BrainJarConfig;
}

export function getMissingConfigMessage(): string {
  return `
Mem0 API Key Required

To use brain-jar plugins with cloud storage, you need a Mem0 API key:

1. Go to https://app.mem0.ai
2. Sign up (free tier: 10,000 memories)
3. Navigate to Settings -> API Keys
4. Create and copy your key

Then create ${CONFIG_FILE} with:
{
  "mem0_api_key": "your-key-here",
  "default_scope": "global",
  "auto_summarize": true
}
`.trim();
}
