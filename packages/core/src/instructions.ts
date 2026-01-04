/**
 * Custom Mem0 instructions for memory filtering.
 * Supports user override via ~/.config/brain-jar/mem0-instructions.txt
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const USER_INSTRUCTIONS_PATH = path.join(
  os.homedir(),
  '.config',
  'brain-jar',
  'mem0-instructions.txt'
);

const DEFAULT_INSTRUCTIONS = `Brain-jar memory assistant rules:

STORE:
- Decisions and their rationale
- User preferences explicitly stated
- Project-specific context and learnings
- Technical discoveries and solutions
- Workflow patterns that worked well

IGNORE:
- Facts about user identity, skills, or preferences (route to profile)
- Search queries (handled by perplexity namespace)
- Transient debugging context
- Speculation (might, maybe, possibly)
- Duplicate information already stored

CONSOLIDATE:
- If a fact updates an existing memory, update rather than add
- Prefer specific over general ("uses TypeScript 5.3" over "uses TypeScript")`;

/**
 * Gets Mem0 instructions, preferring user override if it exists.
 */
export function getInstructions(): string {
  try {
    if (fs.existsSync(USER_INSTRUCTIONS_PATH)) {
      return fs.readFileSync(USER_INSTRUCTIONS_PATH, 'utf-8').trim();
    }
  } catch {
    // Fall through to default
  }
  return DEFAULT_INSTRUCTIONS;
}

export { USER_INSTRUCTIONS_PATH, DEFAULT_INSTRUCTIONS };
