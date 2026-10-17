import { describe, expect, it } from 'vitest';
import { parseWalkthroughUri } from '../src/uriHandler';

describe('parseWalkthroughUri', () => {
  it('accepts each valid scope', () => {
    expect(parseWalkthroughUri('bitvanes.bitvanes', '/walkthrough', 'scope=working-tree')).toEqual({
      command: { scope: 'working-tree' },
    });
    expect(parseWalkthroughUri('bitvanes.bitvanes', '/walkthrough', 'scope=staged')).toEqual({
      command: { scope: 'staged' },
    });
    expect(parseWalkthroughUri('bitvanes.bitvanes', '/walkthrough', 'scope=instant')).toEqual({
      command: { scope: 'instant' },
    });
  });

  it('accepts a valid style override', () => {
    expect(parseWalkthroughUri('bitvanes.bitvanes', '/walkthrough', 'scope=staged&style=expert')).toEqual({
      command: { scope: 'staged', style: 'expert' },
    });
  });

  it('tolerates a trailing slash on the path', () => {
    expect(parseWalkthroughUri('bitvanes.bitvanes', '/walkthrough/', 'scope=instant').command).toEqual({
      scope: 'instant',
    });
  });

  it('is case- and whitespace-tolerant on scope and style values', () => {
    expect(parseWalkthroughUri('bitvanes.bitvanes', '/walkthrough', 'scope=%20Working-Tree%20').command).toEqual({
      scope: 'working-tree',
    });
    expect(parseWalkthroughUri('bitvanes.bitvanes', '/walkthrough', 'scope=staged&style=LEARNER').command).toEqual({
      scope: 'staged',
      style: 'learner',
    });
  });

  it('ignores unknown query parameters', () => {
    expect(parseWalkthroughUri('bitvanes.bitvanes', '/walkthrough', 'scope=instant&foo=bar&baz=1').command).toEqual({
      scope: 'instant',
    });
  });

  it('rejects a missing scope', () => {
    const r = parseWalkthroughUri('bitvanes.bitvanes', '/walkthrough', '');
    expect(r.command).toBeUndefined();
    expect(r.error).toMatch(/scope/);
  });

  it('rejects an unknown scope', () => {
    const r = parseWalkthroughUri('bitvanes.bitvanes', '/walkthrough', 'scope=everything');
    expect(r.command).toBeUndefined();
    expect(r.error).toMatch(/unknown scope/);
  });

  it('rejects an unknown style', () => {
    const r = parseWalkthroughUri('bitvanes.bitvanes', '/walkthrough', 'scope=staged&style=telepathic');
    expect(r.command).toBeUndefined();
    expect(r.error).toMatch(/unknown style/);
  });

  it('rejects unknown paths', () => {
    expect(parseWalkthroughUri('bitvanes.bitvanes', '/', 'scope=instant').error).toBeDefined();
    expect(parseWalkthroughUri('bitvanes.bitvanes', '/walkthroughx', 'scope=instant').error).toBeDefined();
    expect(parseWalkthroughUri('bitvanes.bitvanes', '/walkthrough/extra', 'scope=instant').error).toBeDefined();
  });

  it('rejects a foreign authority', () => {
    const r = parseWalkthroughUri('bitvanes.bitvanes.evil', '/walkthrough', 'scope=instant');
    expect(r.command).toBeUndefined();
    expect(r.error).toMatch(/authority/);
  });
});
