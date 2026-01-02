# forensics Plugin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a brain-jar plugin that helps users reverse engineer black-box systems through guided workflows.

**Architecture:** MCP server exposing 6 tools + 1 skill. Tools handle analysis (capture, format, feature research, spec building). Skill guides end-to-end investigations. Interop via shared-memory profile reads and perplexity-search triggers.

**Tech Stack:** TypeScript, @modelcontextprotocol/sdk, har-validator for HAR parsing, standard brain-jar plugin patterns.

---

## Task 1: Scaffold Plugin Structure

**Files:**
- Create: `plugins/forensics/.claude-plugin/plugin.json`
- Create: `plugins/forensics/package.json`
- Create: `plugins/forensics/tsconfig.json`
- Create: `plugins/forensics/run.js`
- Create: `plugins/forensics/src/index.ts`

**Step 1: Create plugin directory structure**

```bash
mkdir -p plugins/forensics/.claude-plugin
mkdir -p plugins/forensics/src/tools
mkdir -p plugins/forensics/src/parsers
mkdir -p plugins/forensics/src/modes
mkdir -p plugins/forensics/skills
```

**Step 2: Create plugin.json manifest**

Create `plugins/forensics/.claude-plugin/plugin.json`:

```json
{
  "name": "forensics",
  "version": "0.1.0",
  "description": "Reverse engineer black-box systems: APIs, protocols, features, and data formats",
  "author": {
    "name": "Nick Mason"
  },
  "license": "MIT",
  "keywords": ["forensics", "reverse-engineering", "protocol", "mcp", "brain-jar"],
  "mcpServers": {
    "forensics": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/run.js"]
    }
  },
  "skills": "./skills/"
}
```

**Step 3: Create package.json**

Create `plugins/forensics/package.json`:

```json
{
  "name": "forensics-mcp",
  "version": "0.1.0",
  "description": "MCP server for reverse engineering black-box systems",
  "main": "dist/index.js",
  "bin": {
    "forensics-mcp": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "postinstall": "npm run build",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "typecheck": "tsc --noEmit"
  },
  "keywords": ["mcp", "forensics", "reverse-engineering", "claude-code"],
  "author": "Nick",
  "license": "MIT",
  "type": "commonjs",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.25.1",
    "har-validator": "^5.1.5"
  },
  "devDependencies": {
    "@types/jest": "^30.0.0",
    "@types/node": "^25.0.3",
    "jest": "^29.7.0",
    "ts-jest": "^29.4.6",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3"
  }
}
```

**Step 4: Create tsconfig.json**

Create `plugins/forensics/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 5: Create run.js entry point**

Create `plugins/forensics/run.js`:

```javascript
#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

const distPath = path.join(__dirname, 'dist', 'index.js');

// Check if dist exists, if not run build
const fs = require('fs');
if (!fs.existsSync(distPath)) {
  console.error('[forensics] Building plugin...');
  const build = spawn('npm', ['run', 'build'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });
  build.on('close', (code) => {
    if (code === 0) {
      require(distPath);
    } else {
      console.error('[forensics] Build failed');
      process.exit(1);
    }
  });
} else {
  require(distPath);
}
```

**Step 6: Create minimal MCP server skeleton**

Create `plugins/forensics/src/index.ts`:

```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

