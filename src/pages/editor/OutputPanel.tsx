import { ProgressBar } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { formatBytes } from 'react-cheminfo/core';
import { useDebouncedValue } from 'react-cheminfo/ui';
import { Toolbar } from 'react-science/ui';

import { OutputSettingsForm } from '../../components/OutputSettingsForm.tsx';
import { chooseTarget, deliverFiles } from '../../imaging/deliver.ts';
import { exportImages } from '../../imaging/exportImages.ts';
import { outputMimeType } from '../../imaging/files.ts';
import type { ImageEntry } from '../../imaging/readFiles.ts';
import { estimateChannel } from '../../imaging/renderPool.ts';
import { editOf, state } from '../../state/index.ts';

interface Estimate {
  key: string;
  width: number;
  height: number;
  size: number;
  sourceWidth: number;
  sourceHeight: number;
}

/**
 * Output settings, what they produce for this image, and the downloads.
 * @param props - The image on screen.
 * @returns The panel.
 */
export function OutputPanel(props: { image: ImageEntry }): ReactElement {
  useSignals();
  const { image } = props;
  const edit = editOf(image.id);
  const output = state.preferences.output.value;
  const progress = state.view.progress.value;
  const images = state.data.images.value;
  const delivery = state.preferences.delivery.value;

  const request = useMemo(
    () => ({
      image,
      edit,
      output,
      key: JSON.stringify([image.id, edit, output]),
    }),
    [image, edit, output],
  );
  const settled = useDebouncedValue(request, 300);
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  useEffect(() => {
    let cancelled = false;
    const {
      image: source,
      edit: settledEdit,
      output: settledOutput,
      key,
    } = settled;
    void source
      .read()
      .then((blob) =>
        estimateChannel.request({
          blob,
          edit: settledEdit,
          resize: settledOutput.resize,
          mimeType: outputMimeType(settledOutput.format, source.name),
          quality: settledOutput.quality,
          cacheKey: source.id,
        }),
      )
      .then((result) => {
        if (cancelled) return;
        setEstimate({
          key,
          width: result.width,
          height: result.height,
          size: result.blob.size,
          sourceWidth: result.sourceWidth,
          sourceHeight: result.sourceHeight,
        });
      })
      .catch(() => {
        // Superseded by a newer estimate; that one answers instead.
      });
    return () => {
      cancelled = true;
    };
  }, [settled]);

  const current = estimate?.key === request.key ? estimate : null;
  const busy = progress !== null;

  return (
    <div className="panel">
      <div className="panel__toolbar">
        <Toolbar aria-label="Output">
          <Toolbar.Item
            icon="download"
            tooltip="Download this image"
            aria-label="Download this image"
            disabled={busy}
            onClick={() => void download([image])}
          />
          <Toolbar.Item
            icon={delivery === 'zip' ? 'archive' : 'folder-open'}
            tooltip={`Download all ${images.length} images ${delivery === 'zip' ? 'as a ZIP' : 'as separate files'}`}
            aria-label="Download all images"
            disabled={busy}
            onClick={() => void download(images)}
          />
        </Toolbar>
      </div>
      <div className="panel__body">
        <OutputSettingsForm />
        <dl className="output-facts">
          <dt>Source</dt>
          <dd>
            {current
              ? `${current.sourceWidth} × ${current.sourceHeight} px, ${formatBytes(image.size)}`
              : '…'}
          </dd>
          <dt>Output</dt>
          <dd data-testid="output-size">
            {current
              ? `${current.width} × ${current.height} px, ${formatBytes(current.size)}`
              : '…'}
          </dd>
        </dl>
        {progress ? (
          <ProgressBar
            intent="primary"
            value={progress.done / progress.total}
          />
        ) : null}
      </div>
    </div>
  );
}

async function download(sources: readonly ImageEntry[]): Promise<void> {
  state.view.error.value = null;
  try {
    const target = await chooseTarget(
      state.preferences.delivery.peek(),
      sources.length > 1,
    );
    if (target === null) return;
    state.view.progress.value = { done: 0, total: sources.length };
    const { files, results } = await exportImages(
      sources,
      editOf,
      state.preferences.output.peek(),
      (done, total) => {
        state.view.progress.value = { done, total };
      },
    );
    const failed = results.find((result) => result.error !== undefined);
    if (failed) state.view.error.value = `${failed.path}: ${failed.error}`;
    await deliverFiles(files, target);
  } catch (error) {
    state.view.error.value = String(error);
  } finally {
    state.view.progress.value = null;
  }
}
