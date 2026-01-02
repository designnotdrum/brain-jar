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
