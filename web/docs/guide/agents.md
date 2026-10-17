# Agents & automation

BitVanes can be started from outside VS Code — from a terminal, a shell
script, a git hook, or the agent you use to write code. When your agent
finishes a change, have it drop you straight into a guided tour of its own
diff.

## Deep links

Every link follows the form:

```
vscode://bitvanes.bitvanes/walkthrough?scope=<scope>&style=<style>
```

| Parameter | Values | Notes |
|---|---|---|
| `scope` (required) | `working-tree` · `staged` · `instant` | `instant` builds the tour locally with no model — sub-second, offline |
| `style` (optional) | `expert` · `standard` · `learner` | Overrides your configured walkthrough style for this run only; settings are untouched |

Open one from anywhere the `code` CLI is available:

```bash
code --open-url "vscode://bitvanes.bitvanes/walkthrough?scope=working-tree&style=expert"
```

Unknown or missing parameters are rejected with a message — nothing runs by
accident, and no state is modified just by opening a link.

## Wire it into your agent

The universal version: tell your agent to run the command when it finishes
editing. Add this to your repository's `AGENTS.md`, `CLAUDE.md`, or rules
file:

```md
## After finishing a coding task

Run this so I can review your changes as a guided tour:

    code --open-url "vscode://bitvanes.bitvanes/walkthrough?scope=working-tree"

If the change is small, use `scope=instant` instead (no model needed).
```

### Claude Code

A `PostToolUse` hook in `.claude/settings.json` can prompt the tour after
each Edit/Write batch — or keep it manual with the instruction above:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "code --open-url 'vscode://bitvanes.bitvanes/walkthrough?scope=working-tree'" }]
      }
    ]
  }
}
```

### Cursor

Add the one-liner to `.cursor/rules/bitvanes.mdc` as an "always" rule so the
agent offers a tour when it completes a task.

### Any other agent or CI

Anything that can execute a shell command can open a tour: pre-push hooks,
`make review`, or a post-job step in CI that pings your editor. If `code`
isn't on `PATH` (remote/SSH, containers), substitute your environment's
equivalent (e.g. `code-server --open-url`).

## Exporting the plan

Walkthrough plans are structured data. Run **BitVanes: Export Walkthrough
Plan as JSON** (`bitvanes.exportPlan`) to save the current plan — steps,
exact ranges, variable transitions, and security notes — as a JSON file
shaped `{ kind: "bitvanes.walkthroughPlan", version: 1, exportedAt, plan }`.
Scripts and agents can consume it for summaries, audit trails, or diffs of
reviews over time.

## Security notes

- Deep-link input is strictly validated (known authority, path, scope and
  style only); unknown values are rejected, unknown parameters ignored.
- Opening a link never writes files or changes settings — it only starts the
  same pipeline the Command Palette runs, with the model provider you already
  configured. All the guarantees from the
  [security model](https://github.com/kodr-pro/BitVanes#security-model) in the
  README apply unchanged.
- Your browser or OS will ask for confirmation the first time a `vscode://`
  link is opened from an untrusted source.
