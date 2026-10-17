# Commands

All commands live under the **BitVanes** category in the Command Palette.

| Command | ID | Description |
|---|---|---|
| Instant Walkthrough of Changes (No AI) | `bitvanes.walkthroughInstant` | Sub-second local walkthrough built from AST analysis — no model, works offline |
| Walkthrough Working Tree Changes | `bitvanes.walkthroughDiff` | Generate a walkthrough of unstaged changes, including brand-new untracked files |
| Walkthrough Staged Changes | `bitvanes.walkthroughStagedDiff` | Generate a walkthrough of staged changes (also in the Source Control title menu) |
| Walkthrough Code Path at Cursor | `bitvanes.walkthroughSelection` | Trace the function/block under the cursor or the active selection (also in the editor context menu) |
| Next Step | `bitvanes.nextStep` | Advance; `alt+]` anywhere, bare `]` when focus is outside the editor and terminal |
| Previous Step | `bitvanes.prevStep` | Go back; `alt+[` anywhere, bare `[` when focus is outside the editor and terminal |
| Jump to Step | `bitvanes.jumpToStep` | Used internally by the sidebar step list |
| Browse Steps & Explanations | `bitvanes.explainStep` | QuickPick browser over all steps with full narratives |
| Toggle Autoplay | `bitvanes.toggleAutoplay` | Start/stop auto-advancing playback (doesn't steal focus) |
| Exit Walkthrough | `bitvanes.exitWalkthrough` | Clear decorations and end the session (`Esc` from the editor, or the ✕ status-bar item) |
| Set Walkthrough Style | `bitvanes.setStyle` | Pick the audience — Expert / Standard / Learner — for AI walkthrough explanations |
| Set API Key for External LLM Provider | `bitvanes.setApiKey` | Store a provider key in SecretStorage and point the config at it |
| Delete Stored API Key | `bitvanes.clearApiKey` | Remove a stored key |
| Export Walkthrough Plan as JSON | `bitvanes.exportPlan` | Save the current walkthrough (steps, ranges, variable transitions, security notes) as JSON for scripts and agents |

## Deep links (no palette needed)

Terminals, hooks and coding agents can start walkthroughs without the
palette:

```
code --open-url "vscode://bitvanes.bitvanes/walkthrough?scope=working-tree"
```

`scope` is one of `working-tree`, `staged`, `instant`; an optional `style`
(`expert`/`standard`/`learner`) overrides the audience for that run only.
See [Agents & automation](/guide/agents) for hook snippets and the exported
plan format.
