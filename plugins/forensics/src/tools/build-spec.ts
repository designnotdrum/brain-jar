/**
 * Build Spec Tool - Generates API specifications from investigation findings.
 */

import {
  getForensicsMemory,
  type Investigation,
  type APISpec,
  type Endpoint,
  type AuthPattern,
} from '../interop/index.js';

export interface BuildSpecOptions {
  investigationId?: string; // If not provided, uses active investigation
  name: string;
  version?: string;
  baseUrl?: string;
  format?: 'json' | 'openapi' | 'typescript';
}

export interface BuildSpecResult {
  spec: APISpec;
  formatted: string;
  outputFormat: 'json' | 'openapi' | 'typescript';
  storedToMemory: boolean;
}

export class BuildSpecTool {
  private memory = getForensicsMemory();

  async build(options: BuildSpecOptions): Promise<BuildSpecResult> {
    // Get investigation
    const investigation = await this.getInvestigation(options.investigationId);
    if (!investigation) {
      throw new Error('No active investigation found. Start an investigation first.');
    }

    if (!investigation.findings?.endpoints?.length) {
      throw new Error('No endpoints found in investigation. Analyze some captures first.');
    }

    // Build the spec
    const now = new Date().toISOString();
    const spec: APISpec = {
      name: options.name,
      version: options.version || '1.0.0',
      description: `API specification generated from ${investigation.name}`,
      baseUrl: options.baseUrl || this.inferBaseUrl(investigation.findings.endpoints),
      auth: investigation.findings.auth,
      endpoints: investigation.findings.endpoints,
      created: now,
      updated: now,
      investigationId: investigation.id,
    };

    // Store to memory
    let storedToMemory = false;
    if (this.memory.isConfigured()) {
      const id = await this.memory.saveSpec(spec);
      storedToMemory = !!id;

      // Mark investigation as having a spec
      investigation.sessionState = investigation.sessionState || {};
      investigation.sessionState.hasSpec = true;
      investigation.updated = now;
      await this.memory.saveInvestigation(investigation);
    }

    // Format output
    const format = options.format || 'json';
    const formatted = this.formatSpec(spec, format);

    return {
      spec,
      formatted,
      outputFormat: format,
      storedToMemory,
    };
  }

  private async getInvestigation(id?: string): Promise<Investigation | null> {
    if (id) {
      return this.memory.getInvestigation(id);
    }
    return this.memory.findResumableInvestigation();
  }

