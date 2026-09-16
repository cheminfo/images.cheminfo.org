import react from '@vitejs/plugin-react';
import { cheminfoBuildInfo, cheminfoPrerender } from 'react-cheminfo/vite';
import { defineConfig } from 'vite';

import { PAGE_ROUTES } from './src/seo/routes.ts';
import { IMAGES_SITE } from './src/site.ts';

// 2026-09-15 gives 60915, over 60000, so 50000 comes off. Docker publishes the
// same number through `PORT`, and two checkouts must not share Vite's 5173.
const port = Number(process.env.PORT ?? 10_915);

export default defineConfig({
  // The build carries no mount path. Every asset is written relative, so the
  // one `dist` serves this site's own host and a path of a shared one without
  // being rebuilt: the `<base>` the page carries is what resolves them, and the
  // router reads its mount back off that.
  base: './',
  plugins: [
    react(),
    cheminfoBuildInfo(),
    cheminfoPrerender({
      site: IMAGES_SITE,
      routes: PAGE_ROUTES,
      category: 'MultimediaApplication',
      operatingSystem: 'Any modern browser',
      noscript: {
        // The build bakes in no mount, so the crawl path is written against the
        // `<base>` the page carries rather than the root of a host this
        // deployment may only share.
        hrefs: 'relative',
      },
    }),
  ],
  worker: { format: 'es' },
  server: { port, strictPort: true },
  preview: { port, strictPort: true },
});
