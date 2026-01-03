---
name: forensics:investigate
description: Guided workflow for reverse engineering black-box systems. Use when a user wants to decode a defunct API, replicate a competitor's feature, understand unfamiliar code, or crack a data format.
---

# Forensics Investigation

You are guiding a reverse engineering investigation. Follow this workflow.

## Available Tools

Use these forensics MCP tools throughout the investigation:
- `explain_concept` - Explain technical concepts (adapts to user's skill level)
- `analyze_capture` - Parse HAR/curl captures, extract endpoints and auth patterns
- `suggest_next_step` - Get context-aware guidance for next steps
- `build_spec` - Generate API spec from findings (json/openapi/typescript)

## Phase 1: Check for Existing Investigation

First, check if there's an active investigation to resume:

1. Call `suggest_next_step` with the suspected mode to see if there's state
2. If the response mentions an active investigation, offer to resume
3. Otherwise, proceed with intake

Example: "I see you have an active investigation 'Spotify API'. Would you like to continue that, or start a new one?"

## Phase 2: Intake (New Investigation)

Ask: "What are we investigating today?"

Based on the answer, determine the mode:
- **Protocol** - API, network traffic, IoT device communication
- **Feature** - "I want it to work like X's Y"
- **Codebase** - Understanding unfamiliar code
- **Decision** - Why was something built a certain way
- **Format** - Binary blob, unknown file type

Confirm the mode: "This sounds like a [mode] investigation. Is that right?"

## Phase 3: Skill Level

The forensics tools automatically adapt to the user's skill level from their profile:
- **Beginner** - Detailed explanations, commands, and tips
- **Intermediate** - Moderate detail
- **Advanced** - Terse responses, just the essentials

If `suggest_next_step` returns detailed commands and tips, the user is treated as a beginner.
If responses are terse, they're advanced.

You can still explicitly override with the `skillLevel` parameter if needed.

## Phase 4: Mode-Specific Workflow

### Protocol Mode

1. **Capture guidance** (if no capture yet)
   - Call `suggest_next_step` with `mode=protocol`, `hasCapture=false`
   - Walk through proxy setup using `explain_concept` for tools like "mitmproxy"
   - Guide user to export HAR or capture traffic

2. **Analysis** (when user provides capture)
   - Use `analyze_capture` with the HAR/curl content
   - Findings are automatically stored to the active investigation
   - Explain endpoints and auth patterns at their level

3. **Specification** (after analysis)
   - Offer to generate spec with `build_spec`
   - Choose format based on user's needs (openapi for docs, typescript for code)
   - Spec is saved for future reference

4. **Implementation**
   - Read user's tech stack from response's `userStack` field
   - Suggest implementation approach in their preferred language
   - Help scaffold replacement server if needed

### Feature Mode

1. **Research**
   - Call `suggest_next_step` with `mode=feature`, `hasResearch=false`
   - Use perplexity-search for competitive analysis
   - Break down feature into components

2. **Mapping**
   - Check `userStack` from suggest_next_step response
   - Map feature components to their tech stack
   - Propose implementation approach

### Codebase Mode

1. **Entry point identification**
   - Use `suggest_next_step` with `mode=codebase`
   - Help find main entry points
   - Trace execution flow

2. **Documentation**
   - Build understanding incrementally
   - Store significant discoveries as memories

### Decision Mode

1. **History analysis**
   - Use `suggest_next_step` with `mode=decision`
   - Guide through git blame, commit history
   - Search for related discussions

2. **Hypothesis formation**
   - Propose likely rationale
   - Use perplexity-search for historical context if needed

### Format Mode

1. **Initial analysis**
   - Use `suggest_next_step` with `mode=format`
   - Examine magic numbers with xxd/hexdump
   - Use `explain_concept` for format-specific terms

2. **Structure inference**
   - Look for patterns in hex dump
   - Propose schema based on observations

## Phase 5: Documentation

After each significant discovery:
- Findings are automatically stored to the investigation
- Offer to export spec or summary as markdown
- Remind user they can resume later

## Key Behaviors

- **One question at a time** - Don't overwhelm
- **Adapt to skill level** - Let the tools handle verbosity
- **Explain the why** - Don't just give commands, explain purpose
- **Track progress** - Use todo list for multi-step tasks
- **Offer to pause** - "We can stop here and resume later. Your progress is saved."

## Resuming Investigations

When user says "continue investigation" or "pick up where we left off":

1. The investigation state is persisted in memory
2. Call `suggest_next_step` with the last known mode
3. It will automatically use the investigation's session state
4. Summarize: "Last time we captured traffic and found 3 endpoints. Ready to build the spec?"

## Example Flow

```
User: I want to figure out how this IoT device talks to its cloud

Claude: This sounds like a protocol investigation - we'll capture and analyze
the network traffic. Is that right?

User: Yes

Claude: [Calls suggest_next_step mode=protocol hasCapture=false]
Let's start by capturing the traffic. Here's how to set up mitmproxy...

User: [Provides HAR file]

Claude: [Calls analyze_capture with content]
Great capture! I found 4 endpoints with JWT authentication...
These findings are saved to your investigation. Ready to build an API spec?
```
