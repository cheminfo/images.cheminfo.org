import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from 'react-cheminfo/ui';

import { outputMimeType } from '../../imaging/files.ts';
import type { ImageEntry } from '../../imaging/readFiles.ts';
import { compareChannel } from '../../imaging/renderPool.ts';
import type { EditSettings, OutputSettings } from '../../imaging/settings.ts';

/** The output of one image and the same pixels without loss, ready to show. */
export interface Comparison {
  /** The image and the settings both were rendered with. */
  key: string;
  imageId: string;
  referenceUrl: string;
  outputUrl: string;
  referenceSize: number;
  outputSize: number;
  width: number;
  height: number;
  mimeType: 'image/jpeg' | 'image/png';
  quality: number;
}

/**
 * Render the output of an image and its lossless version, again each time the
 * edits or the output settings settle.
 * @param image - The image on screen.
 * @param edit - Its edits.
 * @param output - The output settings.
 * @returns The comparison of this image, `null` until the first one arrives, and whether a newer one is on its way.
 */
export function useComparison(
  image: ImageEntry,
  edit: EditSettings,
  output: OutputSettings,
): { comparison: Comparison | null; pending: boolean } {
  const request = useMemo(
    () => ({
      image,
      edit,
      output,
      key: JSON.stringify([image.id, edit, output]),
    }),
    [image, edit, output],
  );
  const settled = useDebouncedValue(request, 300);
  const [comparison, setComparison] = useState<Comparison | null>(null);

  // The worker keeps a decoded photo; closing the comparison frees it.
  useEffect(
    () => () => {
      compareChannel.terminate();
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const {
      image: source,
      edit: settledEdit,
      output: settledOutput,
      key,
    } = settled;
    const mimeType = outputMimeType(settledOutput.format, source.name);
    void source
      .read()
      .then((blob) =>
        compareChannel.request({
          blob,
          edit: settledEdit,
          resize: settledOutput.resize,
          mimeType,
          quality: settledOutput.quality,
          cacheKey: source.id,
          withReference: mimeType === 'image/jpeg',
        }),
      )
      .then((result) => {
        if (cancelled) return;
        const outputUrl = URL.createObjectURL(result.blob);
        setComparison({
          key,
          imageId: source.id,
          outputUrl,
          referenceUrl: result.reference
            ? URL.createObjectURL(result.reference)
            : outputUrl,
          referenceSize: (result.reference ?? result.blob).size,
          outputSize: result.blob.size,
          width: result.width,
          height: result.height,
          mimeType,
          quality: settledOutput.quality,
        });
      })
      .catch(() => {
        // Superseded by a newer comparison, or the comparison was closed.
      });
    return () => {
      cancelled = true;
    };
  }, [settled]);

  // Both object URLs live until the next comparison replaces them.
  const outputUrl = comparison?.outputUrl ?? '';
  const referenceUrl = comparison?.referenceUrl ?? '';
  useEffect(
    () => () => {
      URL.revokeObjectURL(outputUrl);
      URL.revokeObjectURL(referenceUrl);
    },
    [outputUrl, referenceUrl],
  );

  return {
    comparison: comparison?.imageId === image.id ? comparison : null,
    pending: comparison?.key !== request.key,
  };
}
