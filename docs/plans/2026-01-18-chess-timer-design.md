# Chess Timer: Self-Calibrating Time Estimation for Claude Code

## Summary

Add timing intelligence to the shared-memory plugin. Claude tracks active coding time per feature, learns from historical patterns, and predicts how long similar work will take. The system operates transparently—no user commands required—and grows more accurate with use.

## Goals

1. **Track active coding time** across sessions (not wall clock time)
2. **Predict duration** for new features based on similar past work
3. **Surface insights conversationally** without ceremony
4. **Learn and improve** as usage data accumulates
5. **Stay optional**—disable cleanly if unwanted

## Non-Goals

- Dashboards or visualizations
- Export to external time-tracking systems
- Team or multi-user aggregation
- Historical trend charts

---

## Data Model

Three new tables within shared-memory's SQLite database:

### work_sessions

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| feature_id | string | Branch name or semantic identifier |
| feature_description | text | Claude's summary of the work |
| scope | string | Project scope (matches memory scopes) |
| status | enum | active, paused, completed, abandoned |
| started_at | timestamp | When work began |
| completed_at | timestamp | When work finished (nullable) |
| total_active_seconds | int | Aggregated from segments |
| created_at | timestamp | Record creation |
| updated_at | timestamp | Last modification |

### work_segments

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| session_id | uuid | Foreign key to work_sessions |
| started_at | timestamp | Segment start |
| ended_at | timestamp | Segment end (nullable) |
| trigger_start | string | What initiated this segment |
| trigger_end | string | What concluded it |

### work_metrics

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| session_id | uuid | Foreign key to work_sessions |
| files_touched | int | Number of files modified |
| lines_added | int | Lines inserted |
| lines_removed | int | Lines deleted |
| complexity_rating | int | Claude's 1-5 assessment |
| work_type | enum | feature, bugfix, refactor, docs, other |
| recorded_at | timestamp | When metrics were captured |

### Cross-Plugin Visibility

Sessions also emit memories with tags for other plugins to discover:
- Session start: `[chess-timer, session-start, {work_type}]`
- Session complete: `[chess-timer, session-complete, {work_type}]` with duration in content

---

## MCP Tools

### start_work_session

Begins tracking a new feature.

| Parameter | Required | Description |
|-----------|----------|-------------|
| feature_id | no | Auto-detects from current branch |
| description | no | Claude provides if omitted |
| work_type | no | Inferred from context |

Returns the session object and an estimate if similar work exists.

### pause_work_session

Ends the current segment without completing the session.

| Parameter | Required | Description |
|-----------|----------|-------------|
| session_id | no | Uses active session |
| reason | no | context_switch, break, end_of_day |

### resume_work_session

Continues a paused session by starting a new segment.

| Parameter | Required | Description |
|-----------|----------|-------------|
| session_id | no | Finds paused session for current branch |

### complete_work_session

Finalizes the session, records metrics, emits summary memory.

| Parameter | Required | Description |
|-----------|----------|-------------|
| session_id | no | Uses active session |
| satisfaction | no | 1-5 rating of how it went |
| notes | no | Learnings or blockers encountered |

### get_work_estimate

Predicts duration for upcoming work.

| Parameter | Required | Description |
|-----------|----------|-------------|
| feature_id | no | Specific feature to estimate |
| description | no | For semantic matching |
| work_type | no | Filter to similar work types |

Returns estimate range, confidence level, and similar sessions cited.

### get_active_session

Returns the current active or paused session, if any.

### list_work_sessions

Retrieves session history.

| Parameter | Required | Description |
|-----------|----------|-------------|
| scope | no | Filter by project |
| status | no | Filter by status |
| limit | no | Maximum results |

---

## Automatic Detection

Claude calls timing tools without user prompts. Detection relies on context awareness, not hooks.

### Session Start

Claude recognizes work beginning when:
- First code edit after discussing a new feature
- Switching to a branch with no active session
- User says "let's build X" or "fix Y"
- Brainstorming skill completes and implementation begins

Claude calls `start_work_session` and mentions the estimate naturally:

> "This feels similar to the notification system we built last week—that took about 25 minutes."

### Segment Pause

Claude infers a pause when:
- Conversation ends or times out
- Context switches to unrelated work
- User indicates a break ("pick this up tomorrow")

Claude calls `pause_work_session` silently.

### Session Resume

Claude recognizes continuation when:
- Same branch, related discussion resumes
- User references the paused work
- Semantic match to an existing paused session

Claude calls `resume_work_session` and optionally notes progress:

> "Picking up where we left off—12 minutes so far."

### Session Complete

Definitive signals trigger completion:
- PR created via `gh pr create`
- User says "ship it", "done", "looks good"
- Branch merged

Claude calls `complete_work_session` and surfaces a summary:

> "That took 18 minutes across 2 sessions—about 20% faster than similar refactors."

---

## Prediction Engine

### Finding Similar Sessions

When generating an estimate, the system matches by:
- Same work type (feature, bugfix, refactor)
- Similar complexity rating (within ±1)
- Overlapping file patterns (same codebase areas)
- Semantic similarity in descriptions

Recent sessions (last 30 days) receive higher weight.

### Confidence Calculation

Sample count determines confidence:

| Samples | Confidence | Estimate Style |
|---------|------------|----------------|
| < 5 | Low | "Hard to say—this is new territory" |
| 5-15 | Medium | "Similar work has taken 10-40 minutes" |
| 15+ | High | "This usually takes about 20 minutes" |

### Learning Dimensions

The system tracks patterns over time:
- Speed by work type (faster at bugfixes than refactors?)
- Complexity correlation (does rated complexity predict time?)
- Codebase familiarity (files touched often = faster)
- Optional: time-of-day patterns

---

## Skill Integration

### New Skill: chess-timer:status

Quick check on:
- Active session state
- Recent session stats
- Prediction accuracy over time

### Modified Skills

**superpowers:brainstorming** — When transitioning to implementation, calls `start_work_session` for the designed feature.

**superpowers:finishing-a-development-branch** — When creating a PR, calls `complete_work_session` and includes timing in the PR description.

---

## Configuration

Settings live within shared-memory's configuration:

```json
{
  "chess_timer": {
    "enabled": true,
    "auto_detect": true,
    "include_in_pr_description": true,
    "verbosity": "normal"
  }
}
```

| Setting | Default | Description |
|---------|---------|-------------|
| enabled | true | Master switch for all timing features |
| auto_detect | true | Infer session state automatically |
| include_in_pr_description | true | Add timing summary to PRs |
| verbosity | normal | quiet, normal, or verbose |

Setting `enabled: false` disables all timing code. Shared-memory works exactly as before.

---

## Implementation Scope

### Build

1. **Database migrations** — Add three tables, run automatically on plugin start
2. **MCP tools** — Seven new tools in shared-memory
3. **Prediction engine** — `src/chess-timer/predictor.ts`
4. **Detection logic** — Claude uses tools intelligently; skills call timing at transitions
5. **Status skill** — `skills/chess-timer-status.md`
6. **Configuration schema** — Feature flags for opt-out

### Skip (YAGNI)

- Dashboards
- External integrations
- Team features
- Trend visualizations

These can come later if proven valuable.

---

## Open Questions

1. **Branch rename handling** — If a branch is renamed mid-work, how do we maintain session continuity?
2. **Multiple parallel features** — Can a user work on two features simultaneously? Probably allow it but default to "most recent" when ambiguous.
3. **Retroactive logging** — If someone forgets to start, can they backfill? Leaning no—keep it simple.
