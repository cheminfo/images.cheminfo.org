import type { MouseEvent, ReactElement } from 'react';
import { useEffect } from 'react';
import {
  pageDocumentMeta,
  writeDocumentMeta,
  writeRoute,
} from 'react-cheminfo/core';
import { NavLink, useTabRoute } from 'react-cheminfo/ui';

import { BrandMark, Wordmark } from './components/Brand.tsx';
import { About } from './pages/About.tsx';
import { Auto } from './pages/Auto.tsx';
import { Editor } from './pages/Editor.tsx';
import type { Tab } from './router.ts';
import { router } from './router.ts';
import { PAGE_ROUTES } from './seo/routes.ts';
import { IMAGES_SITE } from './site.ts';

const PAGES: Array<{ tab: Tab; label: string; title: string }> = [
  { tab: 'edit', label: 'Edit', title: 'Crop, rotate and adjust images' },
  { tab: 'auto', label: 'Auto', title: 'Resize a whole folder at once' },
];

/**
 * The shell: the header, and the page the address names.
 * @returns The application.
 */
export function App(): ReactElement {
  const { tab } = useTabRoute(router);

  useEffect(() => {
    writeDocumentMeta(
      pageDocumentMeta({
        site: IMAGES_SITE,
        routes: PAGE_ROUTES,
        url: router.format({ tab }),
      }),
    );
  }, [tab]);

  return (
    <>
      <header className="app-header">
        <div className="app-header__inner app-header__inner--full">
          <a
            href="/"
            className="brand"
            title={IMAGES_SITE.host}
            onClick={(event) => {
              follow(event, 'edit');
            }}
          >
            <BrandMark />
            <Wordmark />
          </a>
          <nav className="app-header-nav">
            {PAGES.map((page) => (
              <NavLink
                key={page.tab}
                active={tab === page.tab}
                item={{
                  id: page.tab,
                  label: page.label,
                  title: page.title,
                  href: router.format({ tab: page.tab }),
                  onSelect: () => writeRoute(router, { tab: page.tab }),
                }}
              />
            ))}
          </nav>
          <div className="app-header-actions">
            <NavLink
              active={tab === 'about'}
              item={{
                id: 'about',
                label: 'About',
                title: 'What this site does with your images',
                href: router.format({ tab: 'about' }),
                onSelect: () => writeRoute(router, { tab: 'about' }),
              }}
            />
          </div>
        </div>
      </header>
      <main className="app-main" data-testid={`page-${tab}`}>
        {tab === 'auto' ? <Auto /> : tab === 'about' ? <About /> : <Editor />}
      </main>
    </>
  );
}

function follow(event: MouseEvent, tab: Tab): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
    return;
  }
  event.preventDefault();
  writeRoute(router, { tab });
}
