import * as vscode from 'vscode';
import type { WalkthroughState } from '../director/EditorDirector';
import type { ModelStatusSummary } from '../llm/LlmManager';
import { getWebviewContent } from './getWebviewContent';
import type { InboundMessage, SidebarHandlers, SidebarStartMode } from './sidebarProtocol';

export class WalkthroughSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'bitvanes.stepsView';

  private view?: vscode.WebviewView;
  private lastState: WalkthroughState | null = null;
  private autoplay = false;
  private style = 'standard';
  private modelStatus: ModelStatusSummary | null = null;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly handlers: SidebarHandlers,
  ) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = { enableScripts: true, localResourceRoots: [this.extensionUri] };
    view.webview.html = getWebviewContent({ nonce: getNonce(), cspSource: view.webview.cspSource });
    view.webview.onDidReceiveMessage((m: InboundMessage) => {
      switch (m.t) {
        case 'next':
          this.handlers.next();
          break;
        case 'prev':
          this.handlers.prev();
          break;
        case 'jump':
          if (typeof m.i === 'number') this.handlers.jump(m.i);
          break;
        case 'autoplay':
          this.handlers.toggleAutoplay();
          break;
        case 'exit':
          this.handlers.exit();
          break;
        case 'browse':
          this.handlers.browse();
          break;
        case 'start':
          if (m.mode) this.handlers.start(m.mode as SidebarStartMode, typeof m.path === 'string' ? m.path : undefined);
          break;
        case 'style':
          if (m.s) this.handlers.setStyle(m.s);
          break;
        case 'configure':
          this.handlers.configure();
          break;
      }
    });
    this.sync();
  }

  setState(st: WalkthroughState | null): void {
    this.lastState = st;
    this.post({ t: 'state', plan: st?.plan ?? null, current: st?.current ?? 0 });
  }

  setAutoplay(on: boolean): void {
    this.autoplay = on;
    this.post({ t: 'autoplay', on });
  }

  setStyle(style: string): void {
    this.style = style;
    this.post({ t: 'style', s: style });
  }

  setModelStatus(status: ModelStatusSummary | null): void {
    this.modelStatus = status;
    this.post({ t: 'modelStatus', status });
  }

  reveal(): void {
    if (this.view) {
      this.view.show(false);
    } else {
      void vscode.commands.executeCommand(`${WalkthroughSidebarProvider.viewId}.focus`);
    }
  }

  private sync(): void {
    this.post({ t: 'state', plan: this.lastState?.plan ?? null, current: this.lastState?.current ?? 0 });
    this.post({ t: 'autoplay', on: this.autoplay });
    this.post({ t: 'style', s: this.style });
    if (this.modelStatus) this.post({ t: 'modelStatus', status: this.modelStatus });
  }

  private post(message: unknown): void {
    if (this.view) {
      void this.view.webview.postMessage(message);
    }
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += chars[Math.floor(Math.random() * chars.length)];
  }
  return nonce;
}
