# Contributing to BitVanes

Thanks for helping build BitVanes — and for reading this before opening a PR.

## Ground rules

- **Bug reports first for behavior changes.** Open an issue describing the
  misbehavior (see the templates) so we can agree on the fix before code.
- **One PR per concern.** Small, reviewable diffs beat big ones.
- **Walkthrough accuracy is the product.** If your change touches the range
  pipeline (model output → validation → AST snap → decorations), include the
  input that used to mis-step as a test case.
- **The security model is not negotiable** (see `README.md` → Security model):
  model output is untrusted, `git diff` runs with `--no-ext-diff
  --no-textconv`, grammars are checksum-pinned, keys live only in VS Code
  SecretStorage, and no telemetry. A PR that regresses any of these will not
  merge.

## Development setup

```bash
git clone https://github.com/kodr-pro/BitVanes.git
cd BitVanes
npm ci
node scripts/fetch-grammars.mjs   # vendor tree-sitter grammars (pinned)
npm run typecheck
npm run lint
npm test                          # ~100 tests, incl. real tree-sitter WASM parses
npm run test:coverage             # same, with V8 coverage
npm run compile                   # esbuild production bundle
npm run package                   # vsce package → bitvanes-<version>.vsix
```

Press **F5** in VS Code to launch the Extension Development Host with the
local build.

### Project map

| Path | What lives there |
|---|---|
| `src/extension.ts` | Activation, command registration, pipeline orchestration, URI deep links |
| `src/git/` | Diff capture and path resolution |
| `src/ast/` | Tree-sitter resolver and grammar loading |
| `src/pipeline/` | Request building, local (instant) plans, AST range repair |
| `src/llm/` | Provider negotiation (VS Code LM / OpenAI-compatible), prompts, JSON extraction |
| `src/types/protocol.ts` | The `WalkthroughPlan` contract and defensive validation |
| `src/director/`, `src/views/` | Editor decorations, status bar, sidebar webview |
| `test/` | Vitest suites — pure logic, no VS Code APIs |
| `web/` | Documentation site (VitePress) at bitvanes.com |
| `scripts/` | Grammar vendoring with SHA-256 pinning |

### Conventions

- TypeScript strict mode; no `any` (linted).
- Logic that can run without VS Code APIs belongs in a plain module under
  `src/` with tests in `test/` — `extension.ts` stays thin glue.
- Model output and external input (deep links, config) are validated
  defensively; when in doubt, drop the invalid piece and continue, or fail
  closed.
- Tests: `vitest`, colocated in `test/*.test.ts`. New behavior ships with
  tests in the same PR.

## Releases

Maintainers: version bumps and `CHANGELOG.md` entries land on `main`; tagging
`v*` triggers `.github/workflows/release.yml`, which packages once and
publishes to Open VSX and the VS Code Marketplace (each publish emits a
visible warning if its token secret is unset). Releases follow SemVer.

## License

By contributing, you agree that your contributions will be licensed under the
[Apache License 2.0](LICENSE) that covers this repository — including the
section-5 contribution terms noted in the README. You retain copyright to
your work; no CLA is required.
