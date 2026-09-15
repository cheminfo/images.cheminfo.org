import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js';

/**
 * Pack files into a ZIP archive. JPEG and PNG are already compressed, so the
 * entries are stored rather than deflated again.
 * @param files - Path inside the archive, and content.
 * @returns The archive.
 */
export async function zipFiles(
  files: ReadonlyArray<{ path: string; blob: Blob }>,
): Promise<Blob> {
  const writer = new ZipWriter(new BlobWriter('application/zip'), {
    level: 0,
    useWebWorkers: false,
  });
  await Promise.all(
    files.map((file) => writer.add(file.path, new BlobReader(file.blob))),
  );
  return writer.close();
}
