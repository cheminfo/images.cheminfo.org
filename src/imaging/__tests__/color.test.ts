import { expect, test } from 'vitest';

import { applyColor, channelTable, mixingMatrix } from '../color.ts';
import { NEUTRAL_COLOR } from '../settings.ts';

test('neutral settings leave every level unchanged', () => {
  const table = channelTable(NEUTRAL_COLOR, 1);
  expect(table[0]).toBe(0);
  expect(table[128]).toBe(128);
  expect(table[255]).toBe(255);
  expect(mixingMatrix(0, 0)).toBeNull();
});

test('one stop of exposure doubles a level and clamps at white', () => {
  const table = channelTable({ ...NEUTRAL_COLOR, exposure: 1 }, 1);
  expect(table[50]).toBe(100);
  expect(table[200]).toBe(255);
});

test('full desaturation writes the Rec. 709 luma in every channel', () => {
  const pixels = new Uint8ClampedArray([255, 0, 0, 255, 10, 200, 30, 128]);
  applyColor(pixels, { ...NEUTRAL_COLOR, saturation: -100 });
  expect(Array.from(pixels)).toStrictEqual([
    54, 54, 54, 255, 147, 147, 147, 128,
  ]);
});

test('warming raises red and lowers blue', () => {
  const pixels = new Uint8ClampedArray([150, 150, 150, 255]);
  applyColor(pixels, { ...NEUTRAL_COLOR, temperature: 60 });
  expect(Array.from(pixels)).toStrictEqual([180, 150, 120, 255]);
});

test('a hue rotation of 360° is the identity', () => {
  const matrix = mixingMatrix(0, 360) as number[];
  const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  for (let i = 0; i < 9; i++) {
    expect(matrix[i]).toBeCloseTo(identity[i] as number, 2);
  }
});
