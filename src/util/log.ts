/**
 * Timestamped logging for the BitVanes output channel.
 *
 * The channel is created in `extension.ts` (`vscode.window.createOutputChannel('BitVanes')`)
 * and wired here via {@link initLog}; its lifetime is owned by `context.subscriptions`.
 * This module deliberately does not import `vscode` — the structural {@link LogSink}
 * interface keeps every consumer (including `ast/`, which stays vscode-free so the
 * test suite can run in plain Node) decoupled and makes the logger unit-testable
 * with a plain fake sink.
 */

export type LogLevel = 'info' | 'warn' | 'error';

/** Structural subset of `vscode.OutputChannel` the logger needs. */
export interface LogSink {
  appendLine(line: string): void;
  show?(): void;
}

let sink: LogSink | undefined;

/** Wire the output channel. Call once from `activate()`; the channel is disposed
 *  with the extension via `context.subscriptions`, not by the logger. */
export function initLog(channel: LogSink): void {
  sink = channel;
}

/** Detach the sink (test hygiene; also safe if ever called after dispose). */
export function resetLog(): void {
  sink = undefined;
}

/** Open the BitVanes output channel — the "Show Log" action on error toasts. */
export function showLog(): void {
  try {
    sink?.show?.();
  } catch {
    // Never let revealing the log fail a user flow.
  }
}

/** Render an unknown thrown value as a single loggable string. */
export function formatError(err: unknown): string {
  if (err instanceof Error) return err.stack ?? `${err.name}: ${err.message}`;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err) ?? String(err);
  } catch {
    return String(err);
  }
}

/** `[ISO-8601] [level] scope: message` — exported for tests. Continuation
 *  lines (stacks, multi-line errors) are indented so entries stay scannable. */
export function formatLogLine(iso: string, level: LogLevel, scope: string, message: string): string {
  const body = message.split('\n').join('\n    ');
  return `[${iso}] [${level}] ${scope}: ${body}`;
}

function emit(level: LogLevel, scope: string, message: string): void {
  if (!sink) return;
  try {
    sink.appendLine(formatLogLine(new Date().toISOString(), level, scope, message));
  } catch {
    // A logging failure must never propagate into the host.
  }
}

export function logInfo(scope: string, message: string): void {
  emit('info', scope, message);
}

export function logWarn(scope: string, err: unknown): void {
  emit('warn', scope, formatError(err));
}

export function logError(scope: string, err: unknown): void {
  emit('error', scope, formatError(err));
}
