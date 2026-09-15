import type { RouteMeta } from 'react-cheminfo/core';

/** Every address the site answers, with the head it is indexed under. */
export const PAGE_ROUTES: RouteMeta[] = [
  {
    path: '/',
    title: 'Crop, rotate and compress images',
    short: 'Edit',
    description:
      'Crop, rotate, straighten and colour-correct photos, then resize and compress them to JPEG or PNG. Runs in your browser; nothing is uploaded.',
  },
  {
    path: '/auto',
    title: 'Batch resize images to JPEG or PNG',
    short: 'Auto',
    description:
      'Drop images or whole folders and get them back resized, as JPEG at the quality you choose or as PNG, zipped with their folders kept.',
  },
  {
    path: '/about',
    title: 'About',
    description:
      'What images.cheminfo.org does with your photos, what it is built on, its licence and source code, and where to report a problem.',
  },
];
