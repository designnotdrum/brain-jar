# visual-thinking

**Diagrams that remember.**

Ideas scatter across sessions. Architecture decisions live only in your head. That flowchart from last week? Gone. Visual-thinking captures diagrams during conversations, stores them with context, and lets you pick up right where you left off.

## The Problem

Visual thinking doesn't persist:
- Mermaid diagrams in chat disappear when the session ends
- Architecture sketches get lost between projects
- No way to build on yesterday's brainstorming
- Explaining the same system architecture over and over

## The Solution

Visual-thinking does three things:

1. **Capture** — Create Mermaid diagrams during conversations with rich context
2. **Persist** — Store diagrams locally (and in Mem0 for cross-machine sync)
3. **Resume** — Load diagrams in future sessions, modify them, track changes

## What Changes

| Before | After |
|--------|-------|
| Diagrams vanish when session ends | Every diagram saved with context |
| "Draw that architecture again" | Load and continue from last time |
| No version history | Automatic version tracking |
| Can't search old diagrams | Find by title, content, or context |

## Quick Start

```bash
# Install from brain-jar marketplace
/plugin → brain-jar → visual-thinking

# Start capturing
/visual-thinking:capture
```

## Tools

| Tool | Purpose |
|------|---------|
| `create_diagram` | Create a new Mermaid diagram with context |
| `list_diagrams` | Show saved diagrams with metadata |
| `get_diagram` | Load a diagram for viewing or editing |
| `update_diagram` | Modify a diagram (tracks version history) |
| `delete_diagram` | Remove a diagram |
| `search_diagrams` | Find diagrams by text in title/context/content |
| `export_diagram` | Export to Mermaid, SVG, or draw.io format |
| `setup_brainstorm_integration` | Install hookify rule for auto-diagram prompts |

## Skills

### `/visual-thinking:capture`

Capture complex ideas as diagrams during conversations:
- Automatically chooses diagram type (mindmap, flowchart, sequence, etc.)
- Adds rich context explaining what the diagram represents
- Stores persistently for future sessions

### `/visual-thinking:continue-diagram`

Continue working on existing diagrams:
- Find diagrams by title or search
- View current state and version history
- Modify and track changes over time

### `/visual-thinking:setup-brainstorm-integration`

Install automatic diagram prompts:
- Adds hookify rule to detect design discussions
- Claude offers to create diagrams when relevant
- One-time setup, persists across sessions

## Diagram Types

| Type | Use For |
|------|---------|
| mindmap | Brainstorming, exploring ideas |
| flowchart | Processes with decision points |
| sequence | Interactions over time |
| architecture | System components (uses flowchart) |
| erd | Data models and relationships |
| classDiagram | Object relationships |
| stateDiagram | State transitions |
| gantt | Project timelines |

## How It Works

```
┌─────────────────────────────────────────────────────┐
│           Conversation                               │
│   "Let me sketch out the architecture..."           │
└─────────────────────────┬───────────────────────────┘
                          ↓
              ┌────────────────────────┐
              │    create_diagram      │
              │  + Title & context     │
              │  + Mermaid syntax      │
              │  + Scope & tags        │
              └────────────────────────┘
                          ↓
              ┌────────────────────────┐
              │    Local SQLite        │
              │  + Version history     │
              └────────────────────────┘
                          ↓
              ┌────────────────────────┐
              │    Mem0 (optional)     │
              │  + Cross-machine sync  │
              └────────────────────────┘
```

## Automatic Diagram Suggestions

Visual-thinking can prompt you to create diagrams when you discuss architecture, workflows, data models, and other visual topics.

### Setup

Use the `setup_brainstorm_integration` tool to install a hookify rule:

```
# Install the hookify rule
setup_brainstorm_integration action: "install"

# Check if installed
setup_brainstorm_integration action: "status"

# Remove when no longer wanted
setup_brainstorm_integration action: "uninstall"
```

Or use the skill:
```
/visual-thinking:setup-brainstorm-integration
```

### How It Works

After installation, when you mention keywords like:
- Architecture, workflow, data flow
- User journey, state machine
- Data model, ERD, schema
- Wireframe, mockup, diagram

Claude will offer to capture your ideas as a diagram:

> "Want me to create a diagram for this? I can make a flowchart and open it in draw.io for you to edit."

The rule is stored at `~/.claude/hookify.visual-thinking-brainstorm.local.md`. To temporarily disable it, edit the file and set `enabled: false`.

## Integration with brain-jar

When shared-memory is installed:
- Diagram metadata syncs to Mem0 for cloud persistence
- Diagrams can reference and be referenced by memories
- Profile context can inform diagram creation

When perplexity-search is installed:
- Research can inform diagram content
- Diagrams can reference external sources

## Export Options

**Mermaid (.mmd):**
Native format with embedded metadata comments

**SVG:**
Requires Mermaid CLI (`npm install -g @mermaid-js/mermaid-cli`)

**draw.io:**
For rich editing, use the [drawio-mcp-server](https://github.com/lgazo/drawio-mcp-server)

## Requirements

- Claude Code CLI
- Node.js 18+
- Optional: Mem0 API key (for cross-machine sync via shared-memory)

## License

MIT
