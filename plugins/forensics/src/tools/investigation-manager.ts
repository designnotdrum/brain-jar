/**
 * Investigation Manager - Create, resume, and manage investigations.
 */

import { randomUUID } from 'crypto';
import {
  getForensicsMemory,
  type Investigation,
  type InvestigationMode,
  type InvestigationStatus,
} from '../interop/index.js';

export interface StartInvestigationOptions {
  name: string;
  mode: InvestigationMode;
  target?: string;
}

export interface InvestigationInfo {
  id: string;
  name: string;
  mode: InvestigationMode;
  status: InvestigationStatus;
  created: string;
  updated: string;
  target?: string;
  endpointCount: number;
  hasAuth: boolean;
  hasSpec: boolean;
}

export class InvestigationManager {
  private memory = getForensicsMemory();

  /**
   * Start a new investigation.
   */
  async start(options: StartInvestigationOptions): Promise<Investigation> {
    const now = new Date().toISOString();

    const investigation: Investigation = {
      id: randomUUID(),
      name: options.name,
      mode: options.mode,
      status: 'active',
      created: now,
      updated: now,
      target: options.target,
      findings: {},
      sessionState: {},
    };

    if (this.memory.isConfigured()) {
      await this.memory.saveInvestigation(investigation);
    }

    return investigation;
  }

  /**
   * Resume an existing investigation.
   */
  async resume(id: string): Promise<Investigation | null> {
    const investigation = await this.memory.getInvestigation(id);
    if (!investigation) return null;

    investigation.status = 'active';
    investigation.updated = new Date().toISOString();

    if (this.memory.isConfigured()) {
      await this.memory.saveInvestigation(investigation);
    }

    return investigation;
  }

  /**
   * Pause the current investigation.
   */
  async pause(id: string): Promise<Investigation | null> {
    const investigation = await this.memory.getInvestigation(id);
    if (!investigation) return null;

    investigation.status = 'paused';
    investigation.updated = new Date().toISOString();

    if (this.memory.isConfigured()) {
      await this.memory.saveInvestigation(investigation);
    }

    return investigation;
  }

  /**
   * Complete an investigation.
   */
  async complete(id: string): Promise<Investigation | null> {
    const investigation = await this.memory.getInvestigation(id);
    if (!investigation) return null;

    investigation.status = 'complete';
    investigation.updated = new Date().toISOString();

    if (this.memory.isConfigured()) {
      await this.memory.saveInvestigation(investigation);
    }

    return investigation;
  }

  /**
   * Get the current active or most recent paused investigation.
   */
  async getCurrent(): Promise<Investigation | null> {
    return this.memory.findResumableInvestigation();
  }

  /**
   * List all investigations.
   */
  async list(status?: InvestigationStatus): Promise<InvestigationInfo[]> {
    const investigations = await this.memory.listInvestigations(status);

    return investigations.map((inv) => ({
      id: inv.id,
      name: inv.name,
      mode: inv.mode,
      status: inv.status,
      created: inv.created,
      updated: inv.updated,
      target: inv.target,
      endpointCount: inv.findings?.endpoints?.length || 0,
      hasAuth: !!inv.findings?.auth,
      hasSpec: !!inv.sessionState?.hasSpec,
    }));
  }

  /**
   * Format investigation info for display.
   */
  formatInfo(inv: Investigation): string {
    const lines: string[] = [];

    lines.push(`## Investigation: ${inv.name}`);
    lines.push('');
    lines.push(`**Mode:** ${inv.mode}`);
    lines.push(`**Status:** ${inv.status}`);
    lines.push(`**Created:** ${inv.created}`);
    lines.push(`**Last Updated:** ${inv.updated}`);

    if (inv.target) {
      lines.push(`**Target:** ${inv.target}`);
    }

    lines.push('');
    lines.push('### Progress');

    const endpointCount = inv.findings?.endpoints?.length || 0;
    const hasAuth = !!inv.findings?.auth;
    const hasCapture = !!inv.sessionState?.hasCapture;
    const hasSpec = !!inv.sessionState?.hasSpec;

    if (inv.mode === 'protocol') {
      lines.push(`- Capture: ${hasCapture ? '✓' : '○'}`);
      lines.push(`- Endpoints found: ${endpointCount}`);
      lines.push(`- Auth pattern: ${hasAuth ? '✓' : '○'}`);
      lines.push(`- Spec built: ${hasSpec ? '✓' : '○'}`);
    } else if (inv.mode === 'feature') {
      const hasResearch = !!inv.sessionState?.hasResearch;
      lines.push(`- Research: ${hasResearch ? '✓' : '○'}`);
      lines.push(`- Features documented: ${inv.findings?.features?.length || 0}`);
    } else {
      lines.push(`- Notes: ${inv.findings?.notes?.length || 0}`);
    }

    return lines.join('\n');
  }
}
