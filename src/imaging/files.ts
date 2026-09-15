import type { OutputFormat } from './settings.ts';

const MIME_TYPES: Record<string, string> = {
  avif: 'image/avif',
  bmp: 'image/bmp',
  gif: 'image/gif',
  jfif: 'image/jpeg',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/**
 * The type a browser decodes a file as, read from its extension.
 * @param name - File name or relative path.
 * @returns The MIME type, or `undefined` for a file that is not a readable image.
 */
export function imageMimeType(name: string): string | undefined {
  return MIME_TYPES[extensionOf(name)];
}

/**
 * The encoded type of the output for a source file.
 * @param format - The chosen format.
 * @param sourceName - Name of the source file.
 * @returns `image/png` or `image/jpeg`.
 */
export function outputMimeType(
  format: OutputFormat,
  sourceName: string,
): 'image/jpeg' | 'image/png' {
  if (format === 'png') return 'image/png';
  if (format === 'jpeg') return 'image/jpeg';
  return extensionOf(sourceName) === 'png' ? 'image/png' : 'image/jpeg';
}

/**
 * The path of the output file: the source path with the extension of the type.
 * @param relativePath - Path of the source, folders included.
 * @param mimeType - The output type.
 * @returns The output path, folders kept.
 */
export function outputPath(relativePath: string, mimeType: string): string {
  const extension = mimeType === 'image/png' ? 'png' : 'jpg';
  const dot = relativePath.lastIndexOf('.');
  const slash = relativePath.lastIndexOf('/');
  const base = dot > slash ? relativePath.slice(0, dot) : relativePath;
  return `${base}.${extension}`;
}

/**
 * A path not already taken: `photo.jpg`, then `photo (2).jpg`, `photo (3).jpg`.
 * @param path - The wanted path.
 * @param taken - Paths already used; the returned one is added to it.
 * @returns The path to write.
 */
export function uniquePath(path: string, taken: Set<string>): string {
  let index = 1;
  while (taken.has(numberedPath(path, index))) index++;
  const candidate = numberedPath(path, index);
  taken.add(candidate);
  return candidate;
}

/**
 * The nth name for a path: the path itself for 1, then `photo (2).jpg`.
 * @param path - The wanted path.
 * @param index - From 1.
 * @returns The numbered path.
 */
export function numberedPath(path: string, index: number): string {
  if (index === 1) return path;
  const dot = path.lastIndexOf('.');
  const end = dot > path.lastIndexOf('/') ? dot : path.length;
  return `${path.slice(0, end)} (${index})${path.slice(end)}`;
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}
