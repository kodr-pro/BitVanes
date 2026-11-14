import { afterEach, describe, expect, it } from 'vitest';
import {
  formatError,
  formatLogLine,
  initLog,
  logError,
  logInfo,
  logWarn,
  resetLog,
  showLog,
  type LogSink,
} from '../src/util/log';

function fakeSink(): LogSink & { lines: string[]; shown: number } {
  const s = {
    lines: [] as string[],
    shown: 0,
    appendLine(line: string): void {
      s.lines.push(line);
    },
    show(): void {
      s.shown += 1;
    },
  };
  return s;
}

afterEach(() => {
  resetLog();
});

describe('formatLogLine', () => {
  it('prefixes every entry with an ISO-8601 timestamp, level and scope', () => {
    const line = formatLogLine('2026-11-14T12:00:00.000Z', 'error', 'git', 'boom');
    expect(line).toBe('[2026-11-14T12:00:00.000Z] [error] git: boom');
  });

  it('indents continuation lines so stacked errors stay scannable', () => {
    const line = formatLogLine('2026-11-14T12:00:00.000Z', 'error', 'model', 'All providers failed.\nopenai: 500\nollama: down');
    expect(line).toBe('[2026-11-14T12:00:00.000Z] [error] model: All providers failed.\n    openai: 500\n    ollama: down');
  });
});

describe('BitVanes log channel', () => {
  it('writes timestamped entries for each level', () => {
    const s = fakeSink();
    initLog(s);
    logInfo('extension', 'hello');
    logWarn('git', 'fallback used');
    logError('model', new Error('boom'));
    expect(s.lines).toHaveLength(3);
    const ts = /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[(info|warn|error)\] /;
    for (const line of s.lines) expect(line).toMatch(ts);
    expect(s.lines[0]).toContain('[info] extension: hello');
    expect(s.lines[1]).toContain('[warn] git: fallback used');
    expect(s.lines[2]).toContain('[error] model:');
    expect(s.lines[2]).toContain('boom');
  });

  it('logs Error objects with their stack for diagnosis', () => {
    const s = fakeSink();
    initLog(s);
    logError('editor', new Error('file not found'));
    const entry = s.lines[0] ?? '';
    expect(entry).toContain('[error] editor: Error: file not found');
    expect(entry).toMatch(/\n\s+at /);
  });

  it('stringifies non-Error throwables', () => {
    const s = fakeSink();
    initLog(s);
    logWarn('tree-sitter', 'grammar wasm missing');
    logError('git', { code: 128, stderr: 'fatal' });
    expect(s.lines[0]).toContain('[warn] tree-sitter: grammar wasm missing');
    expect(s.lines[1]).toContain('[error] git: {"code":128,"stderr":"fatal"}');
  });

  it('is a no-op before initLog — logging must never throw into the host', () => {
    resetLog();
    expect(() => {
      logInfo('x', 'y');
      logWarn('x', new Error('y'));
      logError('x', 'y');
      showLog();
    }).not.toThrow();
  });

  it('never propagates a failing sink', () => {
    initLog({
      appendLine(): void {
        throw new Error('disposed');
      },
    });
    expect(() => logError('model', new Error('boom'))).not.toThrow();
    expect(() => showLog()).not.toThrow();
  });

  it('showLog reveals the channel (the "Show Log" toast action)', () => {
    const s = fakeSink();
    initLog(s);
    showLog();
    expect(s.shown).toBe(1);
  });
});

describe('formatError', () => {
  it('prefers the stack, falls back to name+message, then stringifies', () => {
    expect(formatError(new Error('x'))).toMatch(/^Error: x\n\s+at /);
    const bare = Object.create(Error.prototype) as Error;
    bare.name = 'CustomError';
    bare.message = 'no stack';
    expect(formatError(bare)).toBe('CustomError: no stack');
    expect(formatError('plain')).toBe('plain');
    expect(formatError(undefined)).toBe('undefined');
  });
});
