import { HarParser } from '../parsers/har';
import type { ParsedCapture } from '../parsers/types';

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
    if (trimmed.includes('< HTTP/') || trimmed.includes('> GET ') || trimmed.includes('> POST ')) {
      return 'curl';
    }

    // PCAP magic number
    if (trimmed.startsWith('\xd4\xc3\xb2\xa1') || trimmed.startsWith('\xa1\xb2\xc3\xd4')) {
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
        lines.push(`- **${auth.type}** via ${auth.location}${auth.headerName ? ` (${auth.headerName})` : ''}`);
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
