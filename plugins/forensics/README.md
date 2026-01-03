# forensics

**Reverse engineer anything.**

Some APIs don't have documentation. Some protocols are proprietary. Some codebases are mysteries. Forensics guides you through the detective work—capturing traffic, analyzing patterns, and building specs from observations.

## The Problem

You need to understand a system that won't explain itself:
- An IoT device talks to a cloud API—but which endpoints? What auth?
- A competitor's feature "just works"—how do they do it?
- A binary file has structure—but what structure?
- Legacy code makes decisions—but why?

You could fumble through mitmproxy docs and hex editors. Or you could have a guide.

## The Solution

Forensics is a structured reverse engineering workflow:

1. **Start an investigation** — Define what you're analyzing
2. **Capture data** — Traffic, code, or raw bytes
3. **Analyze patterns** — Claude extracts endpoints, auth, schemas
4. **Build artifacts** — OpenAPI specs, TypeScript clients, documentation
5. **Resume anytime** — Investigations persist across sessions

## What Changes

| Before | After |
|--------|-------|
| "How do I set up a proxy?" | Step-by-step guidance at your level |
| Manually parse HAR files | `analyze_capture` extracts everything |
| Notes scattered across sessions | Investigation state persists in memory |
| Write API clients from scratch | `build_spec` generates OpenAPI or TypeScript |

## Quick Start

```bash
# Install from brain-jar marketplace
/plugin → brain-jar → forensics

# Start an investigation
/investigate
```

## Tools

### Investigation Management
| Tool | Purpose |
|------|---------|
| `start_investigation` | Begin a new investigation |
| `list_investigations` | See all investigations (active, paused, complete) |
| `get_investigation` | Get details of current investigation |

### Analysis
| Tool | Purpose |
|------|---------|
| `analyze_capture` | Parse HAR/curl output, extract endpoints and auth |
| `explain_concept` | Learn about tools and techniques at your level |
| `suggest_next_step` | Get context-aware guidance on what to do next |
| `build_spec` | Generate OpenAPI or TypeScript from findings |

## Skill

### `/investigate`

Guided workflow for any reverse engineering task:

1. **Intake** — Describe what you're investigating
2. **Mode selection** — Protocol, feature, codebase, decision, or format
3. **Skill calibration** — Beginner gets detailed commands; experts get terse guidance
4. **Step-by-step guidance** — Tools and techniques for your specific investigation
5. **Documentation** — Findings persist for future sessions

## Investigation Modes

### Protocol Mode
*"What API is this device using?"*

Capture network traffic → Analyze endpoints → Build spec → Implement replacement

### Feature Mode
*"How does Notion's real-time sync work?"*

Research patterns → Break down components → Map to your stack

### Codebase Mode
*"What does this legacy system actually do?"*

Find entry points → Trace execution → Document architecture

### Decision Mode
*"Why was it built this way?"*

Analyze git history → Find discussions → Form hypotheses

### Format Mode
*"What's in this binary blob?"*

Examine bytes → Find patterns → Propose schema

## How It Works

```
┌─────────────────────────────────────────────────────┐
│           /investigate                              │
│   "I want to reverse engineer a smart lock's API"   │
└─────────────────────────────┬───────────────────────┘
                              ↓
              ┌───────────────────────────────┐
              │    Mode: Protocol             │
              │    Target: Smart Lock API     │
              │    Skill Level: (from profile)│
              └───────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────┐
│  1. suggest_next_step → "Set up mitmproxy"          │
│  2. explain_concept("mitmproxy") → How-to guide     │
│  3. [You capture traffic]                           │
│  4. analyze_capture → 4 endpoints, JWT auth         │
│  5. build_spec → OpenAPI 3.0 spec                   │
└─────────────────────────────────────────────────────┘
                              ↓
              ┌───────────────────────────────┐
              │   Investigation saved to Mem0 │
              │   Resume anytime with context │
              └───────────────────────────────┘
```

## Skill-Level Adaptation

The plugin reads your profile to calibrate explanations:

**Beginner:**
```
Next step: Capture network traffic

Commands:
- `mitmproxy -p 8080` — Start proxy on port 8080
- Configure device to use proxy at your-ip:8080

Tips:
- Make sure device and computer are on same network
- You may need to install mitmproxy's CA certificate
```

**Advanced:**
```
Next step: Capture traffic via mitmproxy on :8080
```

## Integration with brain-jar

When shared-memory is installed:
- Investigations persist across sessions
- Concepts you've learned are tracked (no repeat explanations)
- Skill level inferred from your profile
- Findings stored for future reference

## Example: IoT Device API

```
> /investigate

Claude: What are we investigating today?

> My smart thermostat talks to a cloud API. I want to control it locally.

Claude: This is a protocol investigation. Let's capture the traffic.
        First, set up mitmproxy as a transparent proxy...

[You capture traffic, paste HAR file]

Claude: Found 6 endpoints with Bearer token auth:
        - GET /api/v1/devices
        - GET /api/v1/devices/{id}/status
        - POST /api/v1/devices/{id}/setpoint
        ...

        Want me to generate an OpenAPI spec?

> Yes, and a TypeScript client

Claude: [Generates both, saves to investigation]
        Your thermostat API is now documented.
```

## Requirements

- Claude Code CLI
- Node.js 18+
- Optional: Mem0 API key (for investigation persistence)

## License

MIT
