/**
 * ForensicsMemory - Memory integration for the forensics plugin.
 * Uses @brain-jar/core Mem0Client for storage.
 */

import { Mem0Client, loadConfig, type UserProfile } from '@brain-jar/core';
import {
  Investigation,
  APISpec,
  SkillLevel,
  FORENSICS_TYPES,
} from './types.js';

export class ForensicsMemory {
  private mem0: Mem0Client | null = null;
  private configured: boolean = false;

  constructor() {
    const config = loadConfig();
    if (config?.mem0_api_key) {
      this.mem0 = new Mem0Client(config.mem0_api_key);
      this.configured = true;
    }
  }

  /**
   * Check if memory features are available.
   */
  isConfigured(): boolean {
    return this.configured;
  }

  // --- Investigation CRUD ---

  /**
   * Save or update an investigation.
   */
  async saveInvestigation(investigation: Investigation): Promise<string | null> {
    if (!this.mem0) return null;

    try {
      const content = JSON.stringify(investigation);
      return await this.mem0.add(content, {
        type: FORENSICS_TYPES.investigation,
        investigation_id: investigation.id,
        investigation_name: investigation.name,
        mode: investigation.mode,
        status: investigation.status,
      });
    } catch (error) {
      console.error('[forensics] Failed to save investigation:', error);
      return null;
    }
  }

  /**
   * Get an investigation by ID.
   */
  async getInvestigation(id: string): Promise<Investigation | null> {
    if (!this.mem0) return null;

    try {
      const all = await this.mem0.getAll();
      const found = all.find(
        (m) =>
          (m as any).metadata?.type === FORENSICS_TYPES.investigation &&
          (m as any).metadata?.investigation_id === id
      );

      if (!found) return null;

      return JSON.parse(found.content) as Investigation;
    } catch (error) {
      console.error('[forensics] Failed to get investigation:', error);
      return null;
    }
  }

