import { createTabRouter } from 'react-cheminfo/core';

import { BASE_PATH } from './state/site.ts';

/** The pages of the site; the editor lives at `/`. */
export type Tab = 'edit' | 'auto' | 'about';

export const router = createTabRouter<Tab>({
  tabs: ['edit', 'auto', 'about'],
  home: 'edit',
  // Where this deployment is mounted, read off the page's `<base>`. The router
  // strips it when it parses and puts it back when it formats, so every link
  // the header writes and every address the history carries stays under the
  // mount.
  basePath: BASE_PATH,
});
