import type { Size } from './geometry.ts';
import type { RelativeRect } from './settings.ts';

/** A rectangle in pixels. */
export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The largest centred rectangle of a given shape inside a frame.
 * @param frame - The frame, in pixels.
 * @param aspect - Width over height.
 * @returns The rectangle, in pixels of the frame.
 */
export function largestAspectRect(frame: Size, aspect: number): PixelRect {
  let width = frame.width;
  let height = width / aspect;
  if (height > frame.height) {
    height = frame.height;
    width = height * aspect;
  }
  return {
    x: (frame.width - width) / 2,
    y: (frame.height - height) / 2,
    width,
    height,
  };
}

/**
 * Give a rectangle a shape, keeping its centre and its area where the frame
 * allows, and keeping it inside the frame.
 * @param rect - The rectangle as drawn.
 * @param aspect - Width over height.
 * @param frame - The frame it must stay in.
 * @returns The reshaped rectangle.
 */
export function constrainAspect(
  rect: PixelRect,
  aspect: number,
  frame: Size,
): PixelRect {
  let width = Math.sqrt(rect.width * rect.height * aspect);
  let height = width / aspect;
  const shrink = Math.min(1, frame.width / width, frame.height / height);
  width *= shrink;
  height *= shrink;

  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  return {
    x: clamp(centerX - width / 2, 0, frame.width - width),
    y: clamp(centerY - height / 2, 0, frame.height - height),
    width,
    height,
  };
}

/**
 * Express a pixel rectangle as fractions of its frame.
 * @param rect - The rectangle, in pixels.
 * @param frame - The frame.
 * @returns The rectangle, or `null` when it covers the whole frame.
 */
export function toRelative(rect: PixelRect, frame: Size): RelativeRect | null {
  const relative = {
    x: clamp(rect.x / frame.width, 0, 1),
    y: clamp(rect.y / frame.height, 0, 1),
    width: clamp(rect.width / frame.width, 0, 1),
    height: clamp(rect.height / frame.height, 0, 1),
  };
  const whole =
    relative.x < 0.001 &&
    relative.y < 0.001 &&
    relative.width > 0.999 &&
    relative.height > 0.999;
  return whole ? null : relative;
}

/**
 * Express a relative rectangle in pixels of a frame.
 * @param rect - The rectangle as fractions, or `null` for the whole frame.
 * @param frame - The frame.
 * @returns The rectangle, in pixels.
 */
export function toPixels(rect: RelativeRect | null, frame: Size): PixelRect {
  const relative = rect ?? { x: 0, y: 0, width: 1, height: 1 };
  return {
    x: relative.x * frame.width,
    y: relative.y * frame.height,
    width: relative.width * frame.width,
    height: relative.height * frame.height,
  };
}

/**
 * Keep a crop box inside the area a crop may keep, and give it a shape.
 * @param rect - The box as drawn, in pixels of the whole image.
 * @param area - The area it must stay in, in the same pixels.
 * @param aspect - Width over height, or `null` for any shape.
 * @param moving - A moved box slides back inside; a resized one is cut at the edge.
 * @returns The fitted box, in pixels of the whole image.
 */
export function fitCrop(
  rect: PixelRect,
  area: PixelRect,
  aspect: number | null,
  moving: boolean,
): PixelRect {
  const frame = { width: area.width, height: area.height };
  const local = { ...rect, x: rect.x - area.x, y: rect.y - area.y };
  let fitted: PixelRect;
  if (aspect !== null) {
    fitted = constrainAspect(local, aspect, frame);
  } else if (moving) {
    const width = Math.min(local.width, frame.width);
    const height = Math.min(local.height, frame.height);
    fitted = {
      x: clamp(local.x, 0, frame.width - width),
      y: clamp(local.y, 0, frame.height - height),
      width,
      height,
    };
  } else {
    const left = clamp(local.x, 0, frame.width);
    const top = clamp(local.y, 0, frame.height);
    fitted = {
      x: left,
      y: top,
      width: Math.max(1, clamp(local.x + local.width, 0, frame.width) - left),
      height: Math.max(1, clamp(local.y + local.height, 0, frame.height) - top),
    };
  }
  return { ...fitted, x: fitted.x + area.x, y: fitted.y + area.y };
}

/**
 * Express a pixel rectangle as fractions of an area placed inside a larger image.
 * @param rect - The rectangle, in pixels of the image.
 * @param area - The area, in pixels of the image.
 * @returns The rectangle, or `null` when it covers the whole area.
 */
export function toRelativeIn(
  rect: PixelRect,
  area: PixelRect,
): RelativeRect | null {
  return toRelative({ ...rect, x: rect.x - area.x, y: rect.y - area.y }, area);
}

/**
 * Express a relative rectangle in pixels of an image, from an area inside it.
 * @param rect - The rectangle as fractions of the area, or `null` for all of it.
 * @param area - The area, in pixels of the image.
 * @returns The rectangle, in pixels of the image.
 */
export function toPixelsIn(
  rect: RelativeRect | null,
  area: PixelRect,
): PixelRect {
  const box = toPixels(rect, area);
  return { ...box, x: box.x + area.x, y: box.y + area.y };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