  /**
   * List all investigations, optionally filtered by status.
   */
  async listInvestigations(status?: Investigation['status']): Promise<Investigation[]> {
    if (!this.mem0) return [];

    try {
      const all = await this.mem0.getAll();
      const investigations = all
        .filter((m) => (m as any).metadata?.type === FORENSICS_TYPES.investigation)
        .map((m) => {
          try {
            return JSON.parse(m.content) as Investigation;
          } catch {
            return null;
          }
        })
        .filter((inv): inv is Investigation => inv !== null);

      if (status) {
        return investigations.filter((inv) => inv.status === status);
      }

      return investigations.sort(
        (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
      );
    } catch (error) {
      console.error('[forensics] Failed to list investigations:', error);
      return [];
    }
  }

  /**
   * Find the most recent active or paused investigation to resume.
   */
  async findResumableInvestigation(): Promise<Investigation | null> {
    const investigations = await this.listInvestigations();
    return (
      investigations.find((inv) => inv.status === 'active' || inv.status === 'paused') ||
      null
    );
  }

  // --- Concept Tracking ---

  /**
   * Mark a concept as known (user has seen explanation).
   */
  async markConceptKnown(concept: string): Promise<void> {
    if (!this.mem0) return;

    try {
      const normalizedConcept = concept.toLowerCase().trim();
      await this.mem0.add(`User learned about: ${normalizedConcept}`, {
        type: FORENSICS_TYPES.concept,
        concept: normalizedConcept,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[forensics] Failed to mark concept known:', error);
    }
  }

  /**
   * Check if user already knows a concept.
   */
  async isConceptKnown(concept: string): Promise<boolean> {
    if (!this.mem0) return false;

    try {
      const normalizedConcept = concept.toLowerCase().trim();
      const all = await this.mem0.getAll();
      return all.some(
        (m) =>
          (m as any).metadata?.type === FORENSICS_TYPES.concept &&
          (m as any).metadata?.concept === normalizedConcept
      );
    } catch (error) {
      console.error('[forensics] Failed to check concept:', error);
      return false;
    }
  }

  /**
   * Get all known concepts.
   */
  async getKnownConcepts(): Promise<string[]> {
    if (!this.mem0) return [];

    try {
      const all = await this.mem0.getAll();
      return all
        .filter((m) => (m as any).metadata?.type === FORENSICS_TYPES.concept)
        .map((m) => (m as any).metadata?.concept as string)
        .filter((c): c is string => typeof c === 'string');
    } catch (error) {
      console.error('[forensics] Failed to get known concepts:', error);
      return [];
    }
  }

  // --- Spec Storage ---

  /**
   * Save an API spec.
   */
  async saveSpec(spec: APISpec): Promise<string | null> {
    if (!this.mem0) return null;

    try {
      const content = JSON.stringify(spec);
      return await this.mem0.add(content, {
        type: FORENSICS_TYPES.spec,
        spec_name: spec.name,
        spec_version: spec.version,
        investigation_id: spec.investigationId,
      });
    } catch (error) {
      console.error('[forensics] Failed to save spec:', error);
      return null;
    }
  }

  /**
   * Get a spec by name.
   */
  async getSpec(name: string): Promise<APISpec | null> {
    if (!this.mem0) return null;

    try {
      const all = await this.mem0.getAll();
      const found = all.find(
        (m) =>
          (m as any).metadata?.type === FORENSICS_TYPES.spec &&
          (m as any).metadata?.spec_name === name
      );

      if (!found) return null;

      return JSON.parse(found.content) as APISpec;
    } catch (error) {
      console.error('[forensics] Failed to get spec:', error);
      return null;
    }
  }

  /**
   * List all specs.
   */
  async listSpecs(): Promise<APISpec[]> {
    if (!this.mem0) return [];

    try {
      const all = await this.mem0.getAll();
      return all
        .filter((m) => (m as any).metadata?.type === FORENSICS_TYPES.spec)
        .map((m) => {
          try {
            return JSON.parse(m.content) as APISpec;
          } catch {
            return null;
          }
        })
        .filter((spec): spec is APISpec => spec !== null);
    } catch (error) {
      console.error('[forensics] Failed to list specs:', error);
      return [];
    }
  }

  // --- Profile Integration ---

  /**
   * Get the user's skill level for forensics tasks.
   * Infers from profile's knowledge and workingStyle.
   */
  async getSkillLevel(): Promise<SkillLevel> {
    if (!this.mem0) return 'beginner'; // Default to beginner if not configured

    try {
      const snapshot = await this.mem0.getLatestProfile();
      if (!snapshot) return 'beginner';

      const profile = snapshot.profile;

      // Check if user is expert in relevant areas
      const expertAreas = profile.knowledge?.expert || [];
      const forensicsExpertise = expertAreas.some((area) =>
        ['reverse engineering', 'protocol analysis', 'network forensics', 'api development', 'security'].some(
          (keyword) => area.toLowerCase().includes(keyword)
        )
      );

      if (forensicsExpertise) return 'advanced';

      // Check if user has relevant proficiency
      const proficientAreas = profile.knowledge?.proficient || [];
      const hasRelevantProficiency = proficientAreas.some((area) =>
        ['http', 'rest', 'api', 'networking', 'debugging'].some((keyword) =>
          area.toLowerCase().includes(keyword)
        )
      );

      if (hasRelevantProficiency) return 'intermediate';

      // Check working style preference
      if (profile.workingStyle?.learningPace === 'fast') return 'intermediate';

      return 'beginner';
    } catch (error) {
      console.error('[forensics] Failed to get skill level:', error);
      return 'beginner';
    }
  }

  /**
   * Get user's tech stack for implementation suggestions.
   */
  async getUserStack(): Promise<{ languages: string[]; frameworks: string[] }> {
    if (!this.mem0) return { languages: [], frameworks: [] };

    try {
      const snapshot = await this.mem0.getLatestProfile();
      if (!snapshot) return { languages: [], frameworks: [] };

      const profile = snapshot.profile;
      return {
        languages: profile.technical?.languages || [],
        frameworks: profile.technical?.frameworks || [],
      };
    } catch (error) {
      console.error('[forensics] Failed to get user stack:', error);
      return { languages: [], frameworks: [] };
    }
  }

  /**
   * Get user's verbosity preference.
   */
  async getVerbosity(): Promise<'concise' | 'detailed' | 'adaptive'> {
    if (!this.mem0) return 'adaptive';

    try {
      const snapshot = await this.mem0.getLatestProfile();
      if (!snapshot) return 'adaptive';

      return snapshot.profile.workingStyle?.verbosity || 'adaptive';
    } catch (error) {
      console.error('[forensics] Failed to get verbosity:', error);
      return 'adaptive';
    }
  }
}

// Singleton instance
let instance: ForensicsMemory | null = null;

export function getForensicsMemory(): ForensicsMemory {
  if (!instance) {
    instance = new ForensicsMemory();
  }
  return instance;
}
