# Perplexity Integration for Claude Code

**Date**: January 1, 2026
**Author**: Nick
**Status**: Approved

## Purpose

Integrate Perplexity AI search into Claude Code to provide superior citations and personalized context. The system enriches search queries with user preferences, working style, and knowledge levels, delivering results tailored to the user's background.

## Components

### MCP Server Plugin: perplexity-search

An MCP server that provides the `perplexity_search` tool. The server manages API authentication, loads user profiles, enriches queries with personal context, and returns search results with citations.

**Tool Interface:**
- **Name**: `perplexity_search`
- **Parameters**:
  - `query` (string, required): The search query
  - `max_results` (number, optional, default: 5): Number of results
  - `include_profile_context` (boolean, optional, default: true): Enrich with user profile

**Authentication:**
- Reads API key from `~/.claude/perplexity-search/config.json`
- Falls back to `PERPLEXITY_API_KEY` environment variable
- Config schema:
  ```json
  {
    "apiKey": "pplx-xxxxx",
    "defaultMaxResults": 5
  }
  ```

**Query Enrichment:**
1. Load user profile from `~/.claude/perplexity-search/user-profile.json`
2. Prepend context to query when `include_profile_context=true`:
   ```
   Context about me: [Technical preferences, working style, knowledge levels...]

   Query: {original_query}
   ```
3. Send enriched query to Perplexity API
4. Return results with citations

**Profile Management:**
- Check profile age on every tool invocation
- Trigger background refresh if last refresh >2 days ago
- Refresh uses episodic memory search to rebuild profile

### Skill: using-perplexity-for-context

Defines when Claude Code automatically invokes Perplexity search. Runs silently without user interruption.

**Automatic Triggers:**

1. **Unfamiliar Territory** - Libraries, frameworks, or tools not in training data or recently updated
2. **Decision Points** - Choosing between architectural approaches where user preference matters
3. **Learning Questions** - "How does X work", "What is Y", "Explain Z"
4. **Preference-Dependent Choices** - Multiple valid approaches where user's style affects the decision
5. **Context Enrichment** - Technical explanations that benefit from knowing user's background

**Execution:**
- Invoke `perplexity_search` tool with enriched query
- Process results and citations
- Integrate findings into response naturally
- Never announce usage unless user asks

### User Profile System

**Location**: `~/.claude/perplexity-search/user-profile.json`

**Structure:**
```json
{
  "version": "1.0",
  "lastUpdated": "2026-01-01T12:00:00Z",
  "lastRefresh": "2026-01-01T12:00:00Z",
  "profile": {
    "technicalPreferences": {
      "languages": ["TypeScript", "JavaScript"],
      "frameworks": ["React", "Next.js"],
      "tools": ["Prisma", "Git"],
      "patterns": ["Type safety first", "Prefer functional over OOP"]
    },
    "workingStyle": {
      "explanationPreference": "concise with code examples",
      "communicationStyle": "direct and technical",
      "priorities": ["code quality", "automation", "consistency"]
    },
    "projectContext": {
      "domains": ["B2B SaaS", "full-stack web apps"],
      "currentProjects": ["FFDDNet-admin"],
      "commonTasks": ["debugging", "feature development"]
    },
    "knowledgeLevel": {
      "expert": ["React", "TypeScript"],
      "proficient": ["Node.js"],
      "learning": ["Claude Code plugin development"]
    }
  }
}
```

**Automatic Updates:**

1. **Time-Based Refresh** (every 2 days)
   - Check `lastRefresh` timestamp
   - Query episodic memory: "Nick's technical preferences", "Nick's working style", "Nick's knowledge levels"
   - Merge results into profile structure
   - Update `lastRefresh` timestamp

2. **Smart Detection** (real-time, silent)
   - Watch for preference signals: "I prefer X", "I like X", "I avoid X"
   - Watch for activity signals: "I'm trying to X", "I'm working on X", "I'm building X"
   - Watch for knowledge signals: "I'm learning X", "I'm an expert in X", "I don't know X"
   - Watch for tool signals: "I use X", "I switched to X"
   - Categorize and update appropriate profile section
   - Update `lastUpdated` timestamp

## Architecture Flow

```
User asks question
  ↓
Skill detects trigger condition
  ↓
Invoke perplexity_search tool
  ↓
Load user profile (create default if missing)
  ↓
Enrich query with personal context
  ↓
Call Perplexity API
  ↓
Return results with citations
  ↓
Background: Check if profile refresh needed (>2 days)
  ↓
If needed: Async episodic memory search → Update profile
```

## Error Handling

**MCP Server:**

- **Missing API Key**: Return actionable error message
- **Missing Profile**: Create default empty profile on first run
- **Corrupted Profile**: Log error, continue without enrichment
- **Stale Profile**: Auto-refresh if >2 days old
- **API Rate Limits (429)**: Return error to Claude for retry or fallback
- **API Auth Errors (401)**: Return clear error message
- **Network Timeouts**: Fail gracefully, allow WebSearch fallback
- **Profile Refresh Failures**: Log silently, use existing profile

**Skill:**

- **Tool Unavailable**: Fall back to WebSearch or direct response
- **Trigger False Positives**: Better to invoke unnecessarily than miss opportunities

## Implementation

**Tech Stack:**
- TypeScript
- `@modelcontextprotocol/sdk` - MCP server framework
- `@perplexity-ai/perplexity_ai` - Official Perplexity Node SDK
- `fs/promises` - File operations

**Project Structure:**
```
~/.claude/plugins/perplexity-search/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── tools/
│   │   └── perplexity-search.ts # Tool implementation
│   ├── profile/
│   │   ├── manager.ts           # Profile CRUD
│   │   ├── refresh.ts           # Episodic memory refresh
│   │   └── smart-detection.ts   # Pattern detection
│   └── types.ts                 # TypeScript types
├── config.json                  # API key (gitignored)
└── user-profile.json            # Profile (gitignored)

~/.claude/skills/
└── using-perplexity-for-context.md
```

**Installation:**
- Install plugin via Claude Code plugin system
- Install skill in `~/.claude/skills/`
- First run creates default config and profile

## Next Steps

1. Create git worktree for isolated development
2. Write detailed implementation plan
3. Build MCP server plugin
4. Write skill markdown file
5. Test with real Perplexity API
6. Iterate based on usage patterns
