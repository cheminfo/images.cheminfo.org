import { expect, test } from 'vitest';

import {
  frameLayout,
  insideScale,
  orientedSize,
  planFullFrame,
  planRender,
  resizedSize,
} from '../geometry.ts';
import { DEFAULT_EDIT } from '../settings.ts';

test('a free rotation past 45° still keeps no empty corner', () => {
  expect(insideScale({ width: 100, height: 100 }, 135)).toBeCloseTo(
    1 / Math.SQRT2,
    12,
  );
  expect(insideScale({ width: 400, height: 300 }, 180)).toBeCloseTo(1, 12);
});

test('the full frame holds the rotated image around the kept area', () => {
  const layout = frameLayout(
    { width: 100, height: 100 },
    { ...DEFAULT_EDIT, straighten: 45 },
  );
  expect(layout.bounds.width).toBeCloseTo(100 * Math.SQRT2, 10);
  expect(layout.bounds.height).toBeCloseTo(100 * Math.SQRT2, 10);
  expect(layout.inner.width).toBeCloseTo(100 / Math.SQRT2, 10);
  expect(layout.inner.x).toBeCloseTo(
    (100 * Math.SQRT2 - 100 / Math.SQRT2) / 2,
    10,
  );
});

test('a full-frame render ignores the crop', () => {
  const plan = planFullFrame(
    { width: 4000, height: 3000 },
    { ...DEFAULT_EDIT, crop: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 } },
    { mode: 'longEdge', value: 1000 },
  );
  expect(plan).toStrictEqual({
    oriented: { width: 4000, height: 3000 },
    straightenScale: 1,
    crop: { x: 0, y: 0, width: 4000, height: 3000 },
    output: { width: 1000, height: 750 },
  });
});

test('a quarter turn swaps width and height', () => {
  expect(orientedSize({ width: 400, height: 300 }, 90)).toStrictEqual({
    width: 300,
    height: 400,
  });
  expect(orientedSize({ width: 400, height: 300 }, 180)).toStrictEqual({
    width: 400,
    height: 300,
  });
});

test('a straightened square keeps no empty corner', () => {
  expect(insideScale({ width: 100, height: 100 }, 0)).toBe(1);
  // cos 45° + sin 45° = √2
  expect(insideScale({ width: 100, height: 100 }, 45)).toBeCloseTo(
    1 / Math.SQRT2,
    12,
  );
  expect(insideScale({ width: 100, height: 100 }, -45)).toBeCloseTo(
    1 / Math.SQRT2,
    12,
  );
});

test('resizing never enlarges', () => {
  const size = { width: 4000, height: 3000 };
  expect(resizedSize(size, { mode: 'longEdge', value: 1920 })).toStrictEqual({
    width: 1920,
    height: 1440,
  });
  expect(resizedSize(size, { mode: 'height', value: 600 })).toStrictEqual({
    width: 800,
    height: 600,
  });
  expect(resizedSize(size, { mode: 'percent', value: 25 })).toStrictEqual({
    width: 1000,
    height: 750,
  });
  expect(resizedSize(size, { mode: 'width', value: 8000 })).toStrictEqual(size);
  expect(resizedSize(size, { mode: 'original', value: 10 })).toStrictEqual(
    size,
  );
});

test('the crop is placed in the oriented frame, then resized', () => {
  const plan = planRender(
    { width: 4000, height: 3000 },
    {
      ...DEFAULT_EDIT,
      rotation: 90,
      crop: { x: 0.5, y: 0.25, width: 0.5, height: 0.5 },
    },
    { mode: 'longEdge', value: 1000 },
  );
  expect(plan).toStrictEqual({
    oriented: { width: 3000, height: 4000 },
    straightenScale: 1,
    crop: { x: 1500, y: 1000, width: 1500, height: 2000 },
    output: { width: 750, height: 1000 },
  });
});
