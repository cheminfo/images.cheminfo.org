import { downloadBlob } from 'react-cheminfo/core';

import type { ExportedFile } from './exportImages.ts';
import { numberedPath, uniquePath } from './files.ts';
import type { Delivery } from './settings.ts';
import { zipFiles } from './zip.ts';

/** Where a batch of files goes. */
export type DeliveryTarget =
  | { kind: 'zip' }
  | { kind: 'downloads' }
  | { kind: 'folder'; directory: DirectoryLike };

/** The part of `FileSystemDirectoryHandle` a folder is written through. */
export interface DirectoryLike {
  getDirectoryHandle(
    name: string,
    options: { create: boolean },
  ): Promise<DirectoryLike>;
  getFileHandle(
    name: string,
    options?: { create: boolean },
  ): Promise<{
    createWritable(): Promise<{
      write(data: Blob): Promise<void>;
      close(): Promise<void>;
    }>;
  }>;
}

interface DirectoryPicker {
  showDirectoryPicker(options: {
    id: string;
    mode: 'readwrite';
    startIn: 'downloads';
  }): Promise<DirectoryLike>;
}

/**
 * Whether the browser can write into a folder the visitor picks. Chromium
 * only, and never inside a frame, where the picker is refused.
 * @returns `true` when the folder picker is available.
 */
export function canWriteFolder(): boolean {
  return (
    'showDirectoryPicker' in globalThis && globalThis.self === globalThis.top
  );
}

/**
 * Decide where a batch goes. The folder is asked for first, while the click or
 * drop that started the batch still allows a picker.
 * @param delivery - The visitor's choice.
 * @param many - Whether more than one file may come out.
 * @returns The target, or `null` when the visitor closed the picker.
 */
export async function chooseTarget(
  delivery: Delivery,
  many: boolean,
): Promise<DeliveryTarget | null> {
  if (delivery === 'zip') return { kind: 'zip' };
  if (!many || !canWriteFolder()) return { kind: 'downloads' };
  try {
    // Chromium refuses Downloads, Desktop and Documents themselves, but not a
    // folder inside them, so the picker opens where "New Folder" is one click.
    const directory = await (
      globalThis as unknown as DirectoryPicker
    ).showDirectoryPicker({
      id: 'images-output',
      mode: 'readwrite',
      startIn: 'downloads',
    });
    return { kind: 'folder', directory };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return null;
    }
    throw error;
  }
}

/**
 * Hand files over: into the folder picked, as one ZIP, or one download each.
 * A single file always downloads as itself unless a folder was picked.
 * @param files - The files.
 * @param target - From {@link chooseTarget}.
 * @param archiveName - Name of the ZIP.
 */
export async function deliverFiles(
  files: readonly ExportedFile[],
  target: DeliveryTarget,
  archiveName = 'images.zip',
): Promise<void> {
  if (files.length === 0) return;
  if (target.kind === 'folder') {
    await writeToDirectory(target.directory, files);
  } else if (target.kind === 'zip' && files.length > 1) {
    downloadBlob(await zipFiles(files), archiveName);
  } else {
    await downloadEach(files);
  }
}

/* eslint-disable no-await-in-loop -- one file is written, or downloaded, at a time */

/**
 * Write files into a folder, creating their subfolders. A file already there
 * is never replaced: the new one takes the next free name, `photo (2).jpg`.
 * @param directory - The folder.
 * @param files - Paths inside it, and contents.
 * @returns The paths written, in order.
 */
export async function writeToDirectory(
  directory: DirectoryLike,
  files: readonly ExportedFile[],
): Promise<string[]> {
  const written: string[] = [];
  for (const file of files) {
    const segments = file.path.split('/');
    const name = segments.pop() as string;
    let folder = directory;
    for (const segment of segments) {
      folder = await folder.getDirectoryHandle(segment, { create: true });
    }
    const free = await freeName(folder, name);
    const handle = await folder.getFileHandle(free, { create: true });
    const writable = await handle.createWritable();
    await writable.write(file.blob);
    await writable.close();
    written.push([...segments, free].join('/'));
  }
  return written;
}

async function freeName(folder: DirectoryLike, name: string): Promise<string> {
  for (let index = 1; ; index++) {
    const candidate = numberedPath(name, index);
    try {
      await folder.getFileHandle(candidate);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        return candidate;
      }
      throw error;
    }
  }
}

// Browsers drop downloads fired in the same instant, so they are spaced out.
// A download is a file name only: the subfolders cannot be kept.
async function downloadEach(files: readonly ExportedFile[]): Promise<void> {
  const taken = new Set<string>();
  for (let index = 0; index < files.length; index++) {
    const file = files[index] as ExportedFile;
    if (index > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, 200);
      });
    }
    const name = file.path.slice(file.path.lastIndexOf('/') + 1);
    downloadBlob(file.blob, uniquePath(name, taken));
  }
}

/* eslint-enable no-await-in-loop */
