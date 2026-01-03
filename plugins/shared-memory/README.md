# shared-memory

**Give Claude a brain that remembers you.**

Claude forgets everything when a session ends. Shared-memory fixes that. Your preferences, decisions, and context persist across conversations—so Claude stops asking the same questions and starts working the way you work.

## The Problem

Every new Claude session starts from zero:
- "What framework do you use?" (for the hundredth time)
- "How do you prefer error handling?" (you've explained this)
- Context from last week's debugging session? Gone.

You waste time re-explaining yourself. Claude wastes tokens rediscovering your preferences.

## The Solution

Shared-memory stores two things:

1. **Memories** — Decisions, context, and discoveries that matter
2. **Your Profile** — Preferences, tech stack, and working style

Both sync to the cloud via [Mem0](https://mem0.ai), so they follow you across machines and sessions.

## What Changes

| Before | After |
|--------|-------|
| "What's your preferred testing framework?" | Claude already knows you use Vitest |
| Re-explain architecture decisions each session | Past context surfaces automatically |
| Generic responses | Tailored to your skill level and stack |
| Lost debugging insights | Searchable knowledge base |

## Quick Start

```bash
# Install from brain-jar marketplace
/plugin → brain-jar → shared-memory

# First run prompts for Mem0 API key (free tier: 10,000 memories)
```

## Tools

### Memory Management
| Tool | Purpose |
|------|---------|
| `add_memory` | Store context with tags and scope |
| `search_memory` | Semantic search across all memories |
| `list_memories` | Browse recent memories |
| `delete_memory` | Remove outdated information |

### Profile Learning
| Tool | Purpose |
|------|---------|
| `get_user_profile` | Read your preferences |
| `update_user_profile` | Directly update a field |
| `propose_profile_inference` | Claude suggests a preference it noticed |
| `confirm_profile_update` / `reject_profile_update` | You approve or reject |
| `get_onboarding_questions` | Guided profile building |
| `analyze_codebase_for_profile` | Infer stack from your code |

### Timeline & Summaries
| Tool | Purpose |
|------|---------|
| `get_memory_timeline` | Query memories by date range |
| `get_activity_summaries` | View auto-generated summaries |
| `trigger_summary` | Manually create a summary |
| `get_profile_history` | See how your profile evolved |

## Skills

- **`/learning-about-you`** — Guided onboarding to build your profile
- **`/managing-memory`** — Best practices for storing useful memories
- **`/summarize`** — Trigger activity summaries on demand

## How It Works

```
┌─────────────────────────────────────────────────┐
│                  Claude Session                  │
├─────────────────────────────────────────────────┤
│  "Use TypeScript"   →   Profile updated         │
│  "Remember: API uses OAuth2"  →  Memory stored  │
│  "Search past auth decisions"  →  Results found │
└─────────────────────────────────────────────────┘
                         ↓
              ┌──────────────────┐
              │   Local SQLite   │  (working memory)
              └────────┬─────────┘
                       ↓
              ┌──────────────────┐
              │    Mem0 Cloud    │  (persistent sync)
              └──────────────────┘
```

**Local-first**: Everything works offline. Mem0 syncs when available.

**Scoped memories**: Use `global` for preferences that apply everywhere, or `project:name` for project-specific context.

**Auto-summaries**: After enough activity, the plugin generates summaries to keep memory efficient.

## Profile Sections

Your profile captures:

- **Identity** — Name, role, experience level
- **Knowledge** — Languages, frameworks, domains you know
- **Preferences** — Code style, tooling, communication style
- **Working Style** — How you like to receive information

Claude reads this to adapt responses. An advanced TypeScript developer gets different explanations than a Python beginner.

## Privacy

- Memories are stored under your Mem0 account
- Local SQLite cache stays on your machine
- No data shared with brain-jar maintainers
- Delete anytime via Mem0 dashboard or `delete_memory`

## Requirements

- Claude Code CLI
- Node.js 18+
- Mem0 API key (free tier available)

## License

MIT
