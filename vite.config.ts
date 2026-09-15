import react from '@vitejs/plugin-react';
import { cheminfoPrerender } from 'react-cheminfo/vite';
import { defineConfig } from 'vite';

import { PAGE_ROUTES } from './src/seo/routes.ts';
import { IMAGES_SITE } from './src/site.ts';

// 2026-09-15 gives 60915, over 60000, so 50000 comes off. Docker publishes the
// same number through `PORT`, and two checkouts must not share Vite's 5173.
const port = Number(process.env.PORT ?? 10_915);

export default defineConfig({
  plugins: [
    react(),
    cheminfoPrerender({
      site: IMAGES_SITE,
      routes: PAGE_ROUTES,
      category: 'MultimediaApplication',
      operatingSystem: 'Any modern browser',
    }),
  ],
  worker: { format: 'es' },
  server: { port, strictPort: true },
  preview: { port, strictPort: true },
});
