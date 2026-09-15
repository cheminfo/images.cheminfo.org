import { expect, test } from 'vitest';

import { DEFAULT_EDIT } from '../settings.ts';
import { turnedView } from '../turn.ts';

const source = { width: 400, height: 200 };

test('a whole frame at its own angle is shown as drawn, crop box included', () => {
  expect(
    turnedView({
      source,
      drawnEdit: DEFAULT_EDIT,
      drawn: { width: 400, height: 200 },
      angle: 0,
      fullFrame: true,
      crop: { x: 0.5, y: 0, width: 0.5, height: 1 },
    }),
  ).toStrictEqual({
    frame: { width: 400, height: 200 },
    angle: 0,
    zoom: 1,
    box: { x: 200, y: 0, width: 200, height: 200 },
  });
});

test('a whole frame turned a quarter grows to the new bounds, at the drawn scale', () => {
  expect(
    turnedView({
      source,
      drawnEdit: DEFAULT_EDIT,
      drawn: { width: 200, height: 100 },
      angle: 90,
      fullFrame: true,
      crop: null,
    }),
  ).toStrictEqual({
    frame: { width: expect.closeTo(100, 9), height: expect.closeTo(200, 9) },
    angle: 90,
    zoom: 1,
    box: {
      x: expect.closeTo(0, 9),
      y: expect.closeTo(75, 9),
      width: expect.closeTo(100, 9),
      height: expect.closeTo(50, 9),
    },
  });
});

test('an output turns by the difference and grows as less stays inside', () => {
  expect(
    turnedView({
      source,
      drawnEdit: { ...DEFAULT_EDIT, straighten: 10 },
      drawn: { width: 300, height: 150 },
      angle: 90,
      fullFrame: false,
      crop: null,
    }),
  ).toStrictEqual({
    frame: { width: 300, height: 150 },
    angle: 80,
    // At 10° the height binds: 200 / (400 sin 10° + 200 cos 10°); at 90°, 0.5.
    zoom: expect.closeTo(
      200 / (400 * Math.sin(Math.PI / 18) + 200 * Math.cos(Math.PI / 18)) / 0.5,
      9,
    ),
    box: null,
  });
});
