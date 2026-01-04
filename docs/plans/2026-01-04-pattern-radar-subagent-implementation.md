# Pattern-Radar Subagent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update `/digest` skill to use Haiku subagent for personalized narrative generation with serendipity preserved.

**Architecture:** Haiku subagent fetches signals, cross-references with profile, generates personalized briefing with wildcards for unexpected discoveries.

**Tech Stack:** Claude Code Task tool, Haiku model, existing MCP tools unchanged

---

## Task 1: Update /digest Skill for Subagent Pattern

**Files:**
- Modify: `plugins/pattern-radar/skills/digest/SKILL.md`

**Replace with subagent-driven workflow:**

```markdown
---
name: pattern-radar:digest
description: Get your personalized trend briefing based on profile domains.
---

# Personalized Trend Digest (Subagent-Driven)

This skill dispatches a Haiku subagent to generate your personalized trend briefing. Main context receives a curated narrative; subagent does the analysis.

## Architecture

```
You (Opus) → Dispatch Haiku subagent → Subagent calls radar tools → Returns narrative
           ← Personalized briefing   ← Raw signals processed
```

## How to Use

When user asks for trends, dispatches, or wants to know what's happening:

**Step 1: Dispatch Digest Subagent**

```
Use Task tool:
- subagent_type: "general-purpose"
- model: "haiku"
- prompt: "You are a personalized trend analyst. Generate a trend briefing for the user.

STEPS:
1. Call get_radar_digest() to fetch signals from HN and GitHub
2. Call get_intersections() to find domain overlaps
3. Call suggest_actions(focus: 'all') for actionable recommendations

OUTPUT FORMAT:
Return a 300-400 word personalized briefing with these sections:

## 🎯 Relevant to You
[2-3 patterns directly matching user's domains, with why they matter]

## 🌟 Wildcards (Serendipity)
[1-2 interesting signals OUTSIDE user's usual domains - unexpected discoveries]

## 💡 Suggested Actions
[2-3 specific actions: something to learn, something to build, something to explore]

Keep it conversational and actionable. Include specific links where helpful."
```

**Step 2: Present the Briefing**

Tell the user the subagent's narrative. Don't dump raw signal lists.

## Serendipity Mode (Default)

**IMPORTANT:** Always include the Wildcards section. The whole point of pattern-radar is surfacing unexpected connections.

If user explicitly asks for "focused mode" or "only my domains":
- Skip the Wildcards section
- Mention: "I've filtered to just your domains. Say 'full digest' to include wildcards."

## Quick Scan (Direct)

For quick topic scans, use tools directly (no subagent needed):

```
scan_trends(topic: "WebAssembly")
```

This returns raw signals - useful when user wants to explore a specific topic themselves.

## Configuration

Help users configure their radar:

```
configure_sources(domains: ["TypeScript", "AI", "distributed-systems"])
```

Or for source weights:
```
configure_sources(hackernews_weight: 1.5, github_weight: 1.0)
```

## Example Flow

```
User: What's trending that I should know about?

You: Let me generate your personalized trend digest...
[Dispatch Haiku subagent]

Subagent returns:
## 🎯 Relevant to You
**Edge Runtime Performance** is heating up - 3 HN discussions and 2 trending repos
about V8 isolates and cold start optimization. Given your TypeScript + serverless
background, this could affect your Lambda work.

**AI Code Review Tools** are seeing a surge. GitHub Copilot competitors like
Cursor and Continue are trending. Worth watching for your code-review plugin work.

## 🌟 Wildcards
**Game Engine Renaissance** - Godot 4.3 just dropped and HN is buzzing. Not your
usual domain, but the architectural patterns (ECS, hot-reload) might inspire
plugin design.

## 💡 Suggested Actions
- **Learn:** Read the Cloudflare Workers V8 isolate blog post (linked in signals)
- **Build:** Try adding AI-assisted review to your code-review plugin
- **Explore:** Check out Godot's plugin architecture for inspiration

User: Just show me AI stuff, skip the wildcards

You: [Call scan_trends directly]
Here are the AI-specific signals...
```
```

**Commit:**
```bash
git add plugins/pattern-radar/skills/digest/SKILL.md
git commit -m "feat(pattern-radar): update /digest to use subagent pattern"
```

---

## Task 2: Release Plugin Update

**Run:**
```
/release pattern-radar minor "add subagent-driven personalized digest"
```

---

## Summary

| Task | What Changes | Effort |
|------|-------------|--------|
| 1 | Skill rewrite for subagent pattern | Light |
| 2 | Release | Automated |

**Key principle:** Serendipity mode is DEFAULT. Wildcards section always included unless user explicitly asks for focused mode.
