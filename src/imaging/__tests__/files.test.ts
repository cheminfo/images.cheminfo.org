import { expect, test } from 'vitest';

import {
  imageMimeType,
  numberedPath,
  outputMimeType,
  outputPath,
  uniquePath,
} from '../files.ts';

test('only images a browser decodes are recognised', () => {
  expect(imageMimeType('holiday/IMG_0001.JPG')).toBe('image/jpeg');
  expect(imageMimeType('scan.png')).toBe('image/png');
  expect(imageMimeType('notes.txt')).toBeUndefined();
  expect(imageMimeType('README')).toBeUndefined();
});

test('keep writes PNG for PNG and JPEG for the rest', () => {
  expect(outputMimeType('keep', 'a.PNG')).toBe('image/png');
  expect(outputMimeType('keep', 'a.webp')).toBe('image/jpeg');
  expect(outputMimeType('png', 'a.jpg')).toBe('image/png');
});

test('the output keeps its folders and takes the new extension', () => {
  expect(outputPath('trip/day.1/IMG.jpeg', 'image/jpeg')).toBe(
    'trip/day.1/IMG.jpg',
  );
  expect(outputPath('trip/day.1/IMG', 'image/png')).toBe('trip/day.1/IMG.png');
});

test('a number goes before the extension, or at the end without one', () => {
  expect(numberedPath('a/photo.jpg', 1)).toBe('a/photo.jpg');
  expect(numberedPath('a/photo.jpg', 4)).toBe('a/photo (4).jpg');
  expect(numberedPath('v1.0/README', 2)).toBe('v1.0/README (2)');
});

test('two sources writing the same path get distinct names', () => {
  const taken = new Set<string>();
  expect(uniquePath('a/photo.jpg', taken)).toBe('a/photo.jpg');
  expect(uniquePath('a/photo.jpg', taken)).toBe('a/photo (2).jpg');
  expect(uniquePath('a/photo.jpg', taken)).toBe('a/photo (3).jpg');
});
