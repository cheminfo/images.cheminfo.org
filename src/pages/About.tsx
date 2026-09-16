import type { ReactElement } from 'react';
import { AboutPage } from 'react-cheminfo/ui';

import { ABOUT } from '../about.ts';
import { BrandMark } from '../components/Brand.tsx';

/**
 * The About page, at `/about`.
 * @returns The About page.
 */
export function About(): ReactElement {
  return (
    <article className="page" data-testid="about">
      <AboutPage content={ABOUT} mark={<BrandMark size={56} />} />
    </article>
  );
}
