import type { ColorSettings } from './settings.ts';

// Rec. 709 luma weights, the ones CSS `saturate()` and `hue-rotate()` use.
const LUMA_RED = 0.2126;
const LUMA_GREEN = 0.7152;
const LUMA_BLUE = 0.0722;

/**
 * Apply colour adjustments in place to RGBA pixels.
 *
 * Exposure, temperature, brightness, contrast and gamma act on each channel on
 * its own, so they are folded into one lookup table per channel; saturation
 * and hue mix the channels, through one 3×3 matrix. Alpha is left untouched.
 * @param data - RGBA bytes, as in `ImageData.data`.
 * @param color - The adjustments.
 */
export function applyColor(
  data: Uint8ClampedArray,
  color: ColorSettings,
): void {
  const red = channelTable(color, 1 + color.temperature / 300);
  const green = channelTable(color, 1);
  const blue = channelTable(color, 1 - color.temperature / 300);
  const matrix = mixingMatrix(color.saturation, color.hue);

  if (matrix === null) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = red[data[i] as number] as number;
      data[i + 1] = green[data[i + 1] as number] as number;
      data[i + 2] = blue[data[i + 2] as number] as number;
    }
    return;
  }

  const [
    m0 = 0,
    m1 = 0,
    m2 = 0,
    m3 = 0,
    m4 = 0,
    m5 = 0,
    m6 = 0,
    m7 = 0,
    m8 = 0,
  ] = matrix;
  for (let i = 0; i < data.length; i += 4) {
    const r = red[data[i] as number] as number;
    const g = green[data[i + 1] as number] as number;
    const b = blue[data[i + 2] as number] as number;
    data[i] = m0 * r + m1 * g + m2 * b;
    data[i + 1] = m3 * r + m4 * g + m5 * b;
    data[i + 2] = m6 * r + m7 * g + m8 * b;
  }
}

/**
 * The per-channel tone curve, as a table of the 256 input levels.
 * @param color - The adjustments.
 * @param whiteBalance - Multiplier of this channel for the colour temperature.
 * @returns The output level of every input level, clamped to 0–255.
 */
export function channelTable(
  color: ColorSettings,
  whiteBalance: number,
): Uint8ClampedArray {
  const table = new Uint8ClampedArray(256);
  const gain = 2 ** color.exposure * whiteBalance;
  const offset = color.brightness / 200;
  const contrast =
    color.contrast >= 0 ? 1 + color.contrast / 50 : 1 + color.contrast / 100;
  const inverseGamma = 1 / color.gamma;

  for (let level = 0; level < 256; level++) {
    let value = (level / 255) * gain + offset;
    value = (value - 0.5) * contrast + 0.5;
    value = Math.min(1, Math.max(0, value));
    if (inverseGamma !== 1) value **= inverseGamma;
    table[level] = Math.round(value * 255);
  }
  return table;
}

/**
 * The matrix mixing the channels for saturation and hue, as CSS `saturate()`
 * then `hue-rotate()` define them.
 * @param saturation - From -100 (grey) to 100.
 * @param hue - Rotation in degrees.
 * @returns Nine coefficients row by row, or `null` when both are neutral.
 */
export function mixingMatrix(saturation: number, hue: number): number[] | null {
  if (saturation === 0 && hue === 0) return null;
  const s = 1 + saturation / 100;
  const saturate = [
    LUMA_RED + (1 - LUMA_RED) * s,
    LUMA_GREEN - LUMA_GREEN * s,
    LUMA_BLUE - LUMA_BLUE * s,
    LUMA_RED - LUMA_RED * s,
    LUMA_GREEN + (1 - LUMA_GREEN) * s,
    LUMA_BLUE - LUMA_BLUE * s,
    LUMA_RED - LUMA_RED * s,
    LUMA_GREEN - LUMA_GREEN * s,
    LUMA_BLUE + (1 - LUMA_BLUE) * s,
  ];
  if (hue === 0) return saturate;

  const radians = (hue * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const rotate = [
    0.213 + cos * 0.787 - sin * 0.213,
    0.715 - cos * 0.715 - sin * 0.715,
    0.072 - cos * 0.072 + sin * 0.928,
    0.213 - cos * 0.213 + sin * 0.143,
    0.715 + cos * 0.285 + sin * 0.14,
    0.072 - cos * 0.072 - sin * 0.283,
    0.213 - cos * 0.213 - sin * 0.787,
    0.715 - cos * 0.715 + sin * 0.715,
    0.072 + cos * 0.928 + sin * 0.072,
  ];
  return multiply3(rotate, saturate);
}

function multiply3(a: number[], b: number[]): number[] {
  const result = new Array<number>(9);
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 3; column++) {
      let sum = 0;
      for (let k = 0; k < 3; k++) {
        sum += (a[row * 3 + k] as number) * (b[k * 3 + column] as number);
      }
      result[row * 3 + column] = sum;
    }
  }
  return result;
}
