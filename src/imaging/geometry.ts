import type { EditSettings, ResizeSettings } from './settings.ts';

/** A size in pixels. */
export interface Size {
  width: number;
  height: number;
}

/** Where the kept pixels are, and how large they are written. */
export interface RenderPlan {
  /** The source turned by its quarter turns. */
  oriented: Size;
  /** Scale of the largest same-shaped rectangle still inside the straightened image. */
  straightenScale: number;
  /** The kept rectangle, in pixels of the oriented frame. */
  crop: { x: number; y: number; width: number; height: number };
  /** The size the image is written at. */
  output: Size;
}

/**
 * Decide the geometry of a render: orientation, straightening, crop and size.
 * @param source - Size of the decoded source image.
 * @param edit - What is done to the image.
 * @param resize - How the output size is chosen.
 * @returns The plan the renderer draws from.
 */
export function planRender(
  source: Size,
  edit: EditSettings,
  resize: ResizeSettings,
): RenderPlan {
  const oriented = orientedSize(source, edit.rotation);
  const straightenScale = insideScale(oriented, edit.straighten);
  const innerWidth = oriented.width * straightenScale;
  const innerHeight = oriented.height * straightenScale;
  const relative = edit.crop ?? { x: 0, y: 0, width: 1, height: 1 };

  const crop = {
    x: (oriented.width - innerWidth) / 2 + relative.x * innerWidth,
    y: (oriented.height - innerHeight) / 2 + relative.y * innerHeight,
    width: Math.max(1, relative.width * innerWidth),
    height: Math.max(1, relative.height * innerHeight),
  };

  return {
    oriented,
    straightenScale,
    crop,
    output: resizedSize(crop, resize),
  };
}

/** The whole rotated image, and the part of it a crop may keep. */
export interface FrameLayout {
  /** The bounding box of the rotated image. */
  bounds: Size;
  /** The largest same-shaped rectangle inside the rotated image, in pixels of `bounds`. */
  inner: { x: number; y: number; width: number; height: number };
}

/**
 * Where the area a crop may keep sits in the whole rotated image.
 * @param source - Size of the decoded source image.
 * @param edit - What is done to the image.
 * @returns The bounding box of the rotated image, and the area inside it.
 */
export function frameLayout(source: Size, edit: EditSettings): FrameLayout {
  const oriented = orientedSize(source, edit.rotation);
  const radians = (edit.straighten * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const bounds = {
    width: oriented.width * cos + oriented.height * sin,
    height: oriented.width * sin + oriented.height * cos,
  };
  const scale = insideScale(oriented, edit.straighten);
  const width = oriented.width * scale;
  const height = oriented.height * scale;
  return {
    bounds,
    inner: {
      x: (bounds.width - width) / 2,
      y: (bounds.height - height) / 2,
      width,
      height,
    },
  };
}

/**
 * The geometry of a render that keeps the whole rotated image, ignoring the
 * crop — what the crop box is drawn over.
 * @param source - Size of the decoded source image.
 * @param edit - What is done to the image.
 * @param resize - How the output size is chosen.
 * @returns The plan the renderer draws from.
 */
export function planFullFrame(
  source: Size,
  edit: EditSettings,
  resize: ResizeSettings,
): RenderPlan {
  const oriented = orientedSize(source, edit.rotation);
  const { bounds } = frameLayout(source, edit);
  return {
    oriented,
    straightenScale: insideScale(oriented, edit.straighten),
    crop: {
      x: (oriented.width - bounds.width) / 2,
      y: (oriented.height - bounds.height) / 2,
      width: bounds.width,
      height: bounds.height,
    },
    output: resizedSize(bounds, resize),
  };
}

/**
 * The size of an image after quarter turns.
 * @param size - The source size.
 * @param rotation - Clockwise quarter turns, in degrees.
 * @returns The turned size.
 */
export function orientedSize(size: Size, rotation: number): Size {
  return rotation === 90 || rotation === 270
    ? { width: size.height, height: size.width }
    : { width: size.width, height: size.height };
}

/**
 * How much a rectangle must shrink, keeping its shape and centre, to stay
 * inside itself once rotated by an angle — so a straightened photo has no
 * empty corners.
 * @param size - The rectangle.
 * @param degrees - The rotation.
 * @returns A factor between 0 and 1; 1 when the angle is 0.
 */
export function insideScale(size: Size, degrees: number): number {
  if (degrees === 0) return 1;
  const radians = (Math.abs(degrees) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const { width, height } = size;
  return Math.min(
    width / (width * cos + height * sin),
    height / (width * sin + height * cos),
  );
}

/**
 * The output size for a resize setting, never larger than the input.
 * @param size - The size before resizing.
 * @param resize - How the output size is chosen.
 * @returns Whole pixels, at least one in each direction.
 */
export function resizedSize(size: Size, resize: ResizeSettings): Size {
  const { width, height } = size;
  let factor = 1;
  if (resize.value > 0) {
    if (resize.mode === 'longEdge') {
      factor = resize.value / Math.max(width, height);
    } else if (resize.mode === 'width') {
      factor = resize.value / width;
    } else if (resize.mode === 'height') {
      factor = resize.value / height;
    } else if (resize.mode === 'percent') {
      factor = resize.value / 100;
    }
  }
  factor = Math.min(1, factor);
  return {
    width: Math.max(1, Math.round(width * factor)),
    height: Math.max(1, Math.round(height * factor)),
  };
}
