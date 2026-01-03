# brain-jar 🧠🫙

Claude Code plugins for enhanced agent memory and search.

## Plugins

| Plugin | Version | Description |
|--------|---------|-------------|
| [perplexity-search](./plugins/perplexity-search/README.md) | 2.0.0 | Web search via Perplexity AI with smart context detection |
| [shared-memory](./plugins/shared-memory/README.md) | 2.0.0 | Persistent memory with semantic search, user profiles, and auto-summaries |
| [forensics](./plugins/forensics/skills/investigate/SKILL.md) | 0.2.0 | Reverse engineer black-box systems: APIs, protocols, features |

### v2.0.0 highlights

**@brain-jar/core** - New shared package with unified types, Mem0 client, and config utilities. Both plugins now share the same UserProfile schema and Mem0 integration.

**shared-memory**
- Types extracted to `@brain-jar/core` for cross-plugin consistency
- Profile sync with Mem0 using `infer: false` for raw JSON storage

**perplexity-search**
- Now uses shared `@brain-jar/core` profile schema
- Mem0 integration for search history context (stores results, retrieves relevant past searches)
- Reads profile from shared brain-jar location (`~/.config/brain-jar/user-profile.json`)

### forensics highlights (v0.2.0)

- **@brain-jar/core integration** - Persistent investigation state via Mem0
- **Investigation management** - `start_investigation`, `list_investigations`, `get_investigation` tools
- **build_spec tool** - Generate OpenAPI or TypeScript client from captured endpoints
- **Skill-level adaptation** - Tools auto-adapt verbosity based on user profile
- **Concept tracking** - Skip explanations for previously learned concepts

## Installation

Add this repository as a marketplace in Claude Code:

```
/plugin
→ Add Marketplace
→ designnotdrum/brain-jar
```

Then install individual plugins:

```
/plugin
→ brain-jar
→ Select plugin to install
```

## Architecture

Each plugin is self-contained under `plugins/`:

```
brain-jar/
├── .claude-plugin/
│   └── marketplace.json      # Registry manifest
├── plugins/
│   ├── perplexity-search/    # Web search plugin
│   ├── shared-memory/        # Memory plugin
│   └── forensics/            # Reverse engineering plugin
└── README.md
```

## License

MIT
