import { signal } from '@preact/signals-react';

import type { ImageEntry } from '../imaging/readFiles.ts';
import type { EditSettings } from '../imaging/settings.ts';

/** What was dropped, and what was done to it. Never persisted. */
export const data = {
  images: signal<ImageEntry[]>([]),
  /** Edits per image id; an image without an entry is unedited. */
  edits: signal<Record<string, EditSettings>>({}),
  /** Files of the last drop that were not images a browser can read. */
  skipped: signal(0),
};
