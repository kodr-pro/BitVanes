import { describe, expect, it } from 'vitest';
import { getWebviewContent } from '../src/views/getWebviewContent';

describe('getWebviewContent', () => {
  const html = getWebviewContent({ nonce: 'testnonce123', cspSource: 'https://src.vscode-cdn.net' });

  it('locks scripts and styles behind the nonce in a strict CSP', () => {
    expect(html).toContain(`script-src 'nonce-testnonce123'`);
    expect(html).toContain(`style-src https://src.vscode-cdn.net 'nonce-testnonce123'`);
    expect(html).toContain("default-src 'none'");
    expect(html.match(/nonce="testnonce123"/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('does not leak unresolved template placeholders', () => {
    expect(html).not.toContain('${');
  });

  it('boots the client renderer against the root node', () => {
    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('acquireVsCodeApi()');
  });

  it('escapes nothing that would break out of the script nonce boundary', () => {
    const nonceCount = (html.match(/<script/g) ?? []).length;
    expect(nonceCount).toBe(1);
  });

  it('ships the Files tab and per-file walkthrough affordances', () => {
    expect(html).toContain('data-act="tab"');
    expect(html).toContain('data-tab="files"');
    expect(html).toContain('data-act="file-walk"');
    expect(html).toContain('data-act="file-jump"');
    expect(html).toContain("mode: 'file'");
  });

  it('drops the "guided tour" tagline — users know what they installed', () => {
    expect(html).not.toContain('guided tour');
    expect(html).not.toContain('didn&rsquo;t write');
  });
});