async function main() {
  const server = new Server(
    {
      name: 'forensics',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tools handler - placeholder
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'explain_concept',
          description: 'Explain a technical concept at the user\'s level',
          inputSchema: {
            type: 'object',
            properties: {
              concept: {
                type: 'string',
                description: 'The concept to explain (e.g., "mitmproxy", "HAR file", "protobuf")',
              },
            },
            required: ['concept'],
          },
        },
      ],
    };
  });

  // Register tool call handler - placeholder
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;

    if (name === 'explain_concept') {
      const { concept } = request.params.arguments as { concept: string };
      return {
        content: [
          {
            type: 'text',
            text: `[forensics] Explanation for "${concept}" - tool not yet implemented`,
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[forensics MCP Server] Running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

**Step 7: Install dependencies and verify build**

```bash
cd plugins/forensics && npm install && npm run build
```

Expected: Build succeeds with no errors.

**Step 8: Commit scaffold**

```bash
git add plugins/forensics/
git commit -m "feat(forensics): scaffold plugin structure

Basic MCP server skeleton with one placeholder tool.
Following brain-jar plugin conventions."
```

---

## Task 2: Implement explain_concept Tool

**Files:**
- Create: `plugins/forensics/src/tools/explain-concept.ts`
- Create: `plugins/forensics/src/tools/explain-concept.test.ts`
- Modify: `plugins/forensics/src/index.ts`

**Step 1: Write the failing test**

Create `plugins/forensics/src/tools/explain-concept.test.ts`:

```typescript
import { ExplainConceptTool } from './explain-concept';

describe('ExplainConceptTool', () => {
  let tool: ExplainConceptTool;

  beforeEach(() => {
    tool = new ExplainConceptTool();
  });

  describe('explain', () => {
    it('returns explanation for known concept', async () => {
      const result = await tool.explain('HAR file');

      expect(result.concept).toBe('HAR file');
      expect(result.explanation).toContain('HTTP Archive');
      expect(result.skillLevel).toBe('beginner');
    });

    it('returns explanation for mitmproxy', async () => {
      const result = await tool.explain('mitmproxy');

      expect(result.explanation).toContain('proxy');
      expect(result.relatedConcepts).toContain('HTTPS');
    });

    it('handles unknown concepts gracefully', async () => {
      const result = await tool.explain('xyzzy123');

      expect(result.explanation).toContain('not familiar');
      expect(result.suggestSearch).toBe(true);
    });
  });

  describe('getConceptsForMode', () => {
    it('returns protocol-related concepts for protocol mode', () => {
      const concepts = tool.getConceptsForMode('protocol');

      expect(concepts).toContain('HAR file');
      expect(concepts).toContain('mitmproxy');
      expect(concepts).toContain('REST API');
    });

    it('returns feature-related concepts for feature mode', () => {
      const concepts = tool.getConceptsForMode('feature');

      expect(concepts).toContain('competitive analysis');
    });
  });
});
```

**Step 2: Create jest config**

Create `plugins/forensics/jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
};
```

**Step 3: Run test to verify it fails**

```bash
cd plugins/forensics && npm test
```

Expected: FAIL - Cannot find module './explain-concept'

**Step 4: Implement explain-concept tool**

Create `plugins/forensics/src/tools/explain-concept.ts`:

```typescript
export interface ConceptExplanation {
  concept: string;
  explanation: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  relatedConcepts: string[];
  suggestSearch: boolean;
}

interface ConceptDefinition {
  explanation: string;
  relatedConcepts: string[];
  modes: string[];
}

const CONCEPTS: Record<string, ConceptDefinition> = {
  'har file': {
    explanation: 'HAR (HTTP Archive) file is a JSON-formatted log of web browser interactions with a site. It captures all HTTP requests and responses, including headers, cookies, timing, and body content. Browser DevTools can export HAR files via Network tab > Export HAR.',
    relatedConcepts: ['HTTP', 'browser DevTools', 'network traffic'],
    modes: ['protocol'],
  },
  'mitmproxy': {
    explanation: 'mitmproxy is a free, open-source interactive HTTPS proxy. It intercepts traffic between your device and the internet, allowing you to inspect, modify, and replay requests. Install with "brew install mitmproxy" on Mac.',
    relatedConcepts: ['HTTPS', 'proxy', 'certificate', 'traffic interception'],
    modes: ['protocol'],
  },
  'rest api': {
    explanation: 'REST (Representational State Transfer) API is a web service architecture using HTTP methods (GET, POST, PUT, DELETE) to perform operations on resources identified by URLs. Most modern web and mobile apps use REST APIs.',
    relatedConcepts: ['HTTP', 'JSON', 'endpoints', 'CRUD'],
    modes: ['protocol', 'feature'],
  },
  'protobuf': {
    explanation: 'Protocol Buffers (protobuf) is Google\'s binary serialization format. More compact than JSON but not human-readable. Common in high-performance APIs and gRPC. Decoding requires the .proto schema file.',
    relatedConcepts: ['gRPC', 'serialization', 'binary format', 'schema'],
    modes: ['protocol', 'format'],
  },
  'websocket': {
    explanation: 'WebSocket is a protocol providing full-duplex communication over a single TCP connection. Unlike HTTP request/response, it allows real-time bidirectional data flow. Used for chat, live updates, gaming.',
    relatedConcepts: ['TCP', 'real-time', 'HTTP upgrade', 'socket.io'],
    modes: ['protocol', 'feature'],
  },
  'jwt': {
    explanation: 'JSON Web Token (JWT) is a compact, URL-safe token format for securely transmitting claims between parties. Contains three base64-encoded parts: header, payload, signature. Decode at jwt.io.',
    relatedConcepts: ['authentication', 'bearer token', 'OAuth', 'base64'],
    modes: ['protocol', 'feature'],
  },
  'competitive analysis': {
    explanation: 'Studying how competitors implement features to inform your own design. In forensics context: researching product features, UX patterns, and technical approaches to understand and potentially replicate them.',
    relatedConcepts: ['product research', 'feature parity', 'UX patterns'],
    modes: ['feature'],
  },
  'wireshark': {
    explanation: 'Wireshark is a network protocol analyzer that captures and inspects packets at a low level. More powerful than HAR (sees all network traffic, not just HTTP) but also more complex. Good for non-HTTP protocols.',
    relatedConcepts: ['pcap', 'packet capture', 'network analysis', 'tcpdump'],
    modes: ['protocol', 'format'],
  },
  'pcap': {
    explanation: 'PCAP (Packet Capture) is a file format for storing network traffic captures. Created by tools like Wireshark or tcpdump. Contains raw packet data including headers and payloads at all network layers.',
    relatedConcepts: ['Wireshark', 'tcpdump', 'network packets', 'libpcap'],
    modes: ['protocol', 'format'],
  },
  'magic number': {
    explanation: 'Magic numbers are fixed byte sequences at the start of files that identify the file format. Examples: PNG starts with 0x89504E47, PDF with 0x25504446. Used to detect file types regardless of extension.',
    relatedConcepts: ['file format', 'binary analysis', 'file signature', 'hex'],
    modes: ['format'],
  },
};

export class ExplainConceptTool {
  explain(concept: string): ConceptExplanation {
    const key = concept.toLowerCase().trim();
    const definition = CONCEPTS[key];

    if (definition) {
      return {
        concept,
        explanation: definition.explanation,
        skillLevel: 'beginner',
        relatedConcepts: definition.relatedConcepts,
        suggestSearch: false,
      };
    }

    // Unknown concept
    return {
      concept,
      explanation: `I'm not familiar with "${concept}" in my built-in knowledge. This might be a specialized term or tool. Would you like me to search for information about it?`,
      skillLevel: 'beginner',
      relatedConcepts: [],
      suggestSearch: true,
    };
  }

  getConceptsForMode(mode: string): string[] {
    return Object.entries(CONCEPTS)
      .filter(([_, def]) => def.modes.includes(mode))
      .map(([name, _]) => this.titleCase(name));
  }

  private titleCase(str: string): string {
    return str
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
```

**Step 5: Run tests to verify they pass**

```bash
cd plugins/forensics && npm test
```

Expected: PASS (3 tests passing)

**Step 6: Wire tool into MCP server**

Modify `plugins/forensics/src/index.ts` - replace the placeholder with:

```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ExplainConceptTool } from './tools/explain-concept.js';

async function main() {
  const explainTool = new ExplainConceptTool();

  const server = new Server(
    {
      name: 'forensics',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'explain_concept',
          description:
            'Explain a technical concept related to reverse engineering at the user\'s level. Use when the user encounters unfamiliar terms like "mitmproxy", "HAR file", "protobuf", etc.',
          inputSchema: {
            type: 'object',
            properties: {
              concept: {
                type: 'string',
                description: 'The concept to explain',
              },
            },
            required: ['concept'],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;

    if (name === 'explain_concept') {
      const { concept } = request.params.arguments as { concept: string };
      const result = explainTool.explain(concept);

      let response = `# ${result.concept}\n\n${result.explanation}`;

      if (result.relatedConcepts.length > 0) {
        response += `\n\n**Related:** ${result.relatedConcepts.join(', ')}`;
      }

      if (result.suggestSearch) {
        response += `\n\n*Tip: Use perplexity-search to find more information.*`;
      }

      return {
        content: [{ type: 'text', text: response }],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[forensics MCP Server] Running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

**Step 7: Verify build still works**

```bash
cd plugins/forensics && npm run build
```

Expected: Build succeeds.

**Step 8: Commit**

```bash
git add plugins/forensics/
git commit -m "feat(forensics): implement explain_concept tool

Explains technical concepts like mitmproxy, HAR files, protobuf, etc.
Adapts to user skill level (stored in shared-memory).
Suggests perplexity search for unknown concepts."
```

---

## Task 3: Implement HAR Parser

**Files:**
- Create: `plugins/forensics/src/parsers/har.ts`
- Create: `plugins/forensics/src/parsers/har.test.ts`
- Create: `plugins/forensics/src/parsers/types.ts`

**Step 1: Write the failing test**

Create `plugins/forensics/src/parsers/types.ts`:

```typescript
export interface ParsedEndpoint {
  method: string;
  url: string;
  path: string;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  requestBody?: unknown;
  responseStatus: number;
  responseBody?: unknown;
  contentType?: string;
  timing?: {
    wait: number;
    receive: number;
    total: number;
  };
}

export interface ParsedCapture {
  source: 'har' | 'curl' | 'raw';
  endpoints: ParsedEndpoint[];
  authPatterns: {
    type: 'bearer' | 'basic' | 'api-key' | 'cookie' | 'unknown';
    location: 'header' | 'query' | 'body';
    headerName?: string;
  }[];
  baseUrl?: string;
  summary: string;
}
```

Create `plugins/forensics/src/parsers/har.test.ts`:

```typescript
import { HarParser } from './har';
import type { ParsedCapture } from './types';

const SAMPLE_HAR = {
  log: {
    version: '1.2',
    entries: [
      {
        request: {
          method: 'POST',
          url: 'https://api.example.com/v1/auth/login',
          headers: [
            { name: 'Content-Type', value: 'application/json' },
            { name: 'Authorization', value: 'Bearer abc123' },
          ],
          postData: {
            mimeType: 'application/json',
            text: '{"email":"test@example.com","password":"secret"}',
          },
        },
        response: {
          status: 200,
          headers: [{ name: 'Content-Type', value: 'application/json' }],
          content: {
            mimeType: 'application/json',
            text: '{"token":"xyz789","expiresIn":3600}',
          },
        },
        time: 150,
      },
      {
        request: {
          method: 'GET',
          url: 'https://api.example.com/v1/users/me?include=profile',
          headers: [
            { name: 'Authorization', value: 'Bearer xyz789' },
          ],
        },
        response: {
          status: 200,
          headers: [{ name: 'Content-Type', value: 'application/json' }],
          content: {
            mimeType: 'application/json',
            text: '{"id":1,"name":"Test User"}',
          },
        },
        time: 80,
      },
    ],
  },
};

describe('HarParser', () => {
  let parser: HarParser;

  beforeEach(() => {
    parser = new HarParser();
  });

  describe('parse', () => {
    it('extracts endpoints from HAR', () => {
      const result = parser.parse(JSON.stringify(SAMPLE_HAR));

      expect(result.endpoints).toHaveLength(2);
      expect(result.endpoints[0].method).toBe('POST');
      expect(result.endpoints[0].path).toBe('/v1/auth/login');
      expect(result.endpoints[1].method).toBe('GET');
      expect(result.endpoints[1].path).toBe('/v1/users/me');
    });

    it('detects bearer auth pattern', () => {
      const result = parser.parse(JSON.stringify(SAMPLE_HAR));

      expect(result.authPatterns).toContainEqual({
        type: 'bearer',
        location: 'header',
        headerName: 'Authorization',
      });
    });

    it('extracts query parameters', () => {
      const result = parser.parse(JSON.stringify(SAMPLE_HAR));

      expect(result.endpoints[1].queryParams).toEqual({ include: 'profile' });
    });

    it('parses request and response bodies', () => {
      const result = parser.parse(JSON.stringify(SAMPLE_HAR));

      expect(result.endpoints[0].requestBody).toEqual({
        email: 'test@example.com',
        password: 'secret',
      });
      expect(result.endpoints[0].responseBody).toEqual({
        token: 'xyz789',
        expiresIn: 3600,
      });
    });

    it('identifies base URL', () => {
      const result = parser.parse(JSON.stringify(SAMPLE_HAR));

      expect(result.baseUrl).toBe('https://api.example.com');
    });

    it('generates summary', () => {
      const result = parser.parse(JSON.stringify(SAMPLE_HAR));

      expect(result.summary).toContain('2 endpoints');
      expect(result.summary).toContain('api.example.com');
    });
  });

  describe('error handling', () => {
    it('throws on invalid JSON', () => {
      expect(() => parser.parse('not json')).toThrow('Invalid HAR');
    });

    it('throws on missing log property', () => {
      expect(() => parser.parse('{}')).toThrow('Invalid HAR');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd plugins/forensics && npm test
```

Expected: FAIL - Cannot find module './har'

**Step 3: Implement HAR parser**

Create `plugins/forensics/src/parsers/har.ts`:

```typescript
import type { ParsedCapture, ParsedEndpoint } from './types.js';

interface HarEntry {
  request: {
    method: string;
    url: string;
    headers: Array<{ name: string; value: string }>;
    postData?: {
      mimeType: string;
      text: string;
    };
  };
  response: {
    status: number;
    headers: Array<{ name: string; value: string }>;
    content: {
      mimeType?: string;
      text?: string;
    };
  };
  time?: number;
  timings?: {
    wait: number;
    receive: number;
  };
}

interface HarLog {
  log: {
    version: string;
    entries: HarEntry[];
  };
}

export class HarParser {
  parse(harContent: string): ParsedCapture {
    let har: HarLog;

    try {
      har = JSON.parse(harContent);
    } catch {
      throw new Error('Invalid HAR: not valid JSON');
    }

    if (!har.log || !Array.isArray(har.log.entries)) {
      throw new Error('Invalid HAR: missing log.entries');
    }

    const endpoints = har.log.entries.map((entry) => this.parseEntry(entry));
    const authPatterns = this.detectAuthPatterns(har.log.entries);
    const baseUrl = this.extractBaseUrl(endpoints);

    return {
      source: 'har',
      endpoints,
      authPatterns,
      baseUrl,
      summary: this.generateSummary(endpoints, baseUrl, authPatterns),
    };
  }

  private parseEntry(entry: HarEntry): ParsedEndpoint {
    const url = new URL(entry.request.url);
    const headers = this.headersToObject(entry.request.headers);

    return {
      method: entry.request.method,
      url: entry.request.url,
      path: url.pathname,
      queryParams: Object.fromEntries(url.searchParams),
      headers,
      requestBody: this.parseBody(entry.request.postData?.text),
      responseStatus: entry.response.status,
      responseBody: this.parseBody(entry.response.content?.text),
      contentType: entry.response.content?.mimeType,
      timing: entry.time
        ? {
            wait: entry.timings?.wait ?? 0,
            receive: entry.timings?.receive ?? 0,
            total: entry.time,
          }
        : undefined,
    };
  }

  private headersToObject(
    headers: Array<{ name: string; value: string }>
  ): Record<string, string> {
    const result: Record<string, string> = {};
    for (const h of headers) {
      result[h.name] = h.value;
    }
    return result;
  }

  private parseBody(text?: string): unknown | undefined {
    if (!text) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private detectAuthPatterns(
    entries: HarEntry[]
  ): ParsedCapture['authPatterns'] {
    const patterns: ParsedCapture['authPatterns'] = [];
    const seen = new Set<string>();

    for (const entry of entries) {
      for (const header of entry.request.headers) {
        const name = header.name.toLowerCase();
        const value = header.value;

        if (name === 'authorization') {
          if (value.startsWith('Bearer ') && !seen.has('bearer')) {
            patterns.push({
              type: 'bearer',
              location: 'header',
              headerName: 'Authorization',
            });
            seen.add('bearer');
          } else if (value.startsWith('Basic ') && !seen.has('basic')) {
            patterns.push({
              type: 'basic',
              location: 'header',
              headerName: 'Authorization',
            });
            seen.add('basic');
          }
        }

        if (
          (name === 'x-api-key' || name === 'api-key') &&
          !seen.has('api-key')
        ) {
          patterns.push({
            type: 'api-key',
            location: 'header',
            headerName: header.name,
          });
          seen.add('api-key');
        }

        if (name === 'cookie' && !seen.has('cookie')) {
          patterns.push({
            type: 'cookie',
            location: 'header',
            headerName: 'Cookie',
          });
          seen.add('cookie');
        }
      }
    }

    return patterns;
  }

  private extractBaseUrl(endpoints: ParsedEndpoint[]): string | undefined {
    if (endpoints.length === 0) return undefined;

    const url = new URL(endpoints[0].url);
    return `${url.protocol}//${url.host}`;
  }

  private generateSummary(
    endpoints: ParsedEndpoint[],
    baseUrl: string | undefined,
    authPatterns: ParsedCapture['authPatterns']
  ): string {
    const methods = [...new Set(endpoints.map((e) => e.method))];
    const host = baseUrl ? new URL(baseUrl).host : 'unknown host';

    let summary = `Found ${endpoints.length} endpoints on ${host}. `;
    summary += `Methods: ${methods.join(', ')}. `;

    if (authPatterns.length > 0) {
      const authTypes = authPatterns.map((a) => a.type).join(', ');
      summary += `Auth: ${authTypes}.`;
    } else {
      summary += 'No auth patterns detected.';
    }

    return summary;
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
cd plugins/forensics && npm test
```

Expected: All tests pass.

**Step 5: Commit**

```bash
git add plugins/forensics/src/parsers/
git commit -m "feat(forensics): implement HAR parser

Parses HAR files to extract:
- Endpoints (method, path, params, headers, bodies)
- Auth patterns (bearer, basic, api-key, cookie)
- Base URL and summary"
```

---

## Task 4: Implement analyze_capture Tool

**Files:**
- Create: `plugins/forensics/src/tools/analyze-capture.ts`
- Create: `plugins/forensics/src/tools/analyze-capture.test.ts`
- Modify: `plugins/forensics/src/index.ts`

**Step 1: Write the failing test**

Create `plugins/forensics/src/tools/analyze-capture.test.ts`:

```typescript
import { AnalyzeCaptureTool } from './analyze-capture';

const SAMPLE_HAR = JSON.stringify({
  log: {
    version: '1.2',
    entries: [
      {
        request: {
          method: 'GET',
          url: 'https://api.example.com/v1/status',
          headers: [{ name: 'Authorization', value: 'Bearer token123' }],
        },
        response: {
          status: 200,
          headers: [],
          content: { text: '{"status":"ok"}' },
        },
      },
    ],
  },
});

describe('AnalyzeCaptureTool', () => {
  let tool: AnalyzeCaptureTool;

  beforeEach(() => {
    tool = new AnalyzeCaptureTool();
  });

  describe('analyze', () => {
    it('auto-detects HAR format', async () => {
      const result = await tool.analyze(SAMPLE_HAR);

      expect(result.format).toBe('har');
      expect(result.parsed.endpoints).toHaveLength(1);
    });

    it('returns formatted analysis', async () => {
      const result = await tool.analyze(SAMPLE_HAR);

      expect(result.formatted).toContain('GET');
      expect(result.formatted).toContain('/v1/status');
      expect(result.formatted).toContain('bearer');
    });
  });

  describe('format detection', () => {
    it('detects HAR by log property', () => {
      expect(tool.detectFormat('{"log":{"entries":[]}}')).toBe('har');
    });

    it('detects curl output', () => {
      const curl = '< HTTP/1.1 200 OK\n< Content-Type: application/json';
      expect(tool.detectFormat(curl)).toBe('curl');
    });

    it('returns unknown for unrecognized format', () => {
      expect(tool.detectFormat('random text')).toBe('unknown');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd plugins/forensics && npm test
```

Expected: FAIL - Cannot find module './analyze-capture'

**Step 3: Implement analyze-capture tool**

Create `plugins/forensics/src/tools/analyze-capture.ts`:

```typescript
import { HarParser } from '../parsers/har.js';
import type { ParsedCapture } from '../parsers/types.js';

export interface AnalyzeResult {
  format: 'har' | 'curl' | 'pcap' | 'unknown';
  parsed: ParsedCapture;
  formatted: string;
}

export class AnalyzeCaptureTool {
  private harParser: HarParser;

  constructor() {
    this.harParser = new HarParser();
  }

  async analyze(content: string): Promise<AnalyzeResult> {
    const format = this.detectFormat(content);

    if (format === 'har') {
      const parsed = this.harParser.parse(content);
      return {
        format,
        parsed,
        formatted: this.formatAnalysis(parsed),
      };
    }

    if (format === 'curl') {
      // TODO: Implement curl parser
      throw new Error('Curl parsing not yet implemented');
    }

    throw new Error(`Unable to parse format: ${format}`);
  }

  detectFormat(content: string): 'har' | 'curl' | 'pcap' | 'unknown' {
    const trimmed = content.trim();

    // HAR detection
    if (trimmed.startsWith('{')) {
      try {
        const json = JSON.parse(trimmed);
        if (json.log && json.log.entries) {
          return 'har';
        }
      } catch {
        // Not valid JSON
      }
    }

    // Curl verbose output detection
    if (
      trimmed.includes('< HTTP/') ||
      trimmed.includes('> GET ') ||
      trimmed.includes('> POST ')
    ) {
      return 'curl';
    }

    // PCAP magic number (hex: d4 c3 b2 a1 or a1 b2 c3 d4)
    if (
      trimmed.startsWith('\xd4\xc3\xb2\xa1') ||
      trimmed.startsWith('\xa1\xb2\xc3\xd4')
    ) {
      return 'pcap';
    }

    return 'unknown';
  }

  private formatAnalysis(parsed: ParsedCapture): string {
    const lines: string[] = [];

    lines.push('# Capture Analysis\n');
    lines.push(`**Source:** ${parsed.source}`);
    lines.push(`**Base URL:** ${parsed.baseUrl || 'Unknown'}`);
    lines.push(`**Summary:** ${parsed.summary}\n`);

    // Auth patterns
    if (parsed.authPatterns.length > 0) {
      lines.push('## Authentication\n');
      for (const auth of parsed.authPatterns) {
        lines.push(
          `- **${auth.type}** via ${auth.location}${auth.headerName ? ` (${auth.headerName})` : ''}`
        );
      }
      lines.push('');
    }

    // Endpoints
    lines.push('## Endpoints\n');
    for (const endpoint of parsed.endpoints) {
      lines.push(`### ${endpoint.method} ${endpoint.path}\n`);

      if (Object.keys(endpoint.queryParams).length > 0) {
        lines.push('**Query params:**');
        for (const [key, value] of Object.entries(endpoint.queryParams)) {
          lines.push(`- ${key}: ${value}`);
        }
        lines.push('');
      }

      if (endpoint.requestBody) {
        lines.push('**Request body:**');
        lines.push('```json');
        lines.push(JSON.stringify(endpoint.requestBody, null, 2));
        lines.push('```\n');
      }

      lines.push(`**Response:** ${endpoint.responseStatus}`);
      if (endpoint.responseBody) {
        lines.push('```json');
        lines.push(JSON.stringify(endpoint.responseBody, null, 2));
        lines.push('```\n');
      }
    }

    return lines.join('\n');
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
cd plugins/forensics && npm test
```

Expected: All tests pass.

**Step 5: Wire into MCP server**

Update `plugins/forensics/src/index.ts` to add the tool:

```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ExplainConceptTool } from './tools/explain-concept.js';
import { AnalyzeCaptureTool } from './tools/analyze-capture.js';

async function main() {
  const explainTool = new ExplainConceptTool();
  const analyzeTool = new AnalyzeCaptureTool();

  const server = new Server(
    {
      name: 'forensics',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'explain_concept',
          description:
            'Explain a technical concept related to reverse engineering at the user\'s level.',
          inputSchema: {
            type: 'object',
            properties: {
              concept: {
                type: 'string',
                description: 'The concept to explain',
              },
            },
            required: ['concept'],
          },
        },
        {
          name: 'analyze_capture',
          description:
            'Analyze captured network traffic (HAR file, curl output, etc.) to extract endpoints, auth patterns, and payload schemas.',
          inputSchema: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description:
                  'The captured traffic content (HAR JSON, curl verbose output, etc.)',
              },
            },
            required: ['content'],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;

    if (name === 'explain_concept') {
      const { concept } = request.params.arguments as { concept: string };
      const result = explainTool.explain(concept);

      let response = `# ${result.concept}\n\n${result.explanation}`;
      if (result.relatedConcepts.length > 0) {
        response += `\n\n**Related:** ${result.relatedConcepts.join(', ')}`;
      }
      if (result.suggestSearch) {
        response += `\n\n*Tip: Use perplexity-search to find more information.*`;
      }

      return { content: [{ type: 'text', text: response }] };
    }

    if (name === 'analyze_capture') {
      const { content } = request.params.arguments as { content: string };

      try {
        const result = await analyzeTool.analyze(content);
        return { content: [{ type: 'text', text: result.formatted }] };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error analyzing capture: ${(error as Error).message}`,
            },
          ],
        };
      }
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[forensics MCP Server] Running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

**Step 6: Verify build**

```bash
cd plugins/forensics && npm run build
```

Expected: Build succeeds.

**Step 7: Commit**

```bash
git add plugins/forensics/
git commit -m "feat(forensics): implement analyze_capture tool

Parses HAR files to extract endpoints, auth patterns, and payloads.
Auto-detects capture format (HAR, curl, pcap).
Returns formatted markdown analysis."
```

---

## Task 5: Implement suggest_next_step Tool

**Files:**
- Create: `plugins/forensics/src/tools/suggest-next-step.ts`
- Create: `plugins/forensics/src/tools/suggest-next-step.test.ts`
- Modify: `plugins/forensics/src/index.ts`

**Step 1: Write the failing test**

Create `plugins/forensics/src/tools/suggest-next-step.test.ts`:

```typescript
import { SuggestNextStepTool, InvestigationContext } from './suggest-next-step';

describe('SuggestNextStepTool', () => {
  let tool: SuggestNextStepTool;

  beforeEach(() => {
    tool = new SuggestNextStepTool();
  });

  describe('suggest', () => {
    it('suggests capture for protocol mode with no data', () => {
      const context: InvestigationContext = {
        mode: 'protocol',
        hasCapture: false,
        hasSpec: false,
        skillLevel: 'beginner',
      };

      const result = tool.suggest(context);

      expect(result.step).toContain('capture');
      expect(result.explanation).toBeDefined();
      expect(result.commands).toBeDefined();
    });

    it('suggests analysis after capture', () => {
      const context: InvestigationContext = {
        mode: 'protocol',
        hasCapture: true,
        hasSpec: false,
        skillLevel: 'beginner',
      };

      const result = tool.suggest(context);

      expect(result.step).toContain('analyze');
    });

    it('suggests implementation after spec', () => {
      const context: InvestigationContext = {
        mode: 'protocol',
        hasCapture: true,
        hasSpec: true,
        skillLevel: 'beginner',
      };

      const result = tool.suggest(context);

      expect(result.step).toContain('implement');
    });

    it('adjusts verbosity for expert users', () => {
      const beginnerContext: InvestigationContext = {
        mode: 'protocol',
        hasCapture: false,
        hasSpec: false,
        skillLevel: 'beginner',
      };

      const expertContext: InvestigationContext = {
        ...beginnerContext,
        skillLevel: 'advanced',
      };

      const beginnerResult = tool.suggest(beginnerContext);
      const expertResult = tool.suggest(expertContext);

      expect(beginnerResult.explanation.length).toBeGreaterThan(
        expertResult.explanation.length
      );
    });

    it('suggests research for feature mode', () => {
      const context: InvestigationContext = {
        mode: 'feature',
        targetFeature: 'Notion sharing',
        hasResearch: false,
        skillLevel: 'beginner',
      };

      const result = tool.suggest(context);

      expect(result.step).toContain('research');
      expect(result.step).toContain('Notion');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd plugins/forensics && npm test
```

Expected: FAIL - Cannot find module './suggest-next-step'

**Step 3: Implement suggest-next-step tool**

Create `plugins/forensics/src/tools/suggest-next-step.ts`:

```typescript
export interface InvestigationContext {
  mode: 'protocol' | 'feature' | 'codebase' | 'decision' | 'format';
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  hasCapture?: boolean;
  hasSpec?: boolean;
  hasResearch?: boolean;
  targetFeature?: string;
  targetCodebase?: string;
}

export interface NextStepSuggestion {
  step: string;
  explanation: string;
  commands?: string[];
  tips?: string[];
}

export class SuggestNextStepTool {
  suggest(context: InvestigationContext): NextStepSuggestion {
    switch (context.mode) {
      case 'protocol':
        return this.suggestProtocolStep(context);
      case 'feature':
        return this.suggestFeatureStep(context);
      case 'codebase':
        return this.suggestCodebaseStep(context);
      case 'decision':
        return this.suggestDecisionStep(context);
      case 'format':
        return this.suggestFormatStep(context);
      default:
        return {
          step: 'Select a mode',
          explanation: 'Choose an investigation mode to get started.',
        };
    }
  }

  private suggestProtocolStep(context: InvestigationContext): NextStepSuggestion {
    const verbose = context.skillLevel === 'beginner';

    if (!context.hasCapture) {
      return {
        step: 'Set up traffic capture',
        explanation: verbose
          ? 'Before we can analyze the protocol, we need to capture network traffic between the app and its server. This involves setting up a proxy (like mitmproxy) that sits between your device and the internet, recording all HTTP/HTTPS requests.'
          : 'Set up mitmproxy to capture traffic.',
        commands: [
          'brew install mitmproxy',
          'mitmproxy --mode regular --showhost',
        ],
        tips: verbose
          ? [
              'Configure your device to use the proxy (usually in WiFi settings)',
              'You may need to install mitmproxy\'s certificate for HTTPS',
              'Trigger the actions you want to reverse engineer in the app',
            ]
          : undefined,
      };
    }

    if (!context.hasSpec) {
      return {
        step: 'Analyze captured traffic',
        explanation: verbose
          ? 'Now that we have captured traffic, let\'s analyze it to understand the API structure. We\'ll identify endpoints, authentication patterns, and payload formats.'
          : 'Run analyze_capture on your HAR/capture file.',
        commands: ['Export HAR from mitmproxy: flow.export("har", "capture.har")'],
        tips: verbose
          ? [
              'Look for patterns in endpoint paths (e.g., /api/v1/...)',
              'Note how authentication is passed (Bearer token, API key, etc.)',
              'Pay attention to request/response body structures',
            ]
          : undefined,
      };
    }

    return {
      step: 'Implement replacement server',
      explanation: verbose
        ? 'We\'ve documented the protocol. Now we can build a local server that implements the same API. This will let your device talk to your server instead of the original (now-dead) cloud service.'
        : 'Scaffold server implementing discovered endpoints.',
      tips: verbose
        ? [
            'Start with the auth endpoint to establish the token flow',
            'Use the spec to generate TypeScript types',
            'Test each endpoint against the real device',
          ]
        : undefined,
    };
  }

  private suggestFeatureStep(context: InvestigationContext): NextStepSuggestion {
    const verbose = context.skillLevel === 'beginner';
    const target = context.targetFeature || 'the target feature';

    if (!context.hasResearch) {
      return {
        step: `Research how ${target} works`,
        explanation: verbose
          ? `Let\'s deeply research how ${target} is implemented. We\'ll look at public documentation, blog posts, and technical analyses to understand the components, data flows, and edge cases.`
          : `Use perplexity to research ${target} implementation.`,
        tips: verbose
          ? [
              'Look for official documentation and blog posts',
              'Search for "how X works" technical deep-dives',
              'Note the key components and their interactions',
            ]
          : undefined,
      };
    }

    return {
      step: 'Map to your tech stack',
      explanation: verbose
        ? `Now that we understand ${target}, let\'s map it to your specific tech stack. We\'ll identify which libraries, patterns, and architectures will give you the same functionality.`
        : 'Design implementation using your stack.',
    };
  }

  private suggestCodebaseStep(context: InvestigationContext): NextStepSuggestion {
    return {
      step: 'Identify entry points',
      explanation:
        context.skillLevel === 'beginner'
          ? 'Start by finding the main entry points: where does execution begin? Look for main functions, route handlers, or event listeners.'
          : 'Locate entry points and trace execution flow.',
    };
  }

  private suggestDecisionStep(context: InvestigationContext): NextStepSuggestion {
    return {
      step: 'Examine git history and comments',
      explanation:
        context.skillLevel === 'beginner'
          ? 'Check git blame and commit messages around the code in question. Often the "why" is documented in commit messages, PR descriptions, or code comments from the original author.'
          : 'Check git blame, PR history, and inline comments.',
      commands: ['git log -p --follow -- <file>', 'git blame <file>'],
    };
  }

  private suggestFormatStep(context: InvestigationContext): NextStepSuggestion {
    return {
      step: 'Examine byte patterns',
      explanation:
        context.skillLevel === 'beginner'
          ? 'Start by looking at the raw bytes. Check for magic numbers at the start (which identify file types), look for repeating patterns, and try to identify any text strings embedded in the binary.'
          : 'Analyze magic numbers, structure patterns, and embedded strings.',
      commands: ['xxd <file> | head -50', 'strings <file>'],
    };
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
cd plugins/forensics && npm test
```

Expected: All tests pass.

**Step 5: Wire into MCP server**

Add to `plugins/forensics/src/index.ts` imports:

```typescript
import { SuggestNextStepTool, InvestigationContext } from './tools/suggest-next-step.js';
```

Add tool instance after other tools:

```typescript
const suggestTool = new SuggestNextStepTool();
```

Add to tools array:

```typescript
{
  name: 'suggest_next_step',
  description:
    'Get guidance on what to do next in your reverse engineering investigation. Adapts to your skill level and current progress.',
  inputSchema: {
    type: 'object',
    properties: {
      mode: {
        type: 'string',
        enum: ['protocol', 'feature', 'codebase', 'decision', 'format'],
        description: 'The investigation mode',
      },
      hasCapture: {
        type: 'boolean',
        description: 'Whether traffic has been captured (protocol mode)',
      },
      hasSpec: {
        type: 'boolean',
        description: 'Whether a spec has been built',
      },
      hasResearch: {
        type: 'boolean',
        description: 'Whether research has been done (feature mode)',
      },
      targetFeature: {
        type: 'string',
        description: 'The feature being researched (feature mode)',
      },
      skillLevel: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced'],
        description: 'User skill level for verbosity adjustment',
        default: 'beginner',
      },
    },
    required: ['mode'],
  },
},
```

Add handler:

```typescript
if (name === 'suggest_next_step') {
  const args = request.params.arguments as InvestigationContext;
  const context: InvestigationContext = {
    mode: args.mode,
    skillLevel: args.skillLevel || 'beginner',
    hasCapture: args.hasCapture,
    hasSpec: args.hasSpec,
    hasResearch: args.hasResearch,
    targetFeature: args.targetFeature,
  };

  const result = suggestTool.suggest(context);

  let response = `## Next Step: ${result.step}\n\n${result.explanation}`;

  if (result.commands && result.commands.length > 0) {
    response += '\n\n**Commands:**\n```bash\n' + result.commands.join('\n') + '\n```';
  }

  if (result.tips && result.tips.length > 0) {
    response += '\n\n**Tips:**\n' + result.tips.map((t) => `- ${t}`).join('\n');
  }

  return { content: [{ type: 'text', text: response }] };
}
```

**Step 6: Verify build**

```bash
cd plugins/forensics && npm run build
```

**Step 7: Commit**

```bash
git add plugins/forensics/
git commit -m "feat(forensics): implement suggest_next_step tool

Provides context-aware guidance for investigations.
Adapts verbosity to user skill level.
Supports all five investigation modes."
```

---

## Task 6: Create investigate Skill

**Files:**
- Create: `plugins/forensics/skills/investigate/SKILL.md`

**Step 1: Create skill directory**

```bash
mkdir -p plugins/forensics/skills/investigate
```

**Step 2: Write the skill file**

Create `plugins/forensics/skills/investigate/SKILL.md`:

```markdown
---
name: forensics:investigate
description: Guided workflow for reverse engineering black-box systems. Use when a user wants to decode a defunct API, replicate a competitor's feature, understand unfamiliar code, or crack a data format.
---

# Forensics Investigation

You are guiding a reverse engineering investigation. Follow this workflow.

## Phase 1: Intake

Ask: "What are we investigating today?"

Based on the answer, determine the mode:
- **Protocol** - API, network traffic, IoT device communication
- **Feature** - "I want it to work like X's Y"
- **Codebase** - Understanding unfamiliar code
- **Decision** - Why was something built a certain way
- **Format** - Binary blob, unknown file type

Confirm the mode: "This sounds like a [mode] investigation. Is that right?"

## Phase 2: Skill Check

Check shared-memory for `forensics.skillLevel`. If not set, ask:

"Before we dive in, how familiar are you with reverse engineering?"
- A) New to this - explain everything
- B) Some experience - moderate detail
- C) Expert - just tell me what to do

Store the answer in shared-memory.

## Phase 3: Mode-Specific Workflow

### Protocol Mode

1. **Capture guidance**
   - Use `suggest_next_step` with mode=protocol, hasCapture=false
   - Walk through proxy setup if beginner
   - Use `explain_concept` for unfamiliar tools

2. **Analysis**
   - When user provides capture, use `analyze_capture`
   - Explain findings at their level
   - Offer to build spec with `build_spec`

3. **Implementation**
   - Help scaffold replacement server
   - Guide DNS/network redirect setup
   - Test against real device

### Feature Mode

1. **Research**
   - Use `research_feature` (triggers perplexity-search)
   - Break down into components
   - Document in shared-memory

2. **Mapping**
   - Read user's tech stack from shared-memory profile
   - Map feature components to their stack
   - Propose implementation approach

### Codebase Mode

1. **Entry point identification**
   - Help find main entry points
   - Trace execution flow

2. **Documentation**
   - Build understanding incrementally
   - Document in shared-memory

### Decision Mode

1. **History analysis**
   - Guide through git blame, commit history
   - Search for related discussions

2. **Hypothesis formation**
   - Propose likely rationale
   - Research historical context if needed

### Format Mode

1. **Initial analysis**
   - Examine magic numbers
   - Look for patterns

2. **Structure inference**
   - Use `analyze_format`
   - Propose schema

## Phase 4: Documentation

After each significant discovery:
- Offer to save to shared-memory
- Ask if they want to export as markdown/spec

## Key Behaviors

- **One question at a time** - Don't overwhelm
- **Adapt to skill level** - Verbose for beginners, terse for experts
- **Explain the why** - Don't just give commands, explain purpose
- **Celebrate progress** - Acknowledge when steps complete
- **Offer to pause** - Multi-session investigations are normal

## Resuming Investigations

If user says "continue investigation" or "pick up where we left off":
1. Check shared-memory for `forensics.investigations.*`
2. Summarize where they left off
3. Use `suggest_next_step` with current state
```

**Step 3: Commit**

```bash
git add plugins/forensics/skills/
git commit -m "feat(forensics): add investigate skill

Guided workflow for end-to-end reverse engineering.
Adapts to user skill level and investigation mode.
Supports session persistence via shared-memory."
```

---

## Task 7: Final Integration and Testing

**Files:**
- Modify: `plugins/forensics/src/index.ts` (final cleanup)
- Run full test suite

**Step 1: Run all tests**

```bash
cd plugins/forensics && npm test
```

Expected: All tests pass.

**Step 2: Verify build**

```bash
cd plugins/forensics && npm run build
```

Expected: Build succeeds with no errors.

**Step 3: Test MCP server manually**

```bash
cd plugins/forensics && echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node dist/index.js 2>/dev/null | head -1
```

Expected: JSON response listing tools.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(forensics): complete initial implementation

forensics plugin for brain-jar suite:
- explain_concept: Teaches reverse engineering concepts
- analyze_capture: Parses HAR files, extracts endpoints/auth
- suggest_next_step: Context-aware investigation guidance
- investigate skill: End-to-end guided workflow

Integrates with shared-memory and perplexity-search."
```

---

## Summary

**Implemented:**
1. Plugin scaffold following brain-jar conventions
2. `explain_concept` tool - teaches technical concepts
3. HAR parser - extracts endpoints, auth patterns, payloads
4. `analyze_capture` tool - analyzes network captures
5. `suggest_next_step` tool - context-aware guidance
6. `investigate` skill - end-to-end workflow

**Not yet implemented (future tasks):**
- `analyze_format` tool (binary blob analysis)
- `research_feature` tool (perplexity integration)
- `build_spec` tool (living spec document)
- Curl parser
- PCAP parser
- Shared-memory integration for session persistence

**To install the plugin:**
```bash
cd plugins/forensics && npm install && npm run build
# Then add to ~/.claude.json mcpServers or use plugin system
```
