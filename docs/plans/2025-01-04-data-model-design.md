# Brain-Jar Data Model Design

*Date: 2025-01-04*

## Overview

This document captures the data model design for brain-jar plugins, including proposed changes to improve persistence, scoping, and cross-plugin coherence.

## Current State

### Plugins and Storage

| Plugin | Entities | Storage | Scope Support |
|--------|----------|---------|---------------|
| shared-memory | Memory, UserProfile, ProfileSnapshot, ActivitySummary, InferredPreference | SQLite + Mem0 | Yes |
| visual-thinking | Diagram, DiagramVersion | SQLite | Yes |
| forensics | Investigation, Endpoint, AuthPattern, APISpec | Mem0 only | No |
| pattern-radar | Signal, Pattern, RadarConfig | In-memory (ephemeral) | No |
| perplexity-search | (none) | N/A | N/A |

### Problems Identified

1. **Pattern-radar data is ephemeral** - Signals and patterns lost on session end
2. **No auto-detection of project scope** - Users must manually specify `project:<name>`
3. **Forensics has no scope** - Investigations aren't tied to projects
4. **Inconsistent scope handling** - Each plugin implements scope differently

---

## Proposed Changes

### 1. Pattern-Radar Persistence

Add persistence for digests with lifecycle management.

#### New Entity: RadarDigest

```typescript
interface RadarDigest {
  id: string;
  scope: "global";              // Always global (forward-looking tool)
  generatedAt: string;          // ISO timestamp
  status: "fresh" | "actioned" | "stale";
  lastActionedAt?: string;      // When user explored/validated
  expiresAt: string;            // generatedAt + 30 days
  domains: string[];            // User's domains at generation time
  signalCount: number;
  patternCount: number;
}
```

#### Updated Entities

```typescript
interface Signal {
  id: string;
  digestId: string;             // NEW: provenance tracking
  source: "hackernews" | "github" | "perplexity";
  title: string;
  url?: string;
  score: number;
  timestamp: string;
  metadata: Record<string, unknown>;
  quickScan?: QuickScanResult;
}

interface Pattern {
  id: string;
  digestId: string;             // NEW: provenance tracking
  title: string;
  description: string;
  signals: Signal[];
  relevanceScore: number;
  domains: string[];
  detectedAt: string;
  actionable: ActionableInsight[];
}
```

#### Digest Lifecycle

```
FRESH ──────────────────────────────────► STALE ──► PRUNED
  │        (30 days, no action)
  │
  ├─► explore_pattern() ─┐
  ├─► validate_signal() ─┼──► ACTIONED (kept forever)
  └─► memory created ────┘
```

**Retention rules:**
- Digest is KEPT if user ran `explore_pattern` or `validate_signal` on any of its signals
- Digest is KEPT if user created a memory referencing it (tracked via `digestId` in memory metadata)
- Digest is PRUNED if neither of the above AND older than 30 days

#### Storage

- Local: SQLite (same pattern as visual-thinking)
- Cloud: Mem0 sync (optional, same pattern as shared-memory)

---

### 2. Scope Auto-Detection

Add a core utility for automatic project scope detection.

#### New Core Utility

```typescript
// @brain-jar/core

interface ScopeDetectionResult {
  scope: string;                // "global" | "project:<name>"
  projectName?: string;
  gitRoot?: string;
  source: "package.json" | "Cargo.toml" | "pyproject.toml" | "go.mod" | "git" | "directory" | "none";
}

function detectScope(cwd?: string): string {
  const dir = cwd || process.cwd();

  // 1. Find git root
  const gitRoot = findGitRoot(dir);
  const searchDir = gitRoot || dir;

  // 2. Check project markers (in priority order)
  const markers = [
    { file: "package.json", extract: (c) => JSON.parse(c).name },
    { file: "Cargo.toml", extract: (c) => parseToml(c).package?.name },
    { file: "pyproject.toml", extract: (c) => parseToml(c).project?.name },
    { file: "go.mod", extract: (c) => c.match(/^module\s+(.+)/m)?.[1] },
  ];

  for (const marker of markers) {
    const name = tryExtractName(searchDir, marker);
    if (name) return `project:${name}`;
  }

  // 3. Fallback to git directory name
  if (gitRoot) {
    return `project:${path.basename(gitRoot)}`;
  }

  // 4. No project detected
  return "global";
}
```

#### Detection Timing

**Per-operation detection** (not at startup):
- Called fresh on every operation that needs a scope
- Handles user changing directories mid-session
- Cheap operation (few `fs.existsSync` calls)

```typescript
// Example usage in plugin
async function addMemory(args: AddMemoryInput) {
  const scope = args.scope || detectScope();  // Fresh check each time
  // ...
}
```

#### Plugin Scope Behavior

| Plugin | Auto-detect | Hardcoded | Notes |
|--------|-------------|-----------|-------|
| shared-memory | Yes | - | User can override |
| visual-thinking | Yes | - | User can override |
| forensics | Yes | - | User can override (NEW) |
| pattern-radar | - | "global" | Forward-looking, not project-bound |
| perplexity-search | N/A | N/A | Stateless |

---

### 3. Forensics Scope Support

Add scope field to Investigation entity.

#### Updated Entity

```typescript
interface Investigation {
  id: string;
  name: string;
  mode: InvestigationMode;
  status: InvestigationStatus;
  scope: string;                // NEW: auto-detected
  created: string;
  updated: string;
  target?: string;
  findings: { /* ... */ };
  sessionState?: { /* ... */ };
}
```

#### Migration

Existing investigations in Mem0 without scope field:
- Default to `"global"` when loaded
- Update with proper scope on next save (if detectable)

---

### 4. Cross-Plugin Linking Strategy

**Principle: Keep data model simple, let Claude find connections.**

#### Explicit Links (Only Where Required)

The only explicit foreign key relationship:
- `Memory.metadata.digestId` → `RadarDigest.id` (for prune logic)

#### Implicit Links (Convention-Based)

Everything else uses:
- **Scope** - Same scope = related
- **Tags** - Tag with IDs for findability (e.g., `investigation:abc123`)
- **Content** - Mention related entities in content
- **Timestamps** - Created around the same time

Claude can discover relationships by:
1. Querying same scope across plugins
2. Searching content for mentions
3. Matching by timestamp proximity
4. Following tag hints

---

## Data Model Diagram

See `visual-thinking` diagram: "Brain-Jar Data Model (Current)" (id: abd0a837-8b75-40d1-8357-d562689114f0)

---

## Implementation Order

1. **@brain-jar/core: detectScope()** - Foundation for everything else
2. **pattern-radar: RadarDigest persistence** - Most impactful change
3. **forensics: Add scope field** - Small change, big improvement
4. **pattern-radar: Auto-prune job** - Cleanup logic

---

## Open Questions

1. **Prune job trigger** - On plugin startup? Scheduled? On each digest creation?
2. **Memory ↔ Digest linking** - How does Claude know to tag a memory with digestId when creating it? Skill instruction? Auto-detection?
3. **Scope format validation** - Should we enforce `project:<name>` format or allow freeform?

---

## Summary

| Change | Complexity | Impact |
|--------|------------|--------|
| Pattern-radar persistence | Medium | High - no more lost insights |
| Scope auto-detection | Low | High - seamless project context |
| Forensics scope | Low | Medium - better organization |
| Cross-plugin linking | None | N/A - rely on conventions |
