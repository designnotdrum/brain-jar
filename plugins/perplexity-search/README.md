# perplexity-search

**Real-time web search that knows who's asking.**

Claude's built-in web search works. But it doesn't know you use React, prefer TypeScript, or that you asked about OAuth yesterday. Perplexity-search adds that context—so searches return results tailored to your stack and history.

## The Problem

Generic web search returns generic results:
- "How to handle authentication" → Java tutorials when you use Node
- Same questions, different sessions → no accumulated context
- Searches don't inform future searches

## The Solution

Perplexity-search does three things:

1. **Profile-aware queries** — Your tech stack and preferences shape results
2. **Search memory** — Past searches provide context for new ones
3. **Perplexity's Sonar model** — Real-time, citation-backed answers

## What Changes

| Before | After |
|--------|-------|
| "Best auth library" → random framework | Results prioritize your stack (Node, React, etc.) |
| Repeat searches start fresh | "We discussed OAuth yesterday—here's the follow-up" |
| Generic explanations | Matched to your experience level |

## Quick Start

```bash
# Install from brain-jar marketplace
/plugin → brain-jar → perplexity-search

# First run prompts for Perplexity API key
# Get one at https://www.perplexity.ai/settings/api
```

## Tool

### `perplexity_search`

Search the web with automatic context enrichment.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `query` | string | What to search for |
| `include_profile_context` | boolean | Add your profile to the query (default: true) |
| `max_results` | number | Limit results returned |

**Example:**
```
perplexity_search("best practices for API rate limiting")
```

With profile context enabled, this becomes:
```
best practices for API rate limiting

User context: TypeScript developer, 5+ years experience,
uses Express.js, prefers functional patterns

Relevant past searches:
- "express middleware patterns" (2 days ago)
- "redis caching strategies" (1 week ago)
```

## Skill

### `/using-perplexity-for-context`

Guides when and how to use web search effectively:
- When to search vs. rely on training data
- How to phrase queries for better results
- Combining search with memory for context building

## How It Works

```
┌────────────────────────────────────────────────────┐
│                    Your Query                       │
│        "How do I implement refresh tokens?"         │
└────────────────────────┬───────────────────────────┘
                         ↓
        ┌────────────────────────────────┐
        │       Profile Enrichment       │
        │  + "Uses Node.js, TypeScript"  │
        │  + "Prefers functional style"  │
        └────────────────────────────────┘
                         ↓
        ┌────────────────────────────────┐
        │       Memory Context           │
        │  + "Asked about JWT yesterday" │
        │  + "Using Express middleware"  │
        └────────────────────────────────┘
                         ↓
        ┌────────────────────────────────┐
        │       Perplexity Sonar         │
        │   Real-time web search + AI    │
        └────────────────────────────────┘
                         ↓
        ┌────────────────────────────────┐
        │       Store Result             │
        │   Saved to Mem0 for next time  │
        └────────────────────────────────┘
```

## Integration with shared-memory

When both plugins are installed:

1. **Profile sharing** — Perplexity reads your profile from `~/.config/brain-jar/user-profile.json`
2. **Search history** — Results store in Mem0, searchable later
3. **Context building** — Past searches inform future ones

Install shared-memory first to get the full experience.

## Privacy

- Queries go to Perplexity AI (see their [privacy policy](https://www.perplexity.ai/privacy))
- Profile context is appended to queries (opt-out with `include_profile_context: false`)
- Search history stores in your Mem0 account (if configured)

## Requirements

- Claude Code CLI
- Node.js 18+
- Perplexity API key ([get one here](https://www.perplexity.ai/settings/api))
- Optional: Mem0 API key (for search memory)

## License

MIT
