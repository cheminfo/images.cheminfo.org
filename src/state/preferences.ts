import { effect, signal } from '@preact/signals-react';
import { persistSignalBucket } from 'react-cheminfo/core';

import type { Delivery, OutputSettings } from '../imaging/settings.ts';
import { DEFAULT_OUTPUT } from '../imaging/settings.ts';

/** The user's choices, kept in `localStorage` when the browser allows it. */
export const preferences = persistSignalBucket({
  key: 'images:preferences',
  version: 1,
  bucket: {
    output: signal<OutputSettings>(DEFAULT_OUTPUT),
    delivery: signal<Delivery>('zip'),
  },
  effect,
});