  private inferBaseUrl(endpoints: Endpoint[]): string | undefined {
    // Try to find common base URL from endpoints
    const urls = endpoints
      .filter((ep) => ep.path.startsWith('http'))
      .map((ep) => {
        try {
          const url = new URL(ep.path);
          return `${url.protocol}//${url.host}`;
        } catch {
          return null;
        }
      })
      .filter((url): url is string => !!url);

    if (urls.length > 0) {
      // Return most common
      const counts = urls.reduce((acc, url) => {
        acc[url] = (acc[url] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    }

    return undefined;
  }

  private formatSpec(spec: APISpec, format: 'json' | 'openapi' | 'typescript'): string {
    switch (format) {
      case 'openapi':
        return this.formatAsOpenAPI(spec);
      case 'typescript':
        return this.formatAsTypeScript(spec);
      default:
        return JSON.stringify(spec, null, 2);
    }
  }

  private formatAsOpenAPI(spec: APISpec): string {
    const openapi = {
      openapi: '3.0.0',
      info: {
        title: spec.name,
        version: spec.version,
        description: spec.description,
      },
      servers: spec.baseUrl ? [{ url: spec.baseUrl }] : [],
      paths: this.endpointsToOpenAPIPaths(spec.endpoints),
      components: {
        securitySchemes: spec.auth ? this.authToSecurityScheme(spec.auth) : undefined,
      },
    };

    return JSON.stringify(openapi, null, 2);
  }

  private endpointsToOpenAPIPaths(endpoints: Endpoint[]): Record<string, unknown> {
    const paths: Record<string, Record<string, unknown>> = {};

    for (const ep of endpoints) {
      const path = ep.path.startsWith('/') ? ep.path : `/${ep.path}`;
      const method = ep.method.toLowerCase();

      if (!paths[path]) {
        paths[path] = {};
      }

      paths[path][method] = {
        summary: ep.description || `${ep.method} ${path}`,
        parameters: ep.queryParams
          ? Object.keys(ep.queryParams).map((name) => ({
              name,
              in: 'query',
              schema: { type: 'string' },
            }))
          : undefined,
        requestBody: ep.requestSchema
          ? {
              content: {
                'application/json': {
                  schema: { example: ep.requestSchema },
                },
              },
            }
          : undefined,
        responses: {
          [ep.statusCodes?.[0] || 200]: {
            description: 'Response',
            content: ep.responseSchema
              ? {
                  'application/json': {
                    schema: { example: ep.responseSchema },
                  },
                }
              : undefined,
          },
        },
      };
    }

    return paths;
  }

  private authToSecurityScheme(auth: AuthPattern): Record<string, unknown> {
    switch (auth.type) {
      case 'bearer':
      case 'jwt':
        return {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
          },
        };
      case 'basic':
        return {
          BasicAuth: {
            type: 'http',
            scheme: 'basic',
          },
        };
      case 'api-key':
        return {
          ApiKeyAuth: {
            type: 'apiKey',
            in: auth.location,
            name: auth.headerName || 'X-API-Key',
          },
        };
      default:
        return {};
    }
  }

  private formatAsTypeScript(spec: APISpec): string {
    const lines: string[] = [];

    lines.push(`/**`);
    lines.push(` * ${spec.name} API Client`);
    lines.push(` * Version: ${spec.version}`);
    if (spec.description) {
      lines.push(` * ${spec.description}`);
    }
    lines.push(` */`);
    lines.push('');

    // Base URL
    if (spec.baseUrl) {
      lines.push(`const BASE_URL = '${spec.baseUrl}';`);
      lines.push('');
    }

    // Auth type
    if (spec.auth) {
      lines.push(`// Authentication: ${spec.auth.type} via ${spec.auth.location}`);
      if (spec.auth.headerName) {
        lines.push(`const AUTH_HEADER = '${spec.auth.headerName}';`);
      }
      lines.push('');
    }

    // Endpoint functions
    for (const ep of spec.endpoints) {
      const funcName = this.endpointToFunctionName(ep);
      const params: string[] = [];

      if (ep.queryParams && Object.keys(ep.queryParams).length > 0) {
        params.push(`params: { ${Object.keys(ep.queryParams).map((k) => `${k}?: string`).join('; ')} }`);
      }

      if (ep.requestSchema) {
        params.push(`body: unknown`);
      }

      lines.push(`export async function ${funcName}(${params.join(', ')}): Promise<unknown> {`);
      lines.push(`  const url = \`\${BASE_URL}${ep.path}\`;`);

      if (ep.method === 'GET') {
        lines.push(`  const response = await fetch(url);`);
      } else {
        lines.push(`  const response = await fetch(url, {`);
        lines.push(`    method: '${ep.method}',`);
        if (ep.requestSchema) {
          lines.push(`    headers: { 'Content-Type': 'application/json' },`);
          lines.push(`    body: JSON.stringify(body),`);
        }
        lines.push(`  });`);
      }

      lines.push(`  return response.json();`);
      lines.push(`}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  private endpointToFunctionName(ep: Endpoint): string {
    // Convert "GET /users/{id}" to "getUser"
    const method = ep.method.toLowerCase();
    const pathParts = ep.path
      .split('/')
      .filter((p) => p && !p.startsWith('{') && !p.startsWith(':'))
      .map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)));

    let name = method + pathParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');

    // Singularize if method suggests single item
    if (['get', 'delete', 'patch', 'put'].includes(method) && ep.path.includes('{')) {
      // Remove trailing 's' for singular operations
      if (name.endsWith('s') && !name.endsWith('ss')) {
        name = name.slice(0, -1);
      }
    }

    return name;
  }
}
