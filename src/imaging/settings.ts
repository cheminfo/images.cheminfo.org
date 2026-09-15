/** A quarter-turn rotation, clockwise, in degrees. */
export type QuarterTurn = 0 | 90 | 180 | 270;

/** A rectangle whose coordinates are fractions (0 to 1) of the frame it is in. */
export interface RelativeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The colour adjustments; every one is neutral at its default. */
export interface ColorSettings {
  /** Exposure in stops, from -2 to 2. */
  exposure: number;
  /** From -100 to 100. */
  brightness: number;
  /** From -100 to 100. */
  contrast: number;
  /** Midtone gamma, from 0.2 to 5. */
  gamma: number;
  /** From -100 (grey) to 100. */
  saturation: number;
  /** Hue rotation in degrees, from -180 to 180. */
  hue: number;
  /** From -100 (cool) to 100 (warm). */
  temperature: number;
}

/** Everything done to one image before it is resized and encoded. */
export interface EditSettings {
  rotation: QuarterTurn;
  flipHorizontal: boolean;
  flipVertical: boolean;
  /** Free rotation in degrees, from -180 to 180, cropped to stay inside the image. */
  straighten: number;
  /** The kept part of the straightened image, or `null` to keep all of it. */
  crop: RelativeRect | null;
  color: ColorSettings;
}

/** How the output size is chosen; an image is never enlarged. */
export type ResizeMode =
  'original' | 'longEdge' | 'width' | 'height' | 'percent';

/** The target size. */
export interface ResizeSettings {
  mode: ResizeMode;
  /** Pixels, or a percentage for `percent`; ignored for `original`. */
  value: number;
}

/** `keep` writes PNG for a PNG source and JPEG for anything else. */
export type OutputFormat = 'jpeg' | 'png' | 'keep';

/** `zip` packs several images into one archive; `files` hands each over on its own. */
export type Delivery = 'zip' | 'files';

/** How an image is written. */
export interface OutputSettings {
  resize: ResizeSettings;
  format: OutputFormat;
  /** JPEG quality, from 1 to 100. */
  quality: number;
}

export const NEUTRAL_COLOR: ColorSettings = {
  exposure: 0,
  brightness: 0,
  contrast: 0,
  gamma: 1,
  saturation: 0,
  hue: 0,
  temperature: 0,
};

export const DEFAULT_EDIT: EditSettings = {
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  straighten: 0,
  crop: null,
  color: NEUTRAL_COLOR,
};

export const DEFAULT_OUTPUT: OutputSettings = {
  resize: { mode: 'longEdge', value: 1920 },
  format: 'jpeg',
  quality: 85,
};

/**
 * Whether the colour adjustments change nothing.
 * @param color - The adjustments.
 * @returns `true` when every adjustment is at its neutral value.
 */
export function isNeutralColor(color: ColorSettings): boolean {
  return (
    color.exposure === 0 &&
    color.brightness === 0 &&
    color.contrast === 0 &&
    color.gamma === 1 &&
    color.saturation === 0 &&
    color.hue === 0 &&
    color.temperature === 0
  );
}
