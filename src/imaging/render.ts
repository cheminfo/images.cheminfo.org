import { applyColor } from './color.ts';
import type { RenderPlan } from './geometry.ts';
import { planFullFrame, planRender } from './geometry.ts';
import type { EditSettings, ResizeSettings } from './settings.ts';
import { isNeutralColor } from './settings.ts';

/** One image to render and encode. */
export interface RenderRequest {
  /** The encoded source. */
  blob: Blob;
  edit: EditSettings;
  resize: ResizeSettings;
  mimeType: 'image/jpeg' | 'image/png';
  /** JPEG quality, from 1 to 100. */
  quality: number;
  /**
   * Keeps the decoded source for the next request with the same key, so an
   * interactive preview decodes a photo once rather than on every change.
   * @default undefined — nothing is kept
   */
  cacheKey?: string;
  /**
   * Draw the whole rotated image and ignore the crop, for the crop view.
   * @default false
   */
  fullFrame?: boolean;
  /**
   * Also encode the same pixels as PNG: the lossless version the output is
   * compared with.
   * @default false
   */
  withReference?: boolean;
}

/** The encoded result. */
export interface RenderResult {
  blob: Blob;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  /** The same pixels as PNG, when `withReference` asked for them. */
  reference?: Blob;
}

let cached: { key: string; bitmap: ImageBitmap } | undefined;

/**
 * Decode, transform, adjust, resize and encode one image.
 *
 * Works in a worker and on the page alike: it needs `createImageBitmap` and
 * `OffscreenCanvas`, nothing else. The EXIF orientation of the source is
 * applied, and no metadata is written to the output.
 * @param request - The source and what to do with it.
 * @returns The encoded image and its size.
 */
export async function renderImage(
  request: RenderRequest,
): Promise<RenderResult> {
  const source = await decode(request);
  const plan = (request.fullFrame ? planFullFrame : planRender)(
    source,
    request.edit,
    request.resize,
  );
  const canvas = await drawPlan(source, request, plan);
  // A closed bitmap reports 0 × 0, so the size is read before closing it.
  const { width: sourceWidth, height: sourceHeight } = source;
  if (request.cacheKey === undefined) source.close();

  const blob = await canvas.convertToBlob({
    type: request.mimeType,
    quality: Math.min(100, Math.max(1, request.quality)) / 100,
  });
  const result: RenderResult = {
    blob,
    width: plan.output.width,
    height: plan.output.height,
    sourceWidth,
    sourceHeight,
  };
  if (request.withReference) {
    result.reference = await canvas.convertToBlob({ type: 'image/png' });
  }
  return result;
}

async function decode(request: RenderRequest): Promise<ImageBitmap> {
  const { cacheKey, blob } = request;
  if (cacheKey !== undefined && cached?.key === cacheKey) return cached.bitmap;
  const bitmap = await globalThis.createImageBitmap(blob, {
    imageOrientation: 'from-image',
  });
  if (cacheKey !== undefined) {
    cached?.bitmap.close();
    cached = { key: cacheKey, bitmap };
  }
  return bitmap;
}

async function drawPlan(
  source: ImageBitmap,
  request: RenderRequest,
  plan: RenderPlan,
): Promise<OffscreenCanvas> {
  const { edit, mimeType } = request;
  const { oriented, crop, output } = plan;
  const scaleX = output.width / crop.width;
  const scaleY = output.height / crop.height;

  // A browser's own high-quality resampling beats a single drawImage when an
  // image shrinks by more than half.
  const drawn =
    scaleX < 0.5
      ? await globalThis.createImageBitmap(source, {
          resizeWidth: Math.max(1, Math.round(source.width * scaleX)),
          resizeHeight: Math.max(1, Math.round(source.height * scaleY)),
          resizeQuality: 'high',
        })
      : source;

  const canvas = new OffscreenCanvas(output.width, output.height);
  const context = canvas.getContext('2d');
  if (context === null) throw new Error('This browser cannot draw images.');

  if (mimeType === 'image/jpeg') {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, output.width, output.height);
  }
  context.imageSmoothingQuality = 'high';
  context.scale(scaleX, scaleY);
  context.translate(oriented.width / 2 - crop.x, oriented.height / 2 - crop.y);
  context.rotate((edit.straighten * Math.PI) / 180);
  context.scale(edit.flipHorizontal ? -1 : 1, edit.flipVertical ? -1 : 1);
  context.rotate((edit.rotation * Math.PI) / 180);
  context.drawImage(
    drawn,
    -source.width / 2,
    -source.height / 2,
    source.width,
    source.height,
  );
  if (drawn !== source) drawn.close();

  if (!isNeutralColor(edit.color)) {
    const pixels = context.getImageData(0, 0, output.width, output.height);
    applyColor(pixels.data, edit.color);
    context.putImageData(pixels, 0, 0);
  }
  return canvas;
}
