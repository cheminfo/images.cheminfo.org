import type { WorkerChannel } from 'react-cheminfo/core';
import { createWorkerChannel } from 'react-cheminfo/core';

import type { RenderRequest, RenderResult } from './render.ts';

type RenderChannel = WorkerChannel<RenderRequest, RenderResult>;

// Every lane decodes a full photo at once; four keeps a batch of 24 MP images
// well under a gigabyte.
const LANES = Math.max(
  1,
  Math.min(4, (globalThis.navigator?.hardwareConcurrency ?? 2) - 1),
);

function renderChannel(schedule: 'latest' | 'parallel'): RenderChannel {
  return createWorkerChannel<RenderRequest, RenderResult>(
    () =>
      new Worker(new URL('render.worker.ts', import.meta.url), {
        type: 'module',
      }),
    { name: 'render', schedule, defaultTimeoutMs: 300_000 },
  );
}

/** The on-screen preview: only the newest request is drawn. */
export const previewChannel = renderChannel('latest');

/** The size of the output with the current settings, newest request only. */
export const estimateChannel = renderChannel('latest');

/** The output beside its lossless version, newest request only. */
export const compareChannel = renderChannel('latest');

let lanes: RenderChannel[] | undefined;

/**
 * Render many images on several workers at once.
 * @param count - How many images.
 * @param requestAt - Builds the request of one image, when its turn comes.
 * @param onResult - Called as each image finishes, with its result or its error.
 */
export async function renderMany(
  count: number,
  requestAt: (index: number) => Promise<RenderRequest>,
  onResult: (index: number, result: RenderResult | Error) => void,
): Promise<void> {
  lanes ??= Array.from({ length: LANES }, () => renderChannel('parallel'));
  let next = 0;

  async function runLane(channel: RenderChannel): Promise<void> {
    /* eslint-disable no-await-in-loop -- one image per lane at a time bounds memory */
    while (next < count) {
      const index = next++;
      try {
        onResult(index, await channel.request(await requestAt(index)));
      } catch (error) {
        onResult(
          index,
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }
    /* eslint-enable no-await-in-loop */
  }

  await Promise.all(lanes.map(runLane));
}
