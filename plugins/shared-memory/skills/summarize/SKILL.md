---
name: summarize
description: "Manually trigger an activity summary for a scope. Use when you want to capture and store a summary of recent activity."
user-invokable: true
allowed-tools:
  - mcp__shared-memory__trigger_summary
  - mcp__shared-memory__get_activity_summaries
  - mcp__shared-memory__get_memory_timeline
---

# Summarize Activity

This skill allows you to manually trigger an activity summary for any scope.

## Usage

When invoked with `/summarize`, you should:

1. **Determine the scope** - Ask the user or infer from context:
   - `global` - All activity across projects
   - `project:<name>` - Activity specific to a project

2. **Trigger the summary** using `trigger_summary`:
   ```
   tool: trigger_summary
   scope: "project:brain-jar"  // or "global"
   ```

3. **Report the result** - Show the user what was summarized:
   - Period covered
   - Number of memories included
   - Key themes/tags
   - Top items

## Examples

**User:** `/summarize`
**Response:** "What scope would you like to summarize? I can summarize all activity (global) or a specific project."

**User:** `/summarize project:brain-jar`
**Response:** Immediately trigger summary for that scope and report results.

## When Summaries Are Automatically Generated

Summaries are also generated automatically when:
- 12+ memories are added to a scope (and at least 24h since last summary)
- 1 week passes with any activity in a scope

Use `/summarize` to force a summary at any time, regardless of these thresholds.

## Related Tools

- `get_activity_summaries` - View past summaries
- `get_memory_timeline` - See memories grouped by time period
