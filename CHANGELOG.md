# Changelog

All notable changes to BitVanes are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[SemVer](https://semver.org/).

## [1.0.0] — 2026-10-15

First stable release. The 0.x line converged on line-accurate walkthroughs,
a hardened security model, and instant offline tours; 1.0.0 marks the
marketplace debut with no feature changes since 0.5.0.

### Added
- VS Code Marketplace listing — search "BitVanes" in the Extensions view.
  Installing from the Marketplace also unlocks the default GitHub Copilot
  provider: the VS Code Language Model API only serves marketplace-published
  extensions, so VSIX-only installs fall back to a configured endpoint.

### Changed
- Repository relocated to `kodr-pro/BitVanes`; repository, issues, releases,
  and website links updated accordingly.
- Node engine floor raised to `>=20.3.0`, matching the `AbortSignal.any`
  requirement of the LLM request plumbing (VS Code 1.95 ships Node 20.18,
  so no user is affected).

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
