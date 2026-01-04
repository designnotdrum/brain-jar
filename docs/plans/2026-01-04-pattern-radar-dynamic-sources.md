# Pattern Radar v2: Dynamic Source Architecture

## Overview

Pattern-radar evolves from hardcoded sources (HN, GitHub, Perplexity) to a dynamic system that discovers and configures sources based on user topics.

## Core Concepts

### Source Registry
Adapters are templates that know how to fetch from a source type. Each adapter can create multiple instances configured for specific topics.

**Core adapters (ship with plugin):**
- reddit - subreddits, search
- hackernews - existing
- github - existing
- newsapi - keyword news search
- rss - generic RSS/Atom feeds
- espn - sports news/scores

**Custom adapters:** Users can create their own via `/create-adapter` skill, stored in `~/.config/pattern-radar/adapters/`.

### Topic → Source Mapping

Three-tier resolution:

1. **Curated mappings** (baked in) - common domains like sports, finance, tech with known source types
2. **Learned mappings** (shared-memory) - topic→instance mappings discovered previously
3. **LLM discovery** (fallback) - Perplexity query with structured prompt for novel topics

### Source Instances

A configured fetcher for a specific topic:
- `reddit:r/reddevils` for "Manchester United"
- `rss:https://manutd.com/feed` for "Manchester United"
- `hackernews:search` for "AI agents"

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Pattern Radar                        │
├─────────────────────────────────────────────────────────┤
│  Source Registry                                        │
│  ├── Core Adapters (baked in)                          │
│  │   └── reddit, hackernews, github, newsapi, rss, espn│
│  └── Custom Adapters (~/.config/pattern-radar/adapters)│
├─────────────────────────────────────────────────────────┤
│  Topic → Source Mapper                                  │
│  ├── Curated Mappings (baked in defaults)              │
│  ├── Learned Mappings (shared-memory)                  │
│  └── LLM Discovery (fallback for novel topics)         │
├─────────────────────────────────────────────────────────┤
│  Source Instances (configured per-topic)               │
│  └── e.g., reddit:r/reddevils for "Manchester United"  │
└─────────────────────────────────────────────────────────┘
```

## Interfaces

### SourceAdapter

```typescript
interface SourceAdapter {
  type: string;                      // "reddit"
  name: string;                      // "Reddit"
  capabilities: string[];            // ["subreddit", "search", "user"]
  requiresAuth: boolean;
  freeTierAvailable: boolean;
  authSetupUrl?: string;

  createInstance(config: InstanceConfig): SourceInstance;
  validateConfig(config: InstanceConfig): ValidationResult;
}
```

### SourceInstance

```typescript
interface SourceInstance {
  id: string;                        // "reddit:r/reddevils"
  adapter: string;                   // "reddit"
  topic: string;                     // "Manchester United"
  config: InstanceConfig;

  fetch(options: FetchOptions): Promise<Signal[]>;
  healthCheck(): Promise<HealthStatus>;
}
```

## Curated Domain Mappings

```typescript
const CURATED_MAPPINGS: DomainMapping[] = [
  {
    domain: "sports/football",
    keywords: ["football", "soccer", "premier league", "la liga", "champions league"],
    sourceTypes: ["reddit", "espn", "rss"],
    discoveryHints: "Look for team-specific subreddits, official RSS feeds"
  },
  {
    domain: "finance",
    keywords: ["stocks", "investing", "trading", "market"],
    sourceTypes: ["reddit", "newsapi", "rss"],
    discoveryHints: "r/stocks, r/investing, Yahoo Finance RSS"
  },
  {
    domain: "crypto",
    keywords: ["crypto", "bitcoin", "ethereum", "blockchain"],
    sourceTypes: ["reddit", "newsapi", "rss"],
    discoveryHints: "r/cryptocurrency, CoinDesk RSS"
  },
  {
    domain: "gaming",
    keywords: ["gaming", "video games", "esports"],
    sourceTypes: ["reddit", "rss"],
    discoveryHints: "Game-specific subreddits, Steam news RSS"
  },
  {
    domain: "tech",
    keywords: ["programming", "software", "ai", "llm"],
    sourceTypes: ["hackernews", "github", "reddit"],
    discoveryHints: "r/programming, r/MachineLearning"
  }
];
```

## LLM Discovery

Structured prompt with guardrails about available adapter types:

```typescript
async function discoverSourcesForTopic(topic: string): Promise<DiscoveredSources> {
  const prompt = `
I need to track "${topic}" using these source types:
- reddit: specific subreddits (give me the subreddit name)
- rss: RSS/Atom feed URLs
- newsapi: search keywords
- espn: sport + team/league identifier

For "${topic}", which apply? Return JSON:
{
  "sources": [
    { "type": "reddit", "config": { "subreddit": "..." }, "reason": "..." }
  ],
  "domain": "best matching domain category"
}

Only include sources that actually exist.
`;

  const result = await perplexitySearch(prompt, { mode: 'quick' });
  return parseAndValidate(result);
}
```

After discovery:
1. Health-check each source (verify subreddit exists, RSS feed valid, etc.)
2. Show user what was found, ask confirmation
3. Save working sources to shared-memory as learned mappings

## JIT Auth Flow

- Attempt free/anonymous access first
- Only prompt when rate-limited or feature requires auth
- Store credentials in `~/.config/pattern-radar/auth.json`
- Track skip state to avoid nagging within 24h

```typescript
interface AuthState {
  adapter: string;
  status: 'none' | 'free-tier' | 'authenticated';
  credentials?: EncryptedCredentials;
  skippedAt?: string;
}
```

## Custom Adapter Authoring

`/create-adapter` skill walks users through:

1. Ask what source they want to add
2. Analyze the source (fetch, check structure)
3. Generate adapter code
4. Test and validate
5. Save to `~/.config/pattern-radar/adapters/`

Custom adapters loaded at startup alongside core adapters.

## Config Structure

```typescript
interface RadarConfig {
  topics: TopicConfig[];
  adapters: {
    core: string[];
    custom: string[];
  };
  auth: Record<string, AuthState>;
  learnedMappings: LearnedMapping[];
  domains: string[];
  digestFrequency: 'daily' | 'weekly' | 'manual';
}

interface TopicConfig {
  topic: string;
  instances: SourceInstance[];
  enabled: boolean;
  addedAt: string;
}
```

## Backwards Compatibility

Existing HN/GitHub-only configs map to the new structure internally. No breaking changes for current users.

## File Locations

- Core adapters: `plugins/pattern-radar/src/sources/`
- Curated mappings: `plugins/pattern-radar/src/mappings.ts`
- Custom adapters: `~/.config/pattern-radar/adapters/`
- Auth config: `~/.config/pattern-radar/auth.json`
- Learned mappings: shared-memory (with local cache)
