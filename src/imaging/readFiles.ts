import { FileCollection } from 'file-collection';

import { imageMimeType } from './files.ts';

/** One image found in a drop, read only when it is needed. */
export interface ImageEntry {
  id: string;
  /** Path inside the dropped folder or archive, without a leading slash. */
  relativePath: string;
  name: string;
  /** Bytes of the source file, 0 when unknown. */
  size: number;
  read: () => Promise<Blob>;
}

const collator = new Intl.Collator(undefined, { numeric: true });

/**
 * Find the images in dropped files, folders and ZIP archives.
 * @param files - What was dropped or chosen.
 * @returns The images sorted by path, and how many files were not images.
 */
export async function readImageFiles(
  files: Iterable<File>,
): Promise<{ images: ImageEntry[]; skipped: number }> {
  const collection = new FileCollection();
  await collection.appendFileList(files);

  const images: ImageEntry[] = [];
  let skipped = 0;
  for (const file of collection.files) {
    const type = imageMimeType(file.name);
    if (type === undefined) {
      skipped++;
      continue;
    }
    images.push({
      id: crypto.randomUUID(),
      relativePath: file.relativePath.replace(/^\/+/, ''),
      name: file.name,
      size: file.size ?? 0,
      read: async () =>
        new Blob([(await file.arrayBuffer()) as ArrayBuffer], { type }),
    });
  }
  return {
    images: images.toSorted((a, b) =>
      collator.compare(a.relativePath, b.relativePath),
    ),
    skipped,
  };
}
