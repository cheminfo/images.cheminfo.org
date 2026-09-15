import { createTabRouter } from 'react-cheminfo/core';

/** The pages of the site; the editor lives at `/`. */
export type Tab = 'edit' | 'auto' | 'about';

export const router = createTabRouter<Tab>({
  tabs: ['edit', 'auto', 'about'],
  home: 'edit',
});
