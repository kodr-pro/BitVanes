import { describe, expect, it } from 'vitest';
import type { DiffFile } from '../src/git/pure';
import { summarizePlanFiles } from '../src/pipeline/planFiles';
import type { WalkthroughPlan } from '../src/types/protocol';

function diffFile(path: string, newCount: number, status: DiffFile['status'] = 'M'): DiffFile {
  return { path, absPath: `/repo/${path}`, status, hunks: [{ oldStart: 1, oldCount: 1, newStart: 1, newCount }] };
}

function plan(varSteps: string[]): WalkthroughPlan {
  return {
    summary: 's',
    entryPoint: 'e',
    totalSteps: varSteps.length,
    steps: varSteps.map((filePath, i) => ({
      stepIndex: i,
      title: `Step ${i + 1}`,
      filePath,
      range: { startLine: 1, startCol: 1, endLine: 2, endCol: 1 },
      explanation: 'expl',
    })),
  };
}

describe('summarizePlanFiles', () => {
  it('groups steps per file in walk order and keeps uncovered files', () => {
    const source = [diffFile('src/a.ts', 40), diffFile('src/b.ts', 10), diffFile('src/c.ts', 5)];
    const p = plan(['src/b.ts', 'src/b.ts', 'src/a.ts']);
    const files = summarizePlanFiles(source, p, '/repo');

    expect(files.map((f) => f.path)).toEqual(['src/b.ts', 'src/a.ts', 'src/c.ts']);
    expect(files[0]).toMatchObject({ path: 'src/b.ts', stepCount: 2, firstStepIndex: 0, changedLines: 10 });
    expect(files[1]).toMatchObject({ path: 'src/a.ts', stepCount: 1, firstStepIndex: 2, changedLines: 40 });
    expect(files[2]).toMatchObject({ path: 'src/c.ts', stepCount: 0, changedLines: 5 });
    expect(files[2]!.firstStepIndex).toBeUndefined();
  });

  it('sorts uncovered files largest change first', () => {
    const source = [diffFile('small.ts', 2), diffFile('big.ts', 99), diffFile('mid.ts', 10)];
    const files = summarizePlanFiles(source, plan(['mid.ts']), '/repo');
    expect(files.map((f) => f.path)).toEqual(['mid.ts', 'big.ts', 'small.ts']);
  });

  it('carries the git status letter through', () => {
    const source = [diffFile('added.ts', 9, 'A'), diffFile('removed.ts', 3, 'D')];
    const files = summarizePlanFiles(source, plan(['added.ts']), '/repo');
    expect(files[0]!.status).toBe('A');
    expect(files[1]!.status).toBe('D');
  });

  it('dedupes source entries that resolve to the same relative path', () => {
    // e.g. the same file appearing twice in a merged source list
    const source = [diffFile('src/a.ts', 4), { ...diffFile('a.ts', 4), absPath: '/repo/src/a.ts' }];
    const files = summarizePlanFiles(source, plan([]), '/repo');
    expect(files).toHaveLength(1);
    expect(files[0]!.path).toBe('src/a.ts');
  });

  it('normalizes absolute paths to workspace-relative', () => {
    const source = [diffFile('src/a.ts', 4)];
    const p: WalkthroughPlan = {
      ...plan([]),
      steps: [
        {
          stepIndex: 0,
          title: 't',
          filePath: 'src/a.ts',
          range: { startLine: 1, startCol: 1, endLine: 1, endCol: 2 },
          explanation: 'e',
        },
      ],
    };
    const files = summarizePlanFiles(source, p, '/repo');
    expect(files[0]).toMatchObject({ path: 'src/a.ts', stepCount: 1, firstStepIndex: 0 });
  });
});
