# Changelog

All notable changes to BitVanes are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[SemVer](https://semver.org/).

## [1.0.5] — 2026-11-14

Security-and-supportability patch: dependency advisories cleared end to end,
Node 24 everywhere, a real log channel for failures, and the Marketplace
publish path retired. No walkthrough behavior changes.

### Security
- `qs` upgraded to 6.17.0 (moderate DoS advisory against 6.16.0; transitive
  via the packaging chain).
- npm override pins `@azure/msal-node` to `^7.1.0` (resolves 7.1.1):
  `@vscode/vsce` 4.x still pulls the vulnerable 6.0.1 line through
  `@azure/identity`. Dev-only chain — msal-node executes only in vsce's AAD
  publish flow, which this repo does not use; `vsce package` verified
  working under 7.1.1.
- npm override pins `minimatch` to `^11.0.1` (GHSA-g3hv-75wg-m249, moderate
  DoS via globparts amplification). The single hoisted 10.2.6 copy flagged
  the whole dev chain: typescript-eslint ≤ 8.72.2 (typescript-estree) and
  `@vscode/vsce` ≥ 3.9.2 / `ovsx`. No stable typescript-eslint past 8.72.2
  exists yet and vsce 4.1.1 still declares `^10.2.6`, so an override is the
  only path to a clean audit today; lint, tests and `vsce package` verified
  on 11.0.8. Root `npm audit`: 0 vulnerabilities.

### Added
- **"BitVanes" output channel** — timestamped, one line per failure:
  model/provider errors (per-provider generation failures, the Copilot
  model probe, welcome-screen status), every `git` failure (timeout, spawn
  error, non-zero exit — logged once at the choke point, warn level since
  several callers fall back on purpose), and tree-sitter parser/grammar
  failures. Error toasts keep their message and gain a **Show Log** action
  that reveals the channel; model-setup errors keep their "Set up a model"
  action alongside it. Expected user states (no changes, not a repo) stay
  toast-only.

### Changed
- **Open VSX is the only store.** The VS Code Marketplace publish step
  (`VSCE_PAT`) is removed from the release workflow — the listing was never
  actually submitted (the token was never set, so the step always skipped)
  and the "pending Microsoft review" wording in the README and this
  changelog was wrong and is gone. `vsce package` stays for building the
  release VSIX.
- **Node 24 consolidation:** CI and the web build run on Node 24
  (`.nvmrc`), and `engines.node` rises to `>=22` — Node 20 is EOL and
  dropped from the support floor.
- Website toolchain: vitepress 2 (vite 8) for the docs site, clearing the
  vite ≤ 6.4.3 path-traversal and esbuild/source-map-js advisories in
  `web/` (docs build only; nothing from `web/` ships in the extension).
  `web/ npm audit`: 0 vulnerabilities.

### Fixed
- Vitest no longer prints the `configLoader: 'native'` warning on every
  run: the config is now `vitest.config.mts`, so Vite's native loader reads
  it as ESM (native loading is slated to become Vite's default).

## [1.0.4] — 2026-10-22

Listing-hygiene release — no runtime changes.

### Changed
- Categories corrected to `Education` and `Visualization`. The previous set
  (`Programming Languages`, `Machine Learning`, `Chat`, `SCM Providers`)
  described browse shelves for extensions that provide language support,
  ML-development tooling, chat participants, or SCM backends — none of
  which BitVanes does. Search is unaffected (keywords drive it); categories
  only place the extension on the shelves its audience actually visits.
- Install section: Open VSX presented as the registry BitVanes publishes to
  (the Marketplace entry never existed — see the 1.0.2 correction and the
  1.0.5 removal of the publish step).

### Fixed
- NOTICE now attributes the vendored tree-sitter WebAssembly binaries
  (core runtime via `web-tree-sitter`, grammars via `tree-sitter-wasms`)
  to their upstream projects and licenses, as redistribution requires.

## [1.0.3] — 2026-10-18

The "walk the commit" release: tours of committed work, a welcome screen
that tells you whether a model is ready, and guards that keep running tours
honest. No breaking changes — every addition is additive.

### Added
- **Walkthrough Last Commit…** (`bitvanes.walkthroughCommit`): pick one of
  the last 20 commits (subject, author, date) and tour everything it
  introduced, diffed against its first parent — the root commit included
  (shown as whole-file additions). Also a start button on the welcome
  screen, where it walks HEAD directly. The Files tab, per-file coverage and
  the multi-file prompt contract all work for commit tours exactly as they
  do for pending changes.
- **Deep-link scope `commit`:**
  `vscode://bitvanes.bitvanes/walkthrough?scope=commit` walks HEAD — the
  natural post-commit hook for agents (`style=` override still applies).
  Validation stays strict: the scope is enum-checked like the others, and
  no new parameters are accepted.
- **Model readiness on the welcome screen:** a status card shows what will
  serve AI walkthroughs right now — VS Code Copilot, the configured
  endpoint, or an auto-detected local server (Ollama / LM Studio / vLLM) —
  with a Set-up/Change button that opens the provider flow. Probes are
  cached and refresh only when `bitvanes.llm` settings change; they never
  run per render.
- **"Set up a model" action button** on no-model errors: the dead-end
  "No language model configured" failure now routes straight into
  `bitvanes.setApiKey` instead of leaving new users to find it themselves.
- **Stale-tour guard:** if a file in the running walkthrough is edited
  mid-tour, BitVanes notices and offers **Regenerate** (one prompt per
  tour, re-runs the same scope). Decorations already track live edits;
  this keeps re-jumps and the plan honest after the code drifts.
- Exported plan JSON gains optional provenance fields — `provider`,
  `style`, `generatedAt` — alongside the export timestamp. Payloads stay
  `bitvanes.walkthroughPlan` v1; older readers ignore the new keys.

### Fixed
- **Multi-root workspaces resolve diffs against the wrong folder.** The
  workspace root was always the first folder in the list; it now prefers
  the folder containing the active editor, falling back to the first.
- Escape now exits the walkthrough from the BitVanes sidebar (previously
  it only worked while an editor had focus).

### Changed
- The status-bar counter shows the file position on multi-file tours
  (`BitVanes 3/12 · 2/5 files`), so you always know which file you are in.
- The model prompt names the walked commit (short hash + subject) on
  commit tours, so the narrative frames the change as committed work.

### Notes
- Commit walkthroughs read file content from the working tree (new-side
  line numbers come from the commit). Right after committing — the
  dominant flow — the two are identical; on older commits whose files have
  since changed, ranges land on the nearest statement rather than the
  exact original line.

## [1.0.2] — 2026-10-17

The multi-file release: change-set walkthroughs now cover every changed
file, the new Files tab lets you see — and walk — each one, and BitVanes
tours can now be started by whatever — or whoever — wrote the code.

### Fixed
- **Multi-file diffs and staged changes were walked as a single file.** The
  model contract asked for one execution path, so tours of a staged change
  set concentrated all steps on the largest file and silently skipped the
  rest. The prompt now requires every included file to appear in at least
  one step, ordered file by file, with per-file execution order — and says
  so only when more than one file is actually in context.
- Per-file coverage is now honest end to end: files beyond the prompt
  budget are reported rather than implied.

### Added
- **Files tab** in the BitVanes view: every changed/staged file in the
  walkthrough with its git status, changed-line count, per-file step
  progress, and click-to-jump to that file's steps. The step list is
  grouped by file so transitions are visible as you walk.
- **Per-file walkthrough** (`bitvanes.walkthroughFile`): pick one changed
  file — from the Files tab ("walk this file") or the command palette —
  and get a full-depth tour of just that file's pending changes (staged +
  unstaged together, versus HEAD). Untracked files are walked as whole-file
  additions.
- `WalkthroughPlan.files` metadata in exported plan JSON (v1 payloads gain
  an optional `files` array; older payloads remain valid).
- **Deep links for agents, terminals and hooks:**
  `vscode://bitvanes.bitvanes/walkthrough?scope=working-tree|staged|instant`
  starts a tour via `code --open-url` from any shell, git hook, or coding
  agent, with an optional `style=expert|standard|learner` override for that
  run only. Links are strictly validated (unknown paths, authorities, scopes
  and styles are rejected) and open no new network surface — see the new
  [Agents & automation](https://bitvanes.com/guide/agents) guide for hook
  snippets for Claude Code, Cursor and AGENTS.md-driven agents.
- **Export Walkthrough Plan as JSON** (`bitvanes.exportPlan`): saves the
  current plan — steps, exact ranges, variable transitions, security notes —
  as `bitvanes.walkthroughPlan` v1 JSON for scripts, audits and agents.
- **Issue & PR templates and a CONTRIBUTING guide.**
- `npm run test:coverage` (adds `@vitest/coverage-v8` as a dev dependency).

### Changed
- Refreshed sidebar UI: compact brand header replaces the tagline hero,
  clearer start actions, and a segmented Tour/Files tab strip. Tagline
  removed — you know why you installed it.
- Tag releases now emit a visible GitHub Actions warning when `OVSX_PAT` or
  `VSCE_PAT` is unset, instead of silently skipping that registry publish.
- A second walkthrough request while one is already generating is declined
  with a notice instead of racing the first (this also guards deep links).
- Development dependency `@vscode/vsce` upgraded to 4.x, dropping the
  vulnerable `secretlint → globby → braces` chain (CVE-2026-93687 — every
  published `braces` is affected, so no in-place upgrade existed) from the
  packaging toolchain. `npm audit` is clean.

### Notes
- Numbered 1.0.2, not 1.1.0: the 1.1.0 work was never published — the
  Marketplace and Open VSX listings still serve 1.0.1 — so this release
  combines it with the multi-file work as the true successor to 1.0.1.
- One-time ask: after the third completed walkthrough, BitVanes requests an
  Open VSX review once — ever — and never again. It is a local counter in
  extension state; BitVanes still has zero telemetry.
- Marketplace correction: the v1.0.1 release run shows `VSCE_PAT` was never
  set, so the Marketplace publish step always skipped — no listing was ever
  submitted, and earlier "pending review" notes were wrong. The step (and
  its secret) were removed entirely in 1.0.5; Open VSX is the only store.
- Release artifacts up to and including 1.0.0 were published under BitVanes'
  earlier proprietary license; 1.0.1 and later are Apache-2.0.

## [1.0.1] — 2026-10-16

### Changed
- Install docs lead with Open VSX
  (https://open-vsx.org/extension/bitvanes/bitvanes); the docs' claim of a
  Marketplace listing under review was never true (see the correction in
  the 1.0.2 notes — the publish token was never set, and the step was
  removed in 1.0.5). The docs note that GitHub Copilot as the default
  model requires a Marketplace-published install.
- Tag releases publish the VSIX to Open VSX (`ovsx`, secret `OVSX_PAT`);
  the publish step skips when the secret is unset. (A Marketplace publish
  step existed in this release but never ran — removed in 1.0.5.)
- Relicensed under the Apache License 2.0. Copyright holder is kodr-pro.

### Removed
- The `dependency-review` CI job. This repository does not enable GitHub's
  dependency graph, so that check could not run.

## [1.0.0] — 2026-10-15

First stable release. The 0.x line converged on line-accurate walkthroughs,
a hardened security model, and instant offline tours; 1.0.0 has no feature
changes since 0.5.0. The extension is listed on Open VSX. (The release
notes claimed a Marketplace listing was submitted and awaiting review —
that was never true; see the 1.0.2 correction.)

### Added
- Open VSX listing — search "BitVanes", or install from
  https://open-vsx.org/extension/bitvanes/bitvanes
- Note on model providers: the VS Code Language Model API only serves
  Marketplace-published extensions and Extension Development Host
  sessions, so Open VSX and VSIX installs use a configured endpoint
  instead of the default GitHub Copilot provider.

### Changed
- Repository relocated to `kodr-pro/BitVanes`; repository, issues, releases,
  and website links updated accordingly.
- Node engine floor raised to `>=20.3.0`, matching the `AbortSignal.any`
  requirement of the LLM request plumbing (VS Code 1.95 ships Node 20.18,
  so no user is affected).
- The production bundle now ships a source map, and the `copilot` keyword
  was dropped from package metadata, to satisfy the Marketplace's
  suspicious-content validation on first publish.

## [0.5.0] — 2026-09-16

The "lands on the right line" release: a full audit of the range pipeline
(model output → validation → AST snap → editor decoration), a security
pass, and untracked-file support.

### Fixed — walkthrough accuracy
- **0-based/1-based repair no longer shifts correct lines.** A model that
  emitted 1-based lines with 0-based columns (a common confusion) silently
  moved every step down one line; now only line coordinates are normalized
  and columns are clamped independently.
- **Multi-line steps no longer drop their last line.** An omitted `endCol`
  now means "to end of line" instead of column 1, and single-line steps
  always keep a visible minimum width.
- **Diff paths with spaces or non-ASCII characters parse correctly.** git
  marks space-containing paths with a trailing TAB and quotes non-ASCII
  paths with octal escapes; both forms (and quoted renames) are now decoded
  instead of silently skipping those files.
- **Workspaces opened in a repository subfolder resolve paths correctly**
  (paths are resolved against the true `git rev-parse --show-toplevel`
  root, not the workspace folder).
- The dim-above decoration no longer dims the spotlight's first line.
- Prompt wording now matches the actual coordinate semantics (`endCol` is
  exclusive; end-of-line is `line length + 1`).
- Autoplay navigation no longer races stale decorations onto the editor,
  and decoration state survives editor tab switches.

### Added
- **Untracked (brand-new, e.g. AI-generated) files are included** in
  working-tree and instant walkthroughs, with whole-file hunks
  (binary and oversized files are skipped automatically).
- **Coverage honesty:** when a diff exceeds the file budget, the completion
  toast and the instant summary now say "Covers N of M changed files
  (largest first)" and the largest changes are prioritized.
- Exit affordances: an ✕ item in the status bar and an exit link in the
  step hover.
- Instant mode deduplicates steps when two hunks touch the same statement.
- Actionable connection errors: an unreachable OpenAI-compatible endpoint
  now reports "could not reach host — is the model server running?"
  instead of a raw `fetch failed`; requests time out after 120 s.
- `vscode:prepublish` now verifies grammar checksums, so no packaging path
  can skip the pin.

### Security
- Model-generated explanations and summaries are escaped and HTML is
  disabled in hovers/status-bar tooltips — prompt-injected links from
  reviewed (untrusted) code can no longer render as clickable.
- Steps may only reference files present in the walkthrough request;
  model-supplied paths are contained to the workspace root (absolute-path
  and `../` escapes are dropped).
- `git diff` runs with `--no-textconv`, so repo-configured textconv
  drivers are never executed.
- Plain-`http://` base URLs for non-loopback hosts now warn before an API
  key is stored/sent.

### Changed
- Bare `[` / `]` stepping no longer fires while typing in the terminal,
  QuickPick, or search box (`alt+[` / `alt+]` still work everywhere).
- Autoplay advances with `preserveFocus`, so it no longer steals focus
  every few seconds.
- An invalid custom base URL in "Set API Key" now shows a friendly error
  instead of failing silently.
- A cold-start Copilot sign-in no longer poisons model discovery for the
  whole session.

## [0.4.1] — 2026-09

- Fixed sidebar reveal via view-focus command when the webview has not
  been resolved yet.

## [0.4.0] — 2026-09

- Modern webview sidebar with step list, progress bars, and start actions;
  auto-opens when a walkthrough starts.
- Clickable transport links in the editor hover (prev / browse / next).

## [0.3.0] — 2026-09

- Walkthrough styles: Expert, Standard, Learner — audience-tuned
  explanations for senior engineers, working developers, and vibe coders.

## [0.2.0] — 2026-09

- Instant local walkthroughs (no AI, sub-second, offline).
- Inline variable state chips, scoped keybindings, status-bar transport.

## [0.1.0] — 2026-09

- Initial release: guided AST & data-flow walkthroughs of diffs and
  selections, Copilot Language Model + OpenAI-compatible providers,
  security notes, tree-sitter grammars with pinned checksums.
