import { afterEach, expect, test, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

/**
 * The site as a deployment stamped it, loaded fresh so its mount is read again.
 * @param baseUri - What `document.baseURI` reads on the page handed out.
 * @returns The module, bound to that mount.
 */
async function siteMountedAt(baseUri: string) {
  vi.stubGlobal('document', { baseURI: baseUri });
  vi.resetModules();
  return import('../site.ts');
}

test('a deployment on a host of its own writes its addresses unchanged', async () => {
  const site = await siteMountedAt('https://images.cheminfo.org/');

  expect(site.BASE_PATH).toBe('');
  expect(site.withBase('/')).toBe('/');
  expect(site.withBase('/about')).toBe('/about');
  expect(site.pathWithoutBase('/about')).toBe('/about');
});

test('a deployment mounted under a path writes every address under it', async () => {
  const site = await siteMountedAt('https://eln.epfl.ch/cheminfo/images/');

  expect(site.BASE_PATH).toBe('/cheminfo/images');
  expect(site.withBase('/')).toBe('/cheminfo/images/');
  expect(site.withBase('/about')).toBe('/cheminfo/images/about');
  expect(site.pathWithoutBase('/cheminfo/images/about')).toBe('/about');
  expect(site.pathWithoutBase('/cheminfo/images')).toBe('/');
});

test('the same build serves both addresses, because the mount is not built in', async () => {
  const own = await siteMountedAt('https://images.cheminfo.org/');
  const shared = await siteMountedAt('https://eln.epfl.ch/cheminfo/images/');

  expect(own.withBase('/about')).toBe('/about');
  expect(shared.withBase('/about')).toBe('/cheminfo/images/about');
});

test('a page of another tool on the shared host is not read as one of ours', async () => {
  const site = await siteMountedAt('https://eln.epfl.ch/cheminfo/images/');

  expect(site.pathWithoutBase('/cheminfo/surge/exercises')).toBe(
    '/cheminfo/surge/exercises',
  );
  expect(site.pathWithoutBase('/cheminfo/imagesx')).toBe('/cheminfo/imagesx');
});
