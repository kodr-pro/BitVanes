# Security Policy

BitVanes is built for reviewing code where being wrong is expensive, so the extension's own security bar is high. The [security model](README.md#security-model) in the README is not a suggestion — it is the contract:

- API keys live only in VS Code `SecretStorage`. Nothing writes them to settings files, dotfiles, or logs.
- No telemetry. The only network calls are the LLM endpoint you configure, one-time localhost model-server detection, and local `git`.
- Model output is untrusted input: escaped before rendering, ranges snapped to real AST nodes, and steps may only reference the files the walkthrough was generated from.
- `git diff` runs with `--no-ext-diff --no-textconv` — repository-configured diff drivers are never executed.
- Tree-sitter grammar binaries are SHA-256 pinned and verified in CI and at package time.
- Deep links are strictly validated and never write files or change settings.

A regression in any of these is a security bug, not a style nit.

## Supported versions

| Version | Supported |
|---|---|
| Latest release | ✅ |
| `main` branch | ✅ |
| Older releases | ❌ — update first, then re-test: [Releases](https://github.com/kodr-pro/BitVanes/releases) |

## Reporting a vulnerability

**Do not open a public issue for anything security-relevant.** Use private
vulnerability reporting instead:

**https://github.com/kodr-pro/BitVanes/security/advisories/new**

You get a private thread with the maintainers and coordinated disclosure
through a GitHub security advisory.

### What to include

Respect the signal-to-noise ratio — a report we can reproduce is a report we
can fix:

- BitVanes version and install source (Open VSX / Marketplace / VSIX / source).
- A minimal reproduction: the smallest diff, selection, or crafted model
  response that triggers it.
- Impact — what an attacker actually gains: code execution, key disclosure,
  data leaving the machine, execution of repo-configured diff drivers, etc.
- Which invariant from the list above (or beyond it) it breaks.

Never include real API keys or proprietary code in a report.

### In scope

- Everything shipped from this repo: extension source, the VSIX bundle, the
  vendored grammar pipeline (`scripts/fetch-grammars.mjs`), the sidebar
  webview, and the CI/packaging workflows.
- Anything that breaks the contract above — including "telemetry-shaped"
  behavior (undocumented network calls) even if it looks benign.

### Out of scope

- Vulnerabilities in VS Code itself, in the language-model providers
  (OpenAI, Anthropic, OpenRouter, Ollama, LM Studio, vLLM), or in
  tree-sitter upstream. Report those to the relevant project.
- Findings that require the attacker to already control the machine or the
  user's VS Code settings — at that point they don't need BitVanes.
- Theoretical issues with no demonstrated path from BitVanes input to
  impact, and reports against unsupported versions.

## Coordinated disclosure

- **Initial response:** target is 72 hours — triage, a severity read, and a
  channel for follow-up.
- **Fix timeline:** severity-dependent, but anything in the code-execution or
  key-disclosure class gets a patch release, not a milestone.
- Credit in the advisory unless you'd rather stay anonymous.
- Please allow a reasonable head start (90 days is fine) before publishing.

## Good-faith research

Security research done on your own repos, with your own keys and your own
model endpoints is welcome. Don't test against other people's code or data.
