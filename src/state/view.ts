import { signal } from '@preact/signals-react';

import type { ExportResult } from '../imaging/exportImages.ts';

/** Cross-component state of the screen. Never persisted. */
export const view = {
  selectedId: signal<string | null>(null),
  /** The side panels of the editor that are open. */
  panels: signal<ReadonlySet<string>>(new Set(['images', 'adjust', 'output'])),
  cropping: signal(false),
  /** The rotation being dragged, applied when let go; `null` when none is. */
  straightening: signal<number | null>(null),
  /** Whether the preview shows the output beside its lossless version. */
  comparing: signal(false),
  /** The crop shape: `Free`, `Original`, or a ratio written `4:3`. */
  cropAspect: signal('Free'),
  /** Progress of a batch being rendered, `null` when none runs. */
  progress: signal<{ done: number; total: number } | null>(null),
  /** Why the last batch or drop failed, `null` when it did not. */
  error: signal<string | null>(null),
  autoResults: signal<ExportResult[]>([]),
};
