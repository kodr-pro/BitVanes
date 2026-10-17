import type { DiffFile } from '../git/pure';
import { hunkLineRanges } from '../git/pure';
import type { PlanFile, WalkthroughPlan } from '../types/protocol';

/**
 * Build per-file coverage metadata for a walkthrough: every file from the
 * source diff appears (even with zero steps), each carrying how many steps
 * cover it and where its first step is, so the UI can offer per-file
 * navigation and honest "not covered" states.
 *
 * Files with steps sort by first appearance in the plan (the walk order);
 * uncovered files follow, largest change first — matching the order the
 * prompt builder would have shown them in.
 */
export function summarizePlanFiles(sourceFiles: DiffFile[], plan: WalkthroughPlan, workspaceRoot: string): PlanFile[] {
  const stepCount = new Map<string, number>();
  const firstStep = new Map<string, number>();
  plan.steps.forEach((s, i) => {
    stepCount.set(s.filePath, (stepCount.get(s.filePath) ?? 0) + 1);
    if (!firstStep.has(s.filePath)) firstStep.set(s.filePath, i);
  });

  const changed = (f: DiffFile): number =>
    hunkLineRanges(f).reduce((acc, h) => acc + (h.end - h.start + 1), 0);

  const toRootRelative = (p: string): string => {
    const norm = p.replace(/\\/g, '/');
    const root = workspaceRoot.replace(/[\\/]+$/, '').replace(/\\/g, '/');
    return norm.startsWith(`${root}/`) ? norm.slice(root.length + 1) : norm;
  };

  const covered: PlanFile[] = [];
  const uncovered: PlanFile[] = [];
  const seen = new Set<string>();
  for (const f of sourceFiles) {
    const rel = toRootRelative(f.absPath);
    if (seen.has(rel)) continue;
    seen.add(rel);
    const entry: PlanFile = {
      path: rel,
      status: f.status,
      changedLines: changed(f),
      stepCount: stepCount.get(rel) ?? 0,
    };
    const first = firstStep.get(rel);
    if (first !== undefined) {
      entry.firstStepIndex = first;
      covered.push(entry);
    } else {
      uncovered.push(entry);
    }
  }

  covered.sort((a, b) => (a.firstStepIndex ?? 0) - (b.firstStepIndex ?? 0));
  uncovered.sort((a, b) => b.changedLines - a.changedLines);
  return [...covered, ...uncovered];
}
