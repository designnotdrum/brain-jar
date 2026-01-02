#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ExplainConceptTool } from './tools/explain-concept.js';
import { AnalyzeCaptureTool } from './tools/analyze-capture.js';

// Initialize tools
const explainConceptTool = new ExplainConceptTool();
const analyzeCaptureTool = new AnalyzeCaptureTool();

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

  // Register tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'explain_concept',
          description:
            "Explain a technical concept at the user's level. Covers concepts like HAR files, mitmproxy, protobuf, WebSockets, JWT, and more.",
          inputSchema: {
            type: 'object',
            properties: {
              concept: {
                type: 'string',
                description:
                  'The concept to explain (e.g., "mitmproxy", "HAR file", "protobuf")',
              },
            },
            required: ['concept'],
          },
        },
        {
          name: 'analyze_capture',
          description:
            'Analyze a network capture (HAR file, curl output, etc.) to extract endpoints, authentication patterns, and API structure.',
          inputSchema: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description:
                  'The raw content of the capture file (HAR JSON, curl verbose output, etc.)',
              },
            },
            required: ['content'],
          },
        },
      ],
    };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;

    if (name === 'explain_concept') {
      const { concept } = request.params.arguments as { concept: string };
      const result = await explainConceptTool.explain(concept);

      let response = `## ${result.concept}\n\n${result.explanation}`;

      if (result.relatedConcepts.length > 0) {
        response += `\n\n**Related concepts:** ${result.relatedConcepts.join(', ')}`;
      }

      if (result.suggestSearch) {
        response += `\n\n*Tip: Use perplexity search for more information about this concept.*`;
      }

      return {
        content: [
          {
            type: 'text',
            text: response,
          },
        ],
      };
    }

    if (name === 'analyze_capture') {
      const { content } = request.params.arguments as { content: string };
      const result = await analyzeCaptureTool.analyze(content);

      return {
        content: [
          {
            type: 'text',
            text: result.formatted,
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
