import { HarParser } from '../parsers/har';
import type { ParsedCapture } from '../parsers/types';
import { getForensicsMemory, type Investigation, type Endpoint, type AuthPattern } from '../interop/index.js';

export interface AnalyzeResult {
  format: 'har' | 'curl' | 'pcap' | 'unknown';
  parsed: ParsedCapture;
  formatted: string;
  storedToInvestigation?: string; // Investigation ID if findings were stored
}

export class AnalyzeCaptureTool {
  private harParser: HarParser;
  private memory = getForensicsMemory();

  constructor() {
    this.harParser = new HarParser();
  }

  async analyze(content: string): Promise<AnalyzeResult> {
    const format = this.detectFormat(content);

    if (format === 'har') {
      const parsed = this.harParser.parse(content);
      const result: AnalyzeResult = {
        format,
        parsed,
        formatted: this.formatAnalysis(parsed),
      };

      // Try to store findings to active investigation
      const investigation = await this.storeFindings(parsed);
      if (investigation) {
        result.storedToInvestigation = investigation.id;
        result.formatted += `\n\n*Findings stored to investigation: ${investigation.name}*`;
      }

      return result;
    }

    if (format === 'curl') {
      throw new Error('Curl parsing not yet implemented');
    }

    throw new Error(`Unable to parse format: ${format}`);
  }

  /**
   * Store findings to active investigation if one exists.
   */
  private async storeFindings(parsed: ParsedCapture): Promise<Investigation | null> {
    if (!this.memory.isConfigured()) return null;

    try {
      const investigation = await this.memory.findResumableInvestigation();
      if (!investigation || investigation.mode !== 'protocol') return null;

      // Convert parsed endpoints to investigation endpoints
      const endpoints: Endpoint[] = parsed.endpoints.map((ep) => ({
        method: ep.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
        path: ep.path,
        queryParams: Object.keys(ep.queryParams).length > 0 ? ep.queryParams : undefined,
        requestSchema: ep.requestBody,
        responseSchema: ep.responseBody,
        statusCodes: [ep.responseStatus],
      }));

      // Convert auth patterns
      const auth: AuthPattern | undefined = parsed.authPatterns.length > 0
        ? {
            type: parsed.authPatterns[0].type as AuthPattern['type'],
            location: parsed.authPatterns[0].location,
            headerName: parsed.authPatterns[0].headerName,
          }
        : undefined;

      // Merge findings with existing
      investigation.findings = investigation.findings || {};
      investigation.findings.endpoints = [
        ...(investigation.findings.endpoints || []),
        ...endpoints,
      ];

      if (auth && !investigation.findings.auth) {
        investigation.findings.auth = auth;
      }

      // Mark capture complete in session state
      investigation.sessionState = investigation.sessionState || {};
      investigation.sessionState.hasCapture = true;
      investigation.updated = new Date().toISOString();

      await this.memory.saveInvestigation(investigation);
      return investigation;
    } catch (error) {
      console.error('[forensics] Failed to store findings:', error);
      return null;
    }
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
