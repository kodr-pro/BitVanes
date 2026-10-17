export function getWebviewContent(opts: { nonce: string; cspSource: string }): string {
  const { nonce, cspSource } = opts;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<style nonce="${nonce}">
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    font-family: var(--vscode-font-family);
    font-size: 13px;
    color: var(--vscode-sideBar-foreground, var(--vscode-editor-foreground));
    background: var(--vscode-sideBar-background);
    margin: 0;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .card {
    background: var(--vscode-editorWidget-background, var(--vscode-sideBar-background));
    border: 1px solid var(--vscode-widget-border, rgba(128,128,128,.25));
    border-radius: 10px;
    padding: 12px;
  }
  .row { display: flex; align-items: center; gap: 8px; }
  .spread { justify-content: space-between; }
  .grow { flex: 1; min-width: 0; }
  .muted { opacity: .7; font-size: 11px; }
  .mono { font-family: var(--vscode-editor-font-family, monospace); }
  button {
    font-family: inherit; font-size: 12px;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 7px 12px; border: none; border-radius: 7px; cursor: pointer;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
  }
  button:hover:not(:disabled) { outline: 1px solid var(--vscode-focusBorder); }
  button:disabled { opacity: .4; cursor: default; }
  button.sec { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
  button.icon { padding: 7px 9px; }
  button.mini { padding: 3px 8px; font-size: 11px; border-radius: 5px; }
  button svg { width: 14px; height: 14px; fill: currentColor; flex: none; }
  button.mini svg { width: 11px; height: 11px; }

  /* Tab strip */
  .tabs {
    display: flex; gap: 2px;
    border: 1px solid var(--vscode-widget-border, rgba(128,128,128,.25));
    border-radius: 9px; padding: 3px;
    background: var(--vscode-editorWidget-background, rgba(128,128,128,.06));
  }
  .tabs button {
    flex: 1; padding: 6px 10px; border-radius: 6px;
    background: transparent; color: inherit; font-size: 12px;
  }
  .tabs button:hover:not(.on) { background: var(--vscode-list-hoverBackground); }
  .tabs button.on {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    font-weight: 600;
  }
  .tabs button svg { width: 12px; height: 12px; }
  .tabs .n {
    font-size: 10px; padding: 0 6px; border-radius: 10px;
    background: var(--vscode-badge-background); color: var(--vscode-badge-foreground);
    margin-left: 4px;
  }
  .tabs button.on .n { background: rgba(255,255,255,.2); }

  .seg { display: flex; border: 1px solid var(--vscode-widget-border, rgba(128,128,128,.25)); border-radius: 8px; overflow: hidden; }
  .seg button { border-radius: 0; background: transparent; color: inherit; padding: 4px 9px; flex: 1; }
  .seg button.on { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); font-weight: 600; }

  .progress { display: flex; gap: 3px; margin: 10px 0 4px; }
  .bar { height: 6px; flex: 1; border-radius: 3px; background: var(--vscode-editorWidget-border, rgba(128,128,128,.25)); cursor: pointer; }
  .bar.done { background: var(--vscode-charts-blue, #38bdf8); opacity: .45; }
  .bar.cur { background: var(--vscode-charts-orange, #f59e0b); opacity: 1; }
  .counter { font-size: 11px; opacity: .8; white-space: nowrap; }
  .summary { font-size: 12px; opacity: .9; margin-top: 6px; line-height: 1.45; }
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10.5px; padding: 2px 8px; border-radius: 20px;
    background: var(--vscode-badge-background); color: var(--vscode-badge-foreground);
    white-space: nowrap;
  }
  .badge.mono { font-family: var(--vscode-editor-font-family, monospace); }
  .idx {
    font-family: var(--vscode-editor-font-family, monospace); font-size: 11px; font-weight: 600;
    background: var(--vscode-badge-background); color: var(--vscode-badge-foreground);
    min-width: 22px; height: 22px; border-radius: 6px;
    display: inline-flex; align-items: center; justify-content: center; flex: none;
  }
  .title { font-weight: 600; font-size: 13px; line-height: 1.35; }
  .expl { line-height: 1.55; margin-top: 8px; font-size: 12.5px; }
  code {
    font-family: var(--vscode-editor-font-family, monospace); font-size: 11.5px;
    background: var(--vscode-textCodeBlock-background, rgba(128,128,128,.14));
    border-radius: 4px; padding: 1px 5px;
  }
  .transition { display: flex; align-items: stretch; gap: 8px; margin-top: 10px; }
  .state {
    flex: 1; min-width: 0;
    font-family: var(--vscode-editor-font-family, monospace); font-size: 11.5px;
    background: var(--vscode-textCodeBlock-background, rgba(128,128,128,.14));
    border-radius: 7px; padding: 7px 9px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .state .lbl { display: block; font-size: 9.5px; opacity: .65; letter-spacing: .06em; margin-bottom: 2px; font-family: var(--vscode-font-family); }
  .arrow { align-self: center; opacity: .6; font-size: 14px; flex: none; }
  .warn {
    display: flex; gap: 8px; align-items: flex-start;
    margin-top: 10px; padding: 9px 11px; border-radius: 7px;
    background: rgba(245, 158, 11, .09);
    border-left: 3px solid var(--vscode-editorWarning-foreground, #f59e0b);
    line-height: 1.5;
  }
  .warn svg { width: 14px; height: 14px; fill: var(--vscode-editorWarning-foreground, #f59e0b); flex: none; margin-top: 2px; }

  /* Steps list */
  .steps { margin-top: 4px; }
  .step-row {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 8px; border-radius: 7px; cursor: pointer;
  }
  .step-row:hover { background: var(--vscode-list-hoverBackground); }
  .step-row.cur { background: var(--vscode-list-activeSelectionBackground); color: var(--vscode-list-activeSelectionForeground); }
  .step-row .t { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .step-row svg { width: 13px; height: 13px; fill: currentColor; opacity: .8; flex: none; }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--vscode-editorWarning-foreground, #f59e0b); flex: none; }
  .group-head {
    display: flex; align-items: center; gap: 6px;
    margin: 10px 2px 3px; cursor: pointer;
    font-size: 11px; opacity: .85;
  }
  .group-head:first-child { margin-top: 2px; }
  .group-head svg { width: 12px; height: 12px; fill: currentColor; opacity: .7; flex: none; }
  .group-head .gp { font-size: 11px; }
  .group-head:hover { opacity: 1; }

  /* Files list */
  .file-row {
    display: flex; align-items: center; gap: 8px;
    padding: 7px 8px; border-radius: 7px; cursor: pointer;
  }
  .file-row:hover { background: var(--vscode-list-hoverBackground); }
  .file-row.cur { background: var(--vscode-list-activeSelectionBackground); color: var(--vscode-list-activeSelectionForeground); }
  .file-row.dim { cursor: default; }
  .file-row .gp, .group-head .gp { display: flex; align-items: baseline; flex: 1; min-width: 0; gap: 2px; }
  .pd {
    direction: rtl; text-align: right;
    font-size: 11px; opacity: .7;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    flex: 0 10 auto; min-width: 2ch;
    font-family: var(--vscode-editor-font-family, monospace);
  }
  .pn { font-weight: 600; white-space: nowrap; flex: none; }
  .st {
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 10px; font-weight: 700; width: 18px; height: 18px;
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: 5px; flex: none;
  }
  .st.A { background: rgba(89, 186, 122, .18); color: var(--vscode-charts-green, #59ba7a); }
  .st.M { background: rgba(56, 189, 248, .16); color: var(--vscode-charts-blue, #38bdf8); }
  .st.D { background: rgba(248, 113, 113, .16); color: var(--vscode-charts-red, #f87171); }
  .st.R, .st.T, .st.U { background: rgba(192, 132, 252, .16); color: var(--vscode-charts-purple, #c084fc); }
  .fcov { font-size: 10.5px; opacity: .75; white-space: nowrap; flex: none; }
  .fbar { width: 44px; height: 4px; border-radius: 2px; background: var(--vscode-editorWidget-border, rgba(128,128,128,.25)); flex: none; overflow: hidden; }
  .fbar i { display: block; height: 100%; background: var(--vscode-charts-blue, #38bdf8); }
  .file-head {
    display: flex; align-items: baseline; gap: 8px;
    font-size: 11px; opacity: .7; margin: 2px 2px 6px;
  }
  .file-head .grow { flex: 1; }

  .logo { flex: none; }
  .hero { padding: 14px 10px 10px; }
  .brandname { font-weight: 700; font-size: 15px; letter-spacing: .01em; }
  .stack { display: flex; flex-direction: column; gap: 8px; }
  .stack button { width: 100%; padding: 9px 12px; justify-content: flex-start; }
  .stack .lab { flex: 1; min-width: 0; text-align: left; }
  .stack .sub { display: block; font-size: 10.5px; opacity: .7; font-weight: 400; margin-top: 1px; }
  .kv { margin-top: 8px; font-size: 11.5px; opacity: .85; }
  .sect { font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; opacity: .6; margin: 2px 2px 0; }
</style>
</head>
<body>
<div id="root"></div>
<script nonce="${nonce}">
(function () {
  var vscode = acquireVsCodeApi();
  var state = { plan: null, current: 0, autoplay: false, style: 'standard', tab: 'tour' };

  var I = {
    chevL: '<svg viewBox="0 0 16 16"><path d="M10.5 3 6 8l4.5 5 1-1L8 8l3.5-4z"/></svg>',
    chevR: '<svg viewBox="0 0 16 16"><path d="M5.5 3 10 8l-4.5 5-1-1L8 8 4.5 4z"/></svg>',
    play: '<svg viewBox="0 0 16 16"><path d="M5 3.2v9.6c0 .6.7 1 1.2.6l7-4.8c.5-.3.5-1 0-1.2l-7-4.8C5.7 2.2 5 2.6 5 3.2z"/></svg>',
    pause: '<svg viewBox="0 0 16 16"><rect x="4.5" y="3" width="2.6" height="10" rx="1"/><rect x="8.9" y="3" width="2.6" height="10" rx="1"/></svg>',
    shield: '<svg viewBox="0 0 16 16"><path d="M8 1.3 3.2 3.1v3.9c0 3.2 1.9 6 4.8 7.3 2.9-1.3 4.8-4.1 4.8-7.3V3.1L8 1.3zm0 1.6 3.4 1.3v2.8c0 2.4-1.4 4.6-3.4 5.6-2-1-3.4-3.2-3.4-5.6V4.2L8 2.9z"/></svg>',
    zap: '<svg viewBox="0 0 16 16"><path d="M9.5 1 3.5 9H7l-1 6 6.5-8H9l.5-6z"/></svg>',
    diff: '<svg viewBox="0 0 16 16"><path d="M2 3h2.5v1.5H2zM2 7h5.5v1.5H2zM2 11h3.5v1.5H2zM11 1v5h3V1h-3zm1 4h1V2h-1v3zM11 10v5h3v-5h-3zm1 4h1v-3h-1v3z"/></svg>',
    cursor: '<svg viewBox="0 0 16 16"><path d="M5 3 8.3 13l1.2-3.7 3.7-1.2L5 3zm4.9 6.1-.2.6-.6.2 2 3 1-.4-2.2-3.4z"/></svg>',
    exit: '<svg viewBox="0 0 16 16"><path d="M8 8.7 4.9 11.8l-.7-.7L7.3 8 4.2 4.9l.7-.7L8 7.3l3.1-3.1.7.7L8.7 8l3.1 3.1-.7.7L8 8.7z"/></svg>',
    list: '<svg viewBox="0 0 16 16"><path d="M2.5 3.5h11V5h-11zM2.5 7.5h11V9h-11zM2.5 11.5h7V13h-7z"/></svg>',
    file: '<svg viewBox="0 0 16 16"><path d="M9.5 1H3.5C2.7 1 2 1.7 2 2.5v11c0 .8.7 1.5 1.5 1.5h9c.8 0 1.5-.7 1.5-1.5V5.5L9.5 1zm0 1.6L12.4 5.5H9.5V2.6zM12.5 14h-9v-11h5v3.5h4V14z"/></svg>',
    stepIn: '<svg viewBox="0 0 16 16"><path d="M2 3h5v1.4H3.4v7.2H7V13H2V3zm7.6 1.4L8.8 5.2 10.6 7H5.5v2h5.1l-1.8 1.8.8.8L13.3 8l-3.7-3.6z"/></svg>'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function md(s) {
    return esc(s)
      .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
      .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
  }
  function actionGlyph(a) {
    return { init: I.play, pass: I.chevR, validate: I.shield, mutate: I.zap, commit: I.diff, 'return': I.exit }[a] || I.chevR;
  }
  function fileBase(p) { var parts = String(p).split('/'); return parts[parts.length - 1] || p; }
  function fileDir(p) {
    var parts = String(p).split('/');
    return parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';
  }
  function filePathSpans(p) {
    var dir = fileDir(p);
    return '<span class="gp">' +
      (dir ? '<span class="pd">' + esc(dir) + '</span>' : '') +
      '<span class="pn">' + esc(fileBase(p)) + '</span></span>';
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var act = el.getAttribute('data-act');
    if (act === 'next') vscode.postMessage({ t: 'next' });
    else if (act === 'prev') vscode.postMessage({ t: 'prev' });
    else if (act === 'jump') vscode.postMessage({ t: 'jump', i: parseInt(el.getAttribute('data-i'), 10) });
    else if (act === 'autoplay') vscode.postMessage({ t: 'autoplay' });
    else if (act === 'exit') vscode.postMessage({ t: 'exit' });
    else if (act === 'browse') vscode.postMessage({ t: 'browse' });
    else if (act === 'start') vscode.postMessage({ t: 'start', mode: el.getAttribute('data-mode') });
    else if (act === 'style') vscode.postMessage({ t: 'style', s: el.getAttribute('data-s') });
    else if (act === 'tab') {
      state.tab = el.getAttribute('data-tab');
      render();
    } else if (act === 'file-jump') {
      var fi = el.getAttribute('data-i');
      if (fi !== null && fi !== '') {
        vscode.postMessage({ t: 'jump', i: parseInt(fi, 10) });
        state.tab = 'tour';
        render();
      }
    } else if (act === 'file-walk') {
      vscode.postMessage({ t: 'start', mode: 'file', path: el.getAttribute('data-path') });
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') vscode.postMessage({ t: 'next' });
    else if (e.key === 'ArrowLeft') vscode.postMessage({ t: 'prev' });
  });
  window.addEventListener('message', function (e) {
    var m = e.data || {};
    if (m.t === 'state') { state.plan = m.plan; state.current = m.current; render(); }
    else if (m.t === 'autoplay') { state.autoplay = m.on; render(); }
    else if (m.t === 'style') { state.style = m.s; render(); }
  });

  function render() {
    document.getElementById('root').innerHTML = state.plan ? renderPlan() : renderWelcome();
  }

  function logoSvg(size) {
    return '<svg class="logo" width="' + size + '" height="' + size + '" viewBox="0 0 128 128"><rect x="4" y="4" width="120" height="120" rx="26" fill="none" stroke="currentColor" stroke-width="6" opacity=".35"/><rect x="26" y="34" width="34" height="9" rx="4.5" fill="currentColor" opacity=".8"/><rect x="16" y="59.5" width="44" height="9" rx="4.5" fill="currentColor"/><rect x="26" y="85" width="34" height="9" rx="4.5" fill="currentColor" opacity=".8"/><path d="M72 22 L122 64 L72 106 Z" fill="currentColor" opacity=".9"/></svg>';
  }

  function renderWelcome() {
    var h = '';
    h += '<div class="card hero"><div class="row" style="justify-content:center">' + logoSvg(40);
    h += '<span class="brandname">BitVanes</span></div></div>';
    h += '<div class="sect">Start</div>';
    h += '<div class="card stack">';
    h += '<button data-act="start" data-mode="instant">' + I.zap + '<span class="lab">Instant walkthrough<span class="sub">Local AST analysis — no AI, under a second</span></span></button>';
    h += '<button data-act="start" data-mode="diff">' + I.diff + '<span class="lab">Working tree changes<span class="sub">Every pending file, walked file by file</span></span></button>';
    h += '<button data-act="start" data-mode="staged">' + I.diff + '<span class="lab">Staged changes<span class="sub">What you are about to commit</span></span></button>';
    h += '<button data-act="start" data-mode="file">' + I.file + '<span class="lab">One changed file…<span class="sub">Pick a file and walk it in depth</span></span></button>';
    h += '<button data-act="start" data-mode="selection">' + I.cursor + '<span class="lab">Code path at cursor<span class="sub">Trace a function from entry to return</span></span></button>';
    h += '</div>';
    h += '<div class="card"><div class="row spread"><span class="muted">Style</span>';
    h += styleSeg();
    h += '</div><div class="kv muted">Explanations tuned per audience — Learner explains syntax &amp; jargon for AI-generated code.</div></div>';
    return h;
  }

  function styleSeg() {
    var opts = [['expert', 'Expert'], ['standard', 'Std'], ['learner', 'Learner']];
    var h = '<div class="seg">';
    for (var i = 0; i < opts.length; i++) {
      h += '<button data-act="style" data-s="' + opts[i][0] + '" class="' + (state.style === opts[i][0] ? 'on' : '') + '">' + opts[i][1] + '</button>';
    }
    return h + '</div>';
  }

  function renderPlan() {
    var p = state.plan;
    var cur = p.steps[state.current] || p.steps[0];
    var multiFile = p.files && p.files.length > 0;
    var h = '';

    if (multiFile) {
      h += '<div class="tabs">';
      h += '<button data-act="tab" data-tab="tour" class="' + (state.tab === 'tour' ? 'on' : '') + '">' + I.list + 'Tour</button>';
      h += '<button data-act="tab" data-tab="files" class="' + (state.tab === 'files' ? 'on' : '') + '">' + I.file + 'Files<span class="n">' + p.files.length + '</span></button>';
      h += '</div>';
    }

    h += '<div class="card">';
    h += '<div class="row spread"><div class="seg">' +
      [['expert','Expert'],['standard','Std'],['learner','Learner']].map(function(o){
        return '<button data-act="style" data-s="' + o[0] + '" class="' + (state.style === o[0] ? 'on' : '') + '">' + o[1] + '</button>';
      }).join('') + '</div>';
    h += '<button class="icon sec" data-act="exit" title="Exit walkthrough">' + I.exit + '</button></div>';
    h += '<div class="title" style="margin-top:10px">' + esc(cur.title) + '</div>';
    h += '<div class="summary">' + md(p.summary) + '</div>';
    h += '<div class="kv"><span class="badge mono">' + esc(p.entryPoint) + '</span></div>';
    h += '</div>';

    h += '<div class="card">';
    h += '<div class="row">';
    h += '<button class="icon" data-act="prev" ' + (state.current === 0 ? 'disabled' : '') + ' title="Previous (alt+[)">' + I.chevL + '</button>';
    h += '<button class="icon ' + (state.autoplay ? 'sec' : '') + '" data-act="autoplay" title="Toggle autoplay">' + (state.autoplay ? I.pause : I.play) + '</button>';
    h += '<button class="icon" data-act="next" ' + (state.current >= p.totalSteps - 1 ? 'disabled' : '') + ' title="Next (alt+])">' + I.chevR + '</button>';
    h += '<div class="grow"></div>';
    h += '<span class="counter">Step ' + (state.current + 1) + ' of ' + p.totalSteps + '</span>';
    h += '</div>';
    h += '<div class="progress">';
    for (var i = 0; i < p.totalSteps; i++) {
      var cls = i === state.current ? 'cur' : i < state.current ? 'done' : '';
      h += '<div class="bar ' + cls + '" data-act="jump" data-i="' + i + '" title="' + esc((i + 1) + '. ' + p.steps[i].title) + '"></div>';
    }
    h += '</div>';
    h += '</div>';

    if (state.tab === 'files' && multiFile) {
      h += renderFilesTab();
    } else {
      h += renderTourTab();
    }

    return h;
  }

  function renderTourTab() {
    var p = state.plan;
    var cur = p.steps[state.current] || p.steps[0];
    var h = '';

    h += '<div class="card">';
    h += '<div class="row"><span class="idx">' + (state.current + 1) + '</span>';
    if (cur.variable) h += '<span class="badge">' + actionGlyph(cur.variable.action) + esc(cur.variable.action) + '</span>';
    h += '<span class="badge mono">' + esc(fileBase(cur.filePath)) + ':' + cur.range.startLine + '</span>';
    h += '</div>';
    if (cur.variable) {
      var v = cur.variable;
      var hasT = v.stateBefore !== undefined || v.stateAfter !== undefined;
      if (hasT) {
        h += '<div class="transition">';
        h += '<div class="state"><span class="lbl">' + esc(v.name) + ' · BEFORE</span>' + esc(v.stateBefore == null ? '?' : v.stateBefore) + '</div>';
        h += '<span class="arrow">&#10132;</span>';
        h += '<div class="state"><span class="lbl">AFTER</span>' + esc(v.stateAfter == null ? '?' : v.stateAfter) + '</div>';
        h += '</div>';
      } else {
        h += '<div class="kv"><span class="badge mono">' + esc(v.name) + '</span> <span class="badge">' + esc(v.action) + '</span></div>';
      }
    }
    h += '<div class="expl">' + md(cur.explanation) + '</div>';
    if (cur.securityNote) {
      h += '<div class="warn">' + I.shield + '<div><strong>Security</strong> — ' + md(cur.securityNote) + '</div></div>';
    }
    h += '</div>';

    h += '<div class="card steps">';
    h += '<div class="row spread" style="margin-bottom:6px"><span class="muted">Steps</span>';
    h += '<button class="sec mini" data-act="browse">' + I.list + 'Browse</button></div>';

    var lastFile = null;
    var fileSet = {};
    for (var q = 0; q < p.steps.length; q++) fileSet[p.steps[q].filePath] = 1;
    var multiFileSteps = Object.keys(fileSet).length > 1;
    for (var j = 0; j < p.steps.length; j++) {
      var s = p.steps[j];
      if (multiFileSteps && s.filePath !== lastFile) {
        lastFile = s.filePath;
        h += '<div class="group-head" data-act="jump" data-i="' + j + '" title="Jump to ' + esc(s.filePath) + '">';
        h += I.file + filePathSpans(s.filePath);
        h += '</div>';
      }
      h += '<div class="step-row' + (j === state.current ? ' cur' : '') + '" data-act="jump" data-i="' + j + '">';
      h += '<span class="idx">' + (j + 1) + '</span>';
      h += '<span class="t">' + esc(s.title) + '</span>';
      if (s.variable) h += '<span class="badge mono">' + esc(s.variable.name) + '</span>';
      if (s.securityNote) h += '<span class="dot" title="security note"></span>';
      h += '</div>';
    }
    h += '</div>';

    return h;
  }

  function renderFilesTab() {
    var p = state.plan;
    var cur = p.steps[state.current] || p.steps[0];
    var coveredFiles = 0;
    for (var c = 0; c < p.files.length; c++) {
      if (p.files[c].stepCount > 0) coveredFiles++;
    }
    var h = '';
    h += '<div class="card">';
    h += '<div class="file-head"><span>Changed files</span><span class="grow"></span>';
    h += '<span class="muted">' + coveredFiles + ' of ' + p.files.length + ' in this tour</span></div>';

    for (var i = 0; i < p.files.length; i++) {
      var f = p.files[i];
      var isCur = cur && f.path === cur.filePath;
      var covered = f.stepCount > 0;
      var done = 0;
      for (var k = 0; k < p.steps.length; k++) {
        if (p.steps[k].filePath === f.path && k <= state.current) done++;
      }
      h += '<div class="file-row' + (isCur ? ' cur' : '') + (covered ? '' : ' dim') + '"' +
        (covered ? ' data-act="file-jump" data-i="' + f.firstStepIndex + '" title="Jump to this file\u2019s steps"' : ' title="No steps in this tour — walkthrough it alone"') + '>';
      h += '<span class="st ' + esc(f.status) + '">' + esc(f.status) + '</span>';
      h += filePathSpans(f.path);
      if (covered) {
        h += '<span class="fbar" title="' + done + ' of ' + f.stepCount + ' steps done"><i style="width:' + (f.stepCount ? Math.round(100 * done / f.stepCount) : 0) + '%"></i></span>';
        h += '<span class="fcov">' + f.stepCount + ' step' + (f.stepCount === 1 ? '' : 's') + '</span>';
      } else {
        h += '<span class="fcov">not in tour</span>';
      }
      h += '<button class="sec mini" data-act="file-walk" data-path="' + esc(f.path) + '" title="Walkthrough this file alone">' + I.stepIn + '</button>';
      h += '</div>';
    }
    h += '<div class="kv muted">Click a covered file to jump to its steps. ' + I.stepIn + ' walks a single file in depth.</div>';
    h += '</div>';
    return h;
  }

  render();
})();
</script>
</body>
</html>`;
}
