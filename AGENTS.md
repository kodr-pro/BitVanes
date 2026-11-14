# AGENTS.md — BitVanes repo guide

Operating knowledge for coding agents working in this repository. The
general engineering constitution lives in the operator's global config;
this file is the repo-specific layer.

## Remotes & mirroring — read this first

- `origin` **fetches from GitHub** (kodr-pro/BitVanes) but its **push URL
  points at the private gitea mirror**. A plain `git push origin` publishes
  to gitea, not GitHub. Run `git remote -v` and trust what it says.
- The `gitea` remote is that same mirror (fetch + push).
- PRs are opened and merged **on GitHub**. Gitea prints its own PR link on
  push — ignore it; the GitHub PR is the real one.
- gitea lags behind GitHub. After a GitHub merge, sync it:

  ```bash
  git fetch origin --tags
  git checkout main && git merge --ff-only origin/main
  git push gitea main          # only after GitHub has the commits (see below)
  ```

- Push order matters: try GitHub first
  (`git push <github-url> main`), then gitea. If GitHub rejects a direct
  push (branch protection — this repo merges everything via PR), fall back
  to a branch + PR; never leave gitea ahead of GitHub.
- Tags usually mirror on their own; verify with a diff of
  `git ls-remote <remote>` filtered to `refs/heads` and `refs/tags`.
- GitHub auto-deletes merged PR branches; gitea keeps them. Ask the user
  before deleting any branch anywhere.

## Release flow

- Prepare a patch release on `release/X.Y.Z` branched from the latest
  `origin/main`: bump `package.json` **and** the lockfile, add the
  CHANGELOG section, commit logically, push the branch, **stop**. Never
  tag and never publish — the human cuts the release.
- Tag `vX.Y.Z` on GitHub triggers `.github/workflows/release.yml`: the
  full gate suite → `vsce package` (grammar checksums verified via
  `vscode:prepublish`) → GitHub Release with the VSIX → Open VSX publish
  (`OVSX_PAT`; skips with a visible warning when unset).
- **Open VSX is the only store.** The VS Code Marketplace publish step
  (`VSCE_PAT`) was removed in 1.0.5 — do not re-add it. `vsce` stays for
  building the VSIX (`npm run package`).

## Gates — must pass before declaring done

`npm run typecheck`, `npm run lint`, `npm test` (vitest), `npm run
compile`, and `npx vsce package` must produce a VSIX. In `web/`, `npm run
build` (vitepress docs site). `npm audit` should report 0 vulnerabilities
in **both** root and `web/`.

## Conventions worth knowing

- `engines.node >= 22`; CI and the web build run on Node 24 (`web/.nvmrc`).
- Tests run in plain Node with **no `vscode` mock**: modules under
  `src/ast/` and `src/util/log.ts` must not import `'vscode'` — depend on
  structural interfaces (e.g. `LogSink`) so the suite stays mock-free.
- Adding a root-level config file? Check `.vscodeignore` covers it, then
  confirm the packaged VSIX file count didn't grow (a renamed
  `vitest.config.mts` leaked into the 1.0.5 VSIX until ignored).
- Dependency advisories with no fixed stable upstream are cleared with npm
  `overrides` (precedent: `@azure/msal-node ^7.1.0`, `minimatch ^11.0.1`).
  Never ship alpha toolchain deps in the extension package. `web/` is
  docs-only toolchain — nothing from it ships in the VSIX — and may track
  the official `next` line when a stable fix doesn't exist (precedent:
  vitepress 2 for the vite ≤ 6.4.3 advisories).
- CHANGELOG follows Keep-a-Changelog with one section per release;
  historical entries containing false claims are corrected in place
  (precedent: the "pending Microsoft review" removal in 1.0.5).
- Repo-root `*.vsix` files are gitignored local release artifacts — leave
  them in place, as with `dist/` and `web/docs/.vitepress/dist`. Ask before
  deleting anything.
