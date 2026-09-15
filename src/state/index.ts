import type { EditSettings } from '../imaging/settings.ts';
import { DEFAULT_EDIT } from '../imaging/settings.ts';

import { data } from './data.ts';
import { preferences } from './preferences.ts';
import { view } from './view.ts';

/** The one global state of the app. */
export const state = { data, view, preferences };

/**
 * Open or close one side panel of the editor.
 * @param id - The panel.
 */
export function togglePanel(id: string): void {
  const panels = new Set(view.panels.peek());
  if (panels.has(id)) panels.delete(id);
  else panels.add(id);
  view.panels.value = panels;
}

/**
 * The edits of an image.
 * @param id - The image.
 * @returns Its edits, or the defaults when it has none.
 */
export function editOf(id: string): EditSettings {
  return data.edits.value[id] ?? DEFAULT_EDIT;
}

/**
 * Change the edits of an image. Turning or flipping it drops its crop, which
 * was drawn on the frame as it was; a free rotation keeps it, as a share of
 * the area still inside the image.
 * @param id - The image.
 * @param change - The settings that change.
 */
export function updateEdit(id: string, change: Partial<EditSettings>): void {
  const current = editOf(id);
  const reframed =
    (change.rotation !== undefined && change.rotation !== current.rotation) ||
    (change.flipHorizontal !== undefined &&
      change.flipHorizontal !== current.flipHorizontal) ||
    (change.flipVertical !== undefined &&
      change.flipVertical !== current.flipVertical);
  const next = { ...current, ...change };
  if (reframed && change.crop === undefined) next.crop = null;
  data.edits.value = { ...data.edits.value, [id]: next };
}
