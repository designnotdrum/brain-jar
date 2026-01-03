---
name: release
description: Build, bump version, commit, and push a brain-jar plugin release. Usage: /release <plugin-name> <patch|minor|major> [message]
user-invocable: true
---

# Release Skill for brain-jar Plugins

Automates the full release cycle for a brain-jar plugin:
1. Build and typecheck
2. Bump version using semver
3. Update all version references
4. Commit with standard message
5. Push to remote

## Usage

```
/release shared-memory patch "fix dependency issue"
/release shared-memory minor "add new feature"
/release perplexity-search major "breaking API change"
```

## Procedure

### 1. Parse Arguments

Extract from the user's command:
- `plugin`: The plugin name (e.g., `shared-memory`, `perplexity-search`)
- `bump`: Version bump type (`patch`, `minor`, or `major`)
- `message`: Optional commit message description

### 2. Validate Plugin Exists

Check that `plugins/<plugin>/package.json` exists. If not, error out.

### 3. Build and Typecheck

```bash
cd plugins/<plugin>
npm run build
npm run typecheck
```

If either fails, stop and report the error.

### 4. Calculate New Version

Read current version from `plugins/<plugin>/package.json`.

Apply semver bump:
- `patch`: 1.2.3 -> 1.2.4
- `minor`: 1.2.3 -> 1.3.0
- `major`: 1.2.3 -> 2.0.0

### 5. Update All Version References

Update these files with the new version (same commit):

1. `plugins/<plugin>/package.json` - `"version": "X.Y.Z"`
2. `plugins/<plugin>/.claude-plugin/plugin.json` - `"version": "X.Y.Z"`
3. `plugins/<plugin>/src/index.ts` - `version: 'X.Y.Z'` in McpServer config
4. `.claude-plugin/marketplace.json` - version for this plugin
5. `README.md` - version in plugins table and highlights section

### 6. Rebuild After Version Update

```bash
cd plugins/<plugin>
npm run build
```

This ensures dist/ has the updated version.

### 7. Stage and Commit

```bash
git add -A
git commit -m "<type>(<plugin>): <message>

<longer description if needed>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

Commit type based on bump:
- `patch` -> `fix`
- `minor` -> `feat`
- `major` -> `feat!` (breaking)

### 8. Push

```bash
git push
```

### 9. Report Success

Output:
- Old version -> New version
- Files updated
- Commit hash
- Remote push status

## Example Output

```
Released shared-memory v1.3.2 -> v1.4.0

Updated files:
  - plugins/shared-memory/package.json
  - plugins/shared-memory/.claude-plugin/plugin.json
  - plugins/shared-memory/src/index.ts
  - .claude-plugin/marketplace.json
  - README.md

Commit: abc123f
Pushed to origin/main
```
