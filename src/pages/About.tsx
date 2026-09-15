import type { ReactElement } from 'react';
import type { CreditEntry } from 'react-cheminfo/core';
import { credits } from 'react-cheminfo/core';
import { CreditsList } from 'react-cheminfo/ui';

import { BrandMark, Wordmark } from '../components/Brand.tsx';
import { REPOSITORY, TAGLINE } from '../site.ts';

const CREDITS: CreditEntry[] = [
  {
    id: 'file-collection',
    name: 'file-collection',
    href: 'https://github.com/cheminfo/file-collection',
    description: 'Reads dropped files, folders and ZIP archives.',
    license: 'MIT',
  },
  {
    id: 'react-roi',
    name: 'react-roi',
    href: 'https://github.com/zakodium-oss/react-roi',
    description: 'Draws the crop box.',
    license: 'MIT',
  },
  {
    id: 'zip.js',
    name: 'zip.js',
    href: 'https://github.com/gildas-lormeau/zip.js',
    description: 'Writes the ZIP archive of the results.',
    license: 'BSD-3-Clause',
  },
  ...credits([
    'react-science',
    'react-cheminfo',
    'blueprint',
    'preact-signals',
    'react',
    'vite',
  ]),
];

const CAN = [
  'Drop images, folders or ZIP archives of images.',
  'Rotate, flip, straighten and crop each image.',
  'Adjust exposure, contrast, gamma, saturation, hue and warmth.',
  'Resize, choose JPEG quality or PNG, and compare it with the lossless image.',
  'Drop a folder on Auto and get it back resized, as one ZIP.',
];

/**
 * The About page, at `/about`.
 * @returns The About page.
 */
export function About(): ReactElement {
  return (
    <article className="page" data-testid="about">
      <AboutContent />
    </article>
  );
}

/**
 * What the site is, what it is built on, and where its sources are. Shared by
 * the `/about` page and the editor's About dialog.
 * @returns The About content.
 */
export function AboutContent(): ReactElement {
  return (
    <div className="about">
      <div className="about__hero">
        <BrandMark size={56} />
        <div>
          <h1>
            <Wordmark />
          </h1>
          <p className="page-lead">{TAGLINE}</p>
        </div>
      </div>
      <p>
        Prepare photos for a web page, a report or an e-mail without installing
        anything.
      </p>

      <h2>What you can do here</h2>
      <ul>
        {CAN.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p>
        Your images never leave your computer: they are decoded, edited and
        encoded in your browser. The output carries no EXIF metadata, so
        location and camera details are not shared by accident.
      </p>

      <h2>Built on</h2>
      <CreditsList entries={CREDITS} />

      <h2>Licence and source</h2>
      <p>
        MIT licensed. The sources are at{' '}
        <a href={REPOSITORY} target="_blank" rel="noreferrer noopener">
          {REPOSITORY.replace('https://', '')}
        </a>
        .
      </p>

      <h2>Found a problem?</h2>
      <p>
        <a
          href={`${REPOSITORY}/issues`}
          target="_blank"
          rel="noreferrer noopener"
        >
          Open an issue
        </a>{' '}
        with the browser you use and, if you can, the image that failed.
      </p>
    </div>
  );
}
