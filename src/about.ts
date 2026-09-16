/**
 * What the site says about itself, as a record the shared `AboutPage` draws.
 *
 * The site is not listed in the family's Tools menu, so it hands the page its
 * own record rather than an id of `ECOSYSTEM_SITES`; everything else about the
 * page — the sections, their order, the credits and the licence block — belongs
 * to the family.
 */

import { BUILD_INFO } from 'react-cheminfo/build-info';
import type { AboutContent } from 'react-cheminfo/core';

import { IMAGES_SITE } from './site.ts';

/** The record the `/about` page and the editor's About dialog are drawn from. */
export const ABOUT: AboutContent = {
  siteId: IMAGES_SITE,
  // Which release, built when, from which commit: the build says so,
  // because a version written by hand is wrong by the next release.
  build: BUILD_INFO,
  what: 'Prepare photos for a web page, a report or an e-mail without installing anything.',
  can: [
    'Drop images, folders or ZIP archives of images.',
    'Rotate, flip, straighten and crop each image.',
    'Adjust exposure, contrast, gamma, saturation, hue and warmth.',
    'Resize, choose JPEG quality or PNG, and compare it with the lossless image.',
    'Drop a folder on Auto and get it back resized, as one ZIP.',
  ],
  paragraphs: [
    'Your images never leave your computer: they are decoded, edited and encoded in your browser. The output carries no EXIF metadata, so location and camera details are not shared by accident.',
  ],
  credits: [
    'file-collection',
    'react-roi',
    'zip-js',
    'react-science',
    'react-cheminfo',
    'blueprint',
    'preact-signals',
    'react',
    'vite',
  ],
};
