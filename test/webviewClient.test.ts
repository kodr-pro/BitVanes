import { describe, expect, it } from 'vitest';
import { getWebviewContent } from '../src/views/getWebviewContent';
import type { WalkthroughPlan } from '../src/types/protocol';

interface Stubs {
  root: { innerHTML: string };
  posted: Array<Record<string, unknown>>;
  message(e: { data: unknown }): void;
  click(el: { getAttribute: (k: string) => string | null }): void;
}

/** Execute the webview client script with a minimal DOM stub and return handles. */
function bootClient(): Stubs {
  const html = getWebviewContent({ nonce: 'n'.repeat(32), cspSource: 'https://src.vscode-cdn.net' });
  const script = /<script nonce="[^"]+">\n([\s\S]*?)\n<\/script>/.exec(html)![1]!;
  const handlers: Record<string, Array<(e: unknown) => void>> = {};
  const root = { innerHTML: '' };
  const posted: Array<Record<string, unknown>> = [];
  const documentStub = {
    addEventListener: (t: string, cb: (e: unknown) => void) => {
      (handlers[t] ??= []).push(cb);
    },
    getElementById: () => root,
  };
  const windowStub = {
    addEventListener: (t: string, cb: (e: unknown) => void) => {
      (handlers[t] ??= []).push(cb);
    },
  };
  const vscodeApi = { postMessage: (m: Record<string, unknown>) => posted.push(m) };
  new Function('document', 'window', 'acquireVsCodeApi', script)(documentStub, windowStub, () => vscodeApi);
  return {
    root,
    posted,
    message: (e) => {
      for (const cb of handlers['message'] ?? []) cb(e);
    },
    click: (el) => {
      for (const cb of handlers['click'] ?? []) cb({ target: el });
    },
  };
}

function clickTarget(attrs: Record<string, string>): { getAttribute: (k: string) => string | null; closest: () => unknown } {
  const el = {
    getAttribute: (k: string) => attrs[k] ?? null,
  };
  return { ...el, closest: () => el };
}

const plan: WalkthroughPlan = {
  summary: 'Multi-file change',
  entryPoint: 'src/a.ts',
  totalSteps: 3,
  steps: [
    { stepIndex: 0, title: 'Init x', filePath: 'src/a.ts', range: { startLine: 2, startCol: 1, endLine: 2, endCol: 8 }, explanation: 'creates `x`' },
    { stepIndex: 1, title: 'Mutate x', filePath: 'src/a.ts', range: { startLine: 3, startCol: 1, endLine: 3, endCol: 9 }, explanation: 'updates `x`' },
    { stepIndex: 2, title: 'Validate y', filePath: 'src/deep/dir/b.ts', range: { startLine: 5, startCol: 1, endLine: 5, endCol: 9 }, explanation: 'checks `y`', securityNote: 'boundary' },
  ],
  files: [
    { path: 'src/a.ts', status: 'M', changedLines: 12, stepCount: 2, firstStepIndex: 0 },
    { path: 'src/deep/dir/b.ts', status: 'M', changedLines: 4, stepCount: 1, firstStepIndex: 2 },
    { path: 'src/added.ts', status: 'A', changedLines: 40, stepCount: 0 },
  ],
};

describe('webview client rendering', () => {
  it('renders the welcome screen without errors before any plan arrives', () => {
    const client = bootClient();
    expect(client.root.innerHTML).toContain('BitVanes');
    expect(client.root.innerHTML).toContain('data-mode="staged"');
    expect(client.root.innerHTML).not.toContain('guided tour');
  });

  it('renders the tour tab with file group headers for multi-file plans', () => {
    const client = bootClient();
    client.message({ data: { t: 'state', plan, current: 0 } });
    const html = client.root.innerHTML;
    expect(html).toContain('data-tab="files"');
    expect(html).toContain('Step 1 of 3');
    expect(html.match(/class="group-head/g)?.length).toBe(2);
    expect(html).toContain('<span class="pd">src/</span><span class="pn">a.ts</span>');
    expect(html).toContain('<span class="pd">src/deep/dir/</span><span class="pn">b.ts</span>');
  });

  it('renders the files tab with covered and uncovered files on tab switch', () => {
    const client = bootClient();
    client.message({ data: { t: 'state', plan, current: 1 } });
    client.click(clickTarget({ 'data-act': 'tab', 'data-tab': 'files' }));

    const html = client.root.innerHTML;
    expect(html).toContain('2 of 3 in this tour');
    expect(html).toContain('<span class="pd">src/</span><span class="pn">a.ts</span>');
    // uncovered file is listed with a "not in tour" marker and a walk button
    expect(html).toContain('not in tour');
    expect(html).toContain('data-act="file-walk" data-path="src/added.ts"');
    // covered file offers a jump to its first step
    expect(html).toContain('data-act="file-jump" data-i="2"');

    // clicking a covered file posts the jump and returns to the tour tab;
    // the step counter itself updates when the host posts the new state
    client.click(clickTarget({ 'data-act': 'file-jump', 'data-i': '2' }));
    expect(client.posted).toContainEqual({ t: 'jump', i: 2 });
    expect(client.root.innerHTML).toContain('data-tab="tour" class="on"');
    expect(client.root.innerHTML).toContain('group-head');

    // per-file walk posts the file start mode with the path
    client.click(clickTarget({ 'data-act': 'file-walk', 'data-path': 'src/added.ts' }));
    expect(client.posted).toContainEqual({ t: 'start', mode: 'file', path: 'src/added.ts' });
  });

  it('keeps single-file plans (selection mode) tab-free', () => {
    const client = bootClient();
    const single: WalkthroughPlan = {
      ...plan,
      files: undefined,
      steps: [plan.steps[0]!],
      totalSteps: 1,
    };
    client.message({ data: { t: 'state', plan: single, current: 0 } });
    expect(client.root.innerHTML).not.toContain('data-tab="files"');
    expect(client.root.innerHTML).not.toContain('group-head');
  });
});
