import type { EcosystemSite, SiteId } from 'react-cheminfo/core';

/** Where the sources live. */
export const REPOSITORY = 'https://github.com/cheminfo/images.cheminfo.org';

/** One line on what the site does. */
export const TAGLINE =
  'Crop, rotate, adjust, resize and compress images, in your browser.';

/**
 * The site's own record, in the shape the family's SEO helpers read.
 *
 * It is deliberately not part of `ECOSYSTEM_SITES`: this site is not listed in
 * the Tools menu of the other sites and links to none of them, so its id is
 * not one of the family's.
 */
export const IMAGES_SITE: EcosystemSite = {
  id: 'images' as SiteId,
  name: { lead: 'images', alt: 'cheminfo', dot: true },
  host: 'images.cheminfo.org',
  repository: REPOSITORY,
  group: 'computing',
  tagline: TAGLINE,
  brand: '#a21caf',
  brandAlt: '#b45309',
  mark: { plate: '#a21caf', accent: '#f59e0b' },
};
