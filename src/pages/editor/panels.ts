import type { ActivityBarItemProps } from 'react-science/ui';

/** The side panels, in the order the activity bar and the stack show them. */
export const PANELS = [
  { id: 'images', title: 'Images', icon: 'media', defaultOpen: true },
  { id: 'adjust', title: 'Adjust', icon: 'contrast', defaultOpen: false },
  { id: 'output', title: 'Output', icon: 'export', defaultOpen: true },
] as const satisfies ReadonlyArray<{
  id: string;
  title: string;
  icon: ActivityBarItemProps['icon'];
  /** Whether the panel starts unfolded in the stack. */
  defaultOpen: boolean;
}>;

export type PanelId = (typeof PANELS)[number]['id'];

/** The panels open when the editor first shows, or is dragged back open. */
export const DEFAULT_PANELS: ReadonlySet<string> = new Set(
  PANELS.map((panel) => panel.id),
);
