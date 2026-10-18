import type { WalkthroughStyle } from './llm/prompts';

/** Deep-link scopes accepted by the vscode://bitvanes.bitvanes/walkthrough handler.
 *  `commit` walks the changes HEAD introduced (the palette picker covers older commits). */
export type WalkthroughScope = 'working-tree' | 'staged' | 'instant' | 'commit';

export interface WalkthroughUriCommand {
  scope: WalkthroughScope;
  /** Audience override for this run only; user settings are not modified. */
  style?: WalkthroughStyle;
}

export interface UriParseResult {
  command?: WalkthroughUriCommand;
  /** Human-readable reason the link was rejected, shown to the user. */
  error?: string;
}

export const URI_AUTHORITY = 'bitvanes.bitvanes';
export const URI_PATH = '/walkthrough';

const SCOPES: Record<string, WalkthroughScope> = {
  'working-tree': 'working-tree',
  staged: 'staged',
  instant: 'instant',
  commit: 'commit',
};

const STYLES: Record<string, WalkthroughStyle> = {
  expert: 'expert',
  standard: 'standard',
  learner: 'learner',
};

/**
 * Parse a vscode://bitvanes.bitvanes/walkthrough?scope=… URI.
 *
 * The input is untrusted — any web page or local process can ask the OS to
 * open a vscode:// link — so this parser is strict and side-effect free:
 * - the authority must be exactly `bitvanes.bitvanes`;
 * - the path must be exactly `/walkthrough` (a trailing slash is tolerated);
 * - `scope` is required and must be one of `working-tree`, `staged`, `instant`, `commit`;
 * - `style` is optional and must be one of `expert`, `standard`, `learner`;
 * - unknown query parameters are ignored (forward compatible);
 * - nothing here performs I/O; callers decide what a valid command does.
 */
export function parseWalkthroughUri(authority: string, path: string, query: string): UriParseResult {
  if (authority.toLowerCase() !== URI_AUTHORITY) {
    return { error: `unrecognized link authority "${authority}"` };
  }
  if (path.replace(/\/+$/, '') !== URI_PATH) {
    return { error: `unrecognized link path "${path}" — expected /walkthrough?scope=…` };
  }

  const params = new URLSearchParams(query);
  const scopeRaw = params.get('scope');
  if (scopeRaw === null) {
    return { error: 'missing "scope" — use working-tree, staged, instant or commit' };
  }
  const scope = SCOPES[scopeRaw.trim().toLowerCase()];
  if (!scope) {
    return { error: `unknown scope "${scopeRaw}" — use working-tree, staged, instant or commit` };
  }

  const styleRaw = params.get('style');
  let style: WalkthroughStyle | undefined;
  if (styleRaw !== null) {
    style = STYLES[styleRaw.trim().toLowerCase()];
    if (!style) {
      return { error: `unknown style "${styleRaw}" — use expert, standard or learner` };
    }
  }

  return { command: style ? { scope, style } : { scope } };
}
