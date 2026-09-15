import { outputMimeType, outputPath, uniquePath } from './files.ts';
import type { ImageEntry } from './readFiles.ts';
import { renderMany } from './renderPool.ts';
import type { EditSettings, OutputSettings } from './settings.ts';

/** A written file, at its path inside the archive. */
export interface ExportedFile {
  path: string;
  blob: Blob;
}

/** What became of one source image. */
export interface ExportResult {
  path: string;
  sourceSize: number;
  /** Output bytes; absent when it failed. */
  size?: number;
  width?: number;
  height?: number;
  sourceWidth?: number;
  sourceHeight?: number;
  error?: string;
}

/**
 * Render and encode images with their edits and the output settings.
 * @param images - The sources.
 * @param editFor - The edits of an image.
 * @param output - Size, format and quality.
 * @param onProgress - Called as each image finishes.
 * @returns The files, with unique paths in source order, and one result per source.
 */
export async function exportImages(
  images: readonly ImageEntry[],
  editFor: (id: string) => EditSettings,
  output: OutputSettings,
  onProgress: (done: number, total: number) => void,
): Promise<{ files: ExportedFile[]; results: ExportResult[] }> {
  const total = images.length;
  const blobs = new Array<Blob | undefined>(total);
  const results = new Array<ExportResult>(total);
  let done = 0;

  await renderMany(
    total,
    async (index) => {
      const image = images[index] as ImageEntry;
      return {
        blob: await image.read(),
        edit: editFor(image.id),
        resize: output.resize,
        mimeType: outputMimeType(output.format, image.name),
        quality: output.quality,
      };
    },
    (index, result) => {
      const image = images[index] as ImageEntry;
      const path = outputPath(
        image.relativePath,
        outputMimeType(output.format, image.name),
      );
      if (result instanceof Error) {
        results[index] = {
          path,
          sourceSize: image.size,
          error: result.message,
        };
      } else {
        blobs[index] = result.blob;
        results[index] = {
          path,
          sourceSize: image.size,
          size: result.blob.size,
          width: result.width,
          height: result.height,
          sourceWidth: result.sourceWidth,
          sourceHeight: result.sourceHeight,
        };
      }
      done++;
      onProgress(done, total);
    },
  );

  const taken = new Set<string>();
  const files: ExportedFile[] = [];
  for (let index = 0; index < total; index++) {
    const result = results[index] as ExportResult;
    result.path = uniquePath(result.path, taken);
    const blob = blobs[index];
    if (blob !== undefined) files.push({ path: result.path, blob });
  }
  return { files, results };
}
