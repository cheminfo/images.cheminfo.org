import { expect, test } from 'vitest';

import type { DirectoryLike } from '../deliver.ts';
import { writeToDirectory } from '../deliver.ts';

function fakeFolder(existing: string[]) {
  const files = new Map<string, Blob>();
  for (const path of existing) files.set(path, new Blob(['old']));

  function at(prefix: string): DirectoryLike {
    return {
      getDirectoryHandle: (name) => Promise.resolve(at(`${prefix}${name}/`)),
      getFileHandle: (name, options) => {
        const path = `${prefix}${name}`;
        if (!files.has(path) && !options?.create) {
          return Promise.reject(new DOMException(path, 'NotFoundError'));
        }
        return Promise.resolve({
          createWritable: () =>
            Promise.resolve({
              write: (data: Blob) => {
                files.set(path, data);
                return Promise.resolve();
              },
              close: () => Promise.resolve(),
            }),
        });
      },
    };
  }
  return { root: at(''), files };
}

test('files are written into their subfolders', async () => {
  const { root, files } = fakeFolder([]);
  const written = await writeToDirectory(root, [
    { path: 'trip/day 1/a.jpg', blob: new Blob(['a']) },
    { path: 'b.png', blob: new Blob(['b']) },
  ]);
  expect(written).toStrictEqual(['trip/day 1/a.jpg', 'b.png']);
  expect(await files.get('trip/day 1/a.jpg')?.text()).toBe('a');
  expect(await files.get('b.png')?.text()).toBe('b');
});

test('a file already in the folder is never replaced', async () => {
  const { root, files } = fakeFolder(['a.jpg', 'a (2).jpg']);
  const written = await writeToDirectory(root, [
    { path: 'a.jpg', blob: new Blob(['new']) },
  ]);
  expect(written).toStrictEqual(['a (3).jpg']);
  expect(await files.get('a.jpg')?.text()).toBe('old');
  expect(await files.get('a (3).jpg')?.text()).toBe('new');
});
