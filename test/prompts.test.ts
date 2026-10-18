import { describe, expect, it } from 'vitest';
import { buildUserPrompt, type ContextFile, type WalkthroughRequest } from '../src/llm/prompts';

function file(path: string, hunks: Array<{ start: number; end: number }> = [{ start: 1, end: 4 }]): ContextFile {
  return { path, status: 'M', hunks, snippet: 'let x = 1;', astSummary: '' };
}

function req(files: ContextFile[], mode: 'diff' | 'selection' = 'diff'): WalkthroughRequest {
  return { mode, language: 'typescript', files };
}

describe('buildUserPrompt multi-file coverage', () => {
  it('requires every file to be walked when several files are in context', () => {
    const prompt = buildUserPrompt(req([file('src/a.ts'), file('src/b.ts'), file('src/c.ts')]), 12);
    expect(prompt).toContain('3 files changed');
    expect(prompt).toContain('cover EVERY one of them');
    expect(prompt).toContain('at least one step per file');
    expect(prompt).toContain('Maximum 12 steps across all files');
    expect(prompt).toContain('Every file listed above must appear in at least one step');
  });

  it('keeps the single-path contract for a one-file diff', () => {
    const prompt = buildUserPrompt(req([file('src/a.ts')]), 12);
    expect(prompt).not.toContain('files changed');
    expect(prompt).not.toContain('Every file listed above must appear in at least one step');
    expect(prompt).toContain('Walk the changed code path in execution order');
  });

  it('keeps selection mode focused on the selected path', () => {
    const prompt = buildUserPrompt(
      {
        mode: 'selection',
        language: 'typescript',
        files: [file('src/a.ts')],
        selection: { path: 'src/a.ts', range: { startLine: 1, startCol: 1, endLine: 4, endCol: 1 } },
      },
      12,
    );
    expect(prompt).toContain('selected code path');
    expect(prompt).not.toContain('cover EVERY one of them');
  });

  it('appends the commit context note for commit tours', () => {
    const prompt = buildUserPrompt(
      {
        ...req([file('src/a.ts')]),
        note: 'Context: these are the changes the last commit introduced — "fix rounding" (diffed against its first parent).',
      },
      12,
    );
    expect(prompt).toContain('Produce a WalkthroughPlan for the pending code changes below');
    expect(prompt).toContain('changes the last commit introduced');
    expect(prompt).toContain('first parent');
  });

  it('counts only budget-included files toward the coverage contract', () => {
    // Six files at the per-file snippet cap (12k each) blow the 56k total
    // budget, so the tail of the list is omitted and must not be promised.
    const files = ['a', 'b', 'c', 'd', 'e', 'f'].map((n) => ({
      ...file(`src/${n}.ts`),
      snippet: 'x'.repeat(60_000),
    }));
    const prompt = buildUserPrompt(req(files), 12);
    expect(prompt).toContain('Omitted for prompt budget:');
    expect(prompt).not.toContain('6 files changed');
    expect(prompt).not.toMatch(/Every file listed above.*src\/f\.ts/);
  });
});
