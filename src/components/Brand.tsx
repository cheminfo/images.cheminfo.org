import type { ReactElement } from 'react';

/**
 * The mark: a landscape under an amber sun, on the fuchsia plate.
 * `public/favicon.svg` is the same drawing with literal colours.
 * @param props - Edge of the square, in pixels.
 * @returns The mark, as an inline SVG.
 */
export function BrandMark(props: { size?: number }): ReactElement {
  const { size = 28 } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="7" fill="var(--brand)" />
      <circle cx="21.5" cy="10.5" r="3.5" fill="var(--brand-alt)" />
      <path d="M4 25 12.5 13 18 20.5 21 17 28 25Z" fill="#ffffff" />
    </svg>
  );
}

/**
 * The name in the site's two colours.
 * @returns The wordmark.
 */
export function Wordmark(): ReactElement {
  return (
    <span className="wordmark">
      <span className="wordmark__lead">images</span>
      <span className="wordmark__dot">.</span>
      <span className="wordmark__alt">cheminfo</span>
    </span>
  );
}
