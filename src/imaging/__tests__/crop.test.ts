import { expect, test } from 'vitest';

import {
  constrainAspect,
  fitCrop,
  largestAspectRect,
  toPixels,
  toPixelsIn,
  toRelative,
  toRelativeIn,
} from '../crop.ts';

const AREA = { x: 100, y: 50, width: 400, height: 200 };

test('a moved crop slides back inside the area', () => {
  expect(
    fitCrop({ x: 450, y: 0, width: 100, height: 100 }, AREA, null, true),
  ).toStrictEqual({ x: 400, y: 50, width: 100, height: 100 });
});

test('a resized crop is cut at the edge of the area', () => {
  expect(
    fitCrop({ x: 50, y: 100, width: 200, height: 300 }, AREA, null, false),
  ).toStrictEqual({ x: 100, y: 100, width: 150, height: 150 });
});

test('a crop inside an area is relative to that area', () => {
  const relative = toRelativeIn(
    { x: 200, y: 100, width: 200, height: 100 },
    AREA,
  );
  expect(relative).toStrictEqual({ x: 0.25, y: 0.25, width: 0.5, height: 0.5 });
  expect(toPixelsIn(relative, AREA)).toStrictEqual({
    x: 200,
    y: 100,
    width: 200,
    height: 100,
  });
  expect(toRelativeIn(AREA, AREA)).toBeNull();
});

test('the largest square in a landscape frame is centred', () => {
  expect(largestAspectRect({ width: 400, height: 300 }, 1)).toStrictEqual({
    x: 50,
    y: 0,
    width: 300,
    height: 300,
  });
  expect(largestAspectRect({ width: 400, height: 300 }, 16 / 9)).toStrictEqual({
    x: 0,
    y: 37.5,
    width: 400,
    height: 225,
  });
});

test('reshaping keeps the area, the centre, and the frame', () => {
  const frame = { width: 1000, height: 1000 };
  expect(
    constrainAspect({ x: 400, y: 400, width: 200, height: 50 }, 1, frame),
  ).toStrictEqual({ x: 450, y: 375, width: 100, height: 100 });
  // Too wide to keep its area: it shrinks to the frame and moves inside it.
  expect(
    constrainAspect({ x: 900, y: 0, width: 1000, height: 1000 }, 2, frame),
  ).toStrictEqual({ x: 0, y: 250, width: 1000, height: 500 });
});

test('a crop of the whole frame is no crop', () => {
  const frame = { width: 400, height: 200 };
  expect(toRelative({ x: 0, y: 0, width: 400, height: 200 }, frame)).toBeNull();
  const relative = toRelative(
    { x: 100, y: 50, width: 200, height: 100 },
    frame,
  );
  expect(relative).toStrictEqual({ x: 0.25, y: 0.25, width: 0.5, height: 0.5 });
  expect(toPixels(relative, frame)).toStrictEqual({
    x: 100,
    y: 50,
    width: 200,
    height: 100,
  });
});
