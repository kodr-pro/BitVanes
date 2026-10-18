import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import type { Range } from '../types/protocol';
import { indentOf, expandToBlock } from '../util/text';
import { parseUnifiedDiff, wholeFileHunk } from './pure';
import type { DiffFile } from './pure';

export { parseUnifiedDiff, hunkLineRanges } from './pure';
export type { DiffFile, DiffHunk } from './pure';

const MAX_UNTRACKED_FILES = 50;
const MAX_UNTRACKED_BYTES = 2_000_000;

/** One entry of the recent-commit picker. */
export interface CommitEntry {
  /** Full hash — unambiguous for later git invocations. */
  hash: string;
  /** Abbreviated hash for display. */
  short: string;
  author: string;
  /** YYYY-MM-DD (git `--date=short`). */
  date: string;
  subject: string;
}

export interface SelectionTarget {
  filePath: string;
  absPath: string;
  range: Range;
  text: string;
  documentText: string;
}

export class GitProvider {
  static async exec(args: string[], cwd: string, timeoutMs = 15_000): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn('git', args, {
        cwd,
        windowsHide: true,
        env: { ...process.env, GIT_PAGER: 'cat', PAGER: 'cat' },
      });
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error(`git ${args[0]} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      child.stdout.on('data', (d: Buffer) => {
        stdout += d.toString('utf8');
      });
      child.stderr.on('data', (d: Buffer) => {
        stderr += d.toString('utf8');
      });
      child.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) resolve(stdout);
        else reject(new Error(`git ${args.join(' ')} exited with ${code}: ${stderr.trim().slice(0, 400)}`));
      });
    });
  }

  static workspaceRoot(): string | undefined {
    const folders = vscode.workspace.workspaceFolders?.filter((f) => f.uri.scheme === 'file');
    if (!folders || folders.length === 0) return undefined;
    // Multi-root workspaces: prefer the folder containing the active editor so
    // diffs resolve against the repo the user is actually looking at, not just
    // the first folder in the list.
    const active = vscode.window.activeTextEditor?.document.uri;
    if (active && active.scheme === 'file') {
      const abs = active.fsPath;
      const match = folders.find((f) => {
        const root = f.uri.fsPath.replace(/[\\/]+$/, '');
        return abs === root || abs.startsWith(root + path.sep);
      });
      if (match) return match.uri.fsPath;
    }
    return folders[0]!.uri.fsPath;
  }

  static async isGitRepo(root: string): Promise<boolean> {
    try {
      const out = await GitProvider.exec(['rev-parse', '--is-inside-work-tree'], root);
      return out.trim() === 'true';
    } catch {
      return false;
    }
  }

  /** True repository root, even when the workspace folder is a subdirectory. */
  static async repoRoot(startDir: string): Promise<string | undefined> {
    try {
      const out = await GitProvider.exec(['rev-parse', '--show-toplevel'], startDir);
      const top = out.trim();
      return top !== '' ? top : undefined;
    } catch {
      return undefined;
    }
  }

  static async diff(root: string, staged: boolean): Promise<DiffFile[]> {
    // --no-textconv: never execute repo-configured textconv drivers
    // --no-ext-diff: never execute repo-configured external diff tools
    const args = ['diff', '--no-textconv', '--no-ext-diff', '--unified=0', '--no-color'];
    if (staged) args.push('--cached');
    const out = await GitProvider.exec(args, root);
    const base = (await GitProvider.repoRoot(root)) ?? root;
    const files = parseUnifiedDiff(out)
      .filter((f) => f.hunks.length > 0)
      .map((f) => ({ ...f, absPath: path.resolve(base, f.path) }));
    if (staged) return files;
    const untracked = await GitProvider.untrackedFiles(root, base);
    return [...files, ...untracked];
  }

  /**
   * All pending changes (staged + unstaged) for one tracked file, versus HEAD.
   * New-side line numbers match the working-tree content, so the walkthrough
   * lands where the user's editor actually is.
   */
  static async diffFile(root: string, relPath: string): Promise<DiffFile[]> {
    // Fresh repositories have no HEAD yet — fall back to the staged diff there.
    let out: string;
    try {
      out = await GitProvider.exec(
        ['diff', 'HEAD', '--no-textconv', '--no-ext-diff', '--unified=0', '--no-color', '--', relPath],
        root,
      );
    } catch {
      out = await GitProvider.exec(
        ['diff', '--cached', '--no-textconv', '--no-ext-diff', '--unified=0', '--no-color', '--', relPath],
        root,
      );
    }
    const base = (await GitProvider.repoRoot(root)) ?? root;
    return parseUnifiedDiff(out)
      .filter((f) => f.hunks.length > 0)
      .map((f) => ({ ...f, absPath: path.resolve(base, f.path) }));
  }

  /** The `limit` most recent commits, newest first, for the picker. */
  static async recentCommits(root: string, limit = 20): Promise<CommitEntry[]> {
    const out = await GitProvider.exec(
      ['log', `-n`, String(limit), '--date=short', `--pretty=format:${COMMIT_FORMAT}`],
      root,
    );
    return parseCommitLines(out);
  }

  /** Subject and metadata for a single ref (e.g. HEAD). */
  static async commitInfo(root: string, ref: string): Promise<CommitEntry | undefined> {
    const out = await GitProvider.exec(
      ['show', '-s', '--date=short', `--pretty=format:${COMMIT_FORMAT}`, ref],
      root,
    );
    return parseCommitLines(out)[0];
  }

  /**
   * Changes introduced by one commit — its diff against the first parent.
   * The root commit (no parent) falls back to `diff-tree --root -p`, which
   * emits the whole commit as additions. New-side line numbers refer to the
   * file content at that commit.
   */
  static async diffCommit(root: string, ref: string): Promise<DiffFile[]> {
    // Same hardening as the working-tree diff: never execute repo-configured
    // textconv or external diff drivers.
    const hardening = ['--no-textconv', '--no-ext-diff', '--unified=0', '--no-color'];
    let out: string;
    try {
      out = await GitProvider.exec(['diff', ...hardening, `${ref}~1`, ref], root);
    } catch {
      out = await GitProvider.exec(['diff-tree', '--root', '-p', ...hardening, ref], root);
    }
    const base = (await GitProvider.repoRoot(root)) ?? root;
    return parseUnifiedDiff(out)
      .filter((f) => f.hunks.length > 0)
      .map((f) => ({ ...f, absPath: path.resolve(base, f.path) }));
  }

  /** A brand-new (untracked) file as a whole-file addition DiffFile, or undefined. */
  static async untrackedFile(root: string, relPath: string): Promise<DiffFile | undefined> {
    const base = (await GitProvider.repoRoot(root)) ?? root;
    const abs = path.resolve(base, relPath);
    try {
      const stat = await fs.stat(abs);
      if (!stat.isFile() || stat.size > MAX_UNTRACKED_BYTES) return undefined;
      const text = await fs.readFile(abs, 'utf8');
      if (text.slice(0, 8_000).includes('\0')) return undefined; // binary
      return { path: relPath, absPath: abs, status: 'A' as const, hunks: [wholeFileHunk(text)] };
    } catch {
      return undefined;
    }
  }

  /** Untracked (brand-new, e.g. AI-generated) files as whole-file additions. */
  private static async untrackedFiles(startDir: string, base: string): Promise<DiffFile[]> {
    let out: string;
    try {
      out = await GitProvider.exec(['ls-files', '--others', '--exclude-standard', '-z'], startDir);
    } catch {
      return [];
    }
    const files: DiffFile[] = [];
    for (const p of out
      .split('\0')
      .map((s) => s.trim())
      .filter((s) => s !== '')
      .slice(0, MAX_UNTRACKED_FILES)) {
      const abs = path.resolve(base, p);
      try {
        const stat = await fs.stat(abs);
        if (!stat.isFile() || stat.size > MAX_UNTRACKED_BYTES) continue;
        const text = await fs.readFile(abs, 'utf8');
        if (text.slice(0, 8_000).includes('\0')) continue; // binary
        files.push({ path: p, absPath: abs, status: 'A', hunks: [wholeFileHunk(text)] });
      } catch {
        continue;
      }
    }
    return files;
  }
}

/** %x1f (unit separator) — subjects may contain tabs, never this. */
const COMMIT_FORMAT = '%H%x1f%h%x1f%an%x1f%ad%x1f%s';

function parseCommitLines(out: string): CommitEntry[] {
  return out
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => {
      const parts = line.split('\x1f');
      const [hash = '', short = '', author = '', date = ''] = parts;
      const subject = parts.slice(4).join('\x1f');
      return { hash, short, author, date, subject };
    })
    .filter((c) => c.hash !== '');
}

export function getActiveSelection(): SelectionTarget | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return undefined;
  const doc = editor.document;
  const sel = editor.selection;

  let range: Range;
  let body: string;
  if (!sel.isEmpty) {
    range = {
      startLine: sel.start.line + 1,
      startCol: sel.start.character + 1,
      endLine: sel.end.line + 1,
      endCol: sel.end.character + 1,
    };
    body = doc.getText(sel);
  } else {
    const lines = doc.getText().split('\n');
    const block = expandToBlock(lines, sel.active.line);
    range = {
      startLine: block.startLine + 1,
      startCol: Math.max(1, indentOf(lines[block.startLine] ?? '') + 1),
      endLine: block.endLine + 1,
      endCol: Math.max(1, (lines[block.endLine] ?? '').trimEnd().length + 1),
    };
    body = lines.slice(block.startLine, block.endLine + 1).join('\n');
  }

  const relPath = vscode.workspace.asRelativePath(doc.uri, false);
  return {
    filePath: relPath.replace(/\\/g, '/'),
    absPath: doc.uri.fsPath,
    range,
    text: body,
    documentText: doc.getText(),
  };
}
