export type SidebarStartMode = 'diff' | 'staged' | 'selection' | 'instant' | 'file';

export interface SidebarHandlers {
  next(): void;
  prev(): void;
  jump(index: number): void;
  toggleAutoplay(): void;
  exit(): void;
  browse(): void;
  start(mode: SidebarStartMode, arg?: string): void;
  setStyle(style: string): void;
}

export interface InboundMessage {
  t: string;
  i?: number;
  mode?: SidebarStartMode;
  /** File path (repo-relative) for mode === 'file'. */
  path?: string;
  s?: string;
}
