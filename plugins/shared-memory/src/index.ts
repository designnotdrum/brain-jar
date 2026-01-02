#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as path from 'path';
import * as os from 'os';

import { LocalStore } from './local-store';
import { Mem0Client } from './mem0-client';
import { checkConfig, loadConfig, saveConfig, getMissingConfigMessage, getConfigPath } from './config';
import { AddMemoryInput, SearchMemoryInput, ListMemoriesInput } from './types';

const LOCAL_DB_PATH = path.join(os.homedir(), '.config', 'brain-jar', 'local.db');

async function runSetup(): Promise<void> {
  const { input } = await import('@inquirer/prompts');

  console.log('\n[brain] Shared Memory Setup\n');
  console.log('To get your Mem0 API key:');
  console.log('1. Go to https://app.mem0.ai');
  console.log('2. Sign up (free tier: 10,000 memories)');
  console.log('3. Navigate to Settings -> API Keys');
  console.log('4. Create and copy your key\n');

  const apiKey = await input({
    message: 'Enter your Mem0 API key:',
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return 'API key is required';
      }
      return true;
    },
  });

  saveConfig({
    mem0_api_key: apiKey.trim(),
    default_scope: 'global',
    auto_summarize: true,
  });

  console.log(`\n[OK] Configuration saved to ${getConfigPath()}`);
  console.log('[OK] Ready to use shared-memory!\n');
}

async function main(): Promise<void> {
  // Handle --setup flag
  if (process.argv.includes('--setup')) {
    await runSetup();
    process.exit(0);
  }

  // Check configuration
  const configStatus = checkConfig();
  if (configStatus.status === 'missing') {
    console.error(getMissingConfigMessage());
    process.exit(1);
  }

  const config = loadConfig()!;
  const localStore = new LocalStore(LOCAL_DB_PATH);
  const mem0Client = new Mem0Client(config.mem0_api_key);

  // Create MCP server
  const server = new McpServer({
    name: 'shared-memory',
    version: '0.1.0',
  });

  // Register tools
  server.tool(
    'add_memory',
    'Store a memory with enriched context',
    {
      content: z.string().describe('The memory content with context and sentiment'),
      scope: z.string().optional().describe('Scope: "global" or "project:<name>"'),
      tags: z.array(z.string()).optional().describe('Tags for categorization'),
    },
    async (args: AddMemoryInput) => {
      const scope = args.scope || config.default_scope;
      const tags = args.tags || [];

      // Store locally first (working memory)
      const memory = localStore.add({
        content: args.content,
        scope,
        tags,
        source: { agent: 'claude-code', action: 'explicit' },
      });

      // Also sync to Mem0 (persistent memory)
      try {
        await mem0Client.add(args.content, {
          scope,
          tags,
          source_agent: 'claude-code',
          source_action: 'explicit',
        });
      } catch (error) {
        // Log but don't fail - local storage succeeded
        console.error('[shared-memory] Mem0 sync failed:', error);
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `Memory stored (id: ${memory.id})`,
          },
        ],
      };
    }
  );

  server.tool(
    'search_memory',
    'Search memories semantically',
    {
      query: z.string().describe('Natural language search query'),
      scope: z.string().optional().describe('Filter by scope'),
      limit: z.number().optional().describe('Maximum results (default: 10)'),
    },
    async (args: SearchMemoryInput) => {
      const limit = args.limit || 10;

      // Try local first
      let results = localStore.search(args.query, args.scope, limit);

      // If few local results, also search Mem0
      if (results.length < limit) {
        try {
          const mem0Results = await mem0Client.search(args.query, limit);
          // Merge, avoiding duplicates by content
          const existingContent = new Set(results.map((r) => r.content));
          for (const r of mem0Results) {
            if (!existingContent.has(r.content)) {
              results.push(r);
            }
          }
        } catch (error) {
          console.error('[shared-memory] Mem0 search failed:', error);
        }
      }

      // Apply scope filter if specified
      if (args.scope) {
        results = results.filter((r) => r.scope === args.scope || r.scope === 'global');
      }

      return {
        content: [
          {
            type: 'text' as const,
            text:
              results.length > 0
                ? results.map((m) => `[${m.scope}] ${m.content}`).join('\n\n---\n\n')
                : 'No memories found.',
          },
        ],
      };
    }
  );

  server.tool(
    'list_memories',
    'List recent memories',
    {
      scope: z.string().optional().describe('Filter by scope'),
      tags: z.array(z.string()).optional().describe('Filter by tags'),
      limit: z.number().optional().describe('Maximum results'),
    },
    async (args: ListMemoriesInput) => {
      const results = localStore.list({
        scope: args.scope,
        tags: args.tags,
        limit: args.limit,
      });

      return {
        content: [
          {
            type: 'text' as const,
            text:
              results.length > 0
                ? results
                    .map(
                      (m) =>
                        `[${m.scope}] (${m.tags.join(', ') || 'no tags'})\n${m.content}`
                    )
                    .join('\n\n---\n\n')
                : 'No memories found.',
          },
        ],
      };
    }
  );

  server.tool(
    'delete_memory',
    'Delete a memory by ID',
    {
      id: z.string().describe('Memory ID to delete'),
    },
    async (args: { id: string }) => {
      const deleted = localStore.delete(args.id);

      // Also try to delete from Mem0
      try {
        await mem0Client.delete(args.id);
      } catch {
        // Ignore - might not exist in Mem0
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: deleted ? `Memory ${args.id} deleted.` : `Memory ${args.id} not found.`,
          },
        ],
      };
    }
  );

  // Connect transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[shared-memory] MCP server running on stdio');
}

main().catch((error) => {
  console.error('[shared-memory] Fatal error:', error);
  process.exit(1);
});
