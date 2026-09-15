import { Callout, HTMLTable, ProgressBar } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { formatBytes } from 'react-cheminfo/core';
import { DropZone } from 'react-science/ui';

import { OutputSettingsForm } from '../components/OutputSettingsForm.tsx';
import { chooseTarget, deliverFiles } from '../imaging/deliver.ts';
import { exportImages } from '../imaging/exportImages.ts';
import { readImageFiles } from '../imaging/readFiles.ts';
import { DEFAULT_EDIT } from '../imaging/settings.ts';
import { state } from '../state/index.ts';

/**
 * Set the output once, drop images, and get them back resized straight away.
 * @returns The page.
 */
export function Auto(): ReactElement {
  useSignals();
  const progress = state.view.progress.value;
  const results = state.view.autoResults.value;
  const skipped = state.data.skipped.value;
  const error = state.view.error.value;

  return (
    <div className="page">
      <p className="page-lead">
        Set the size, format and download, then drop images or folders. They
        download as soon as they are ready.
      </p>
      <div className="auto-layout">
        <section className="auto-settings" aria-labelledby="auto-settings">
          <h2 id="auto-settings" className="auto-settings__title">
            Output
          </h2>
          <OutputSettingsForm />
        </section>
        <div className="auto-drop" data-testid="auto-drop">
          <DropZone
            disabled={progress !== null}
            emptyTitle="Drop images or folders"
            emptyDescription="JPEG, PNG, WebP, GIF, AVIF, or ZIP archives of them. Nothing is uploaded."
            emptyButtonText="Choose images"
            emptyButtonIcon="folder-open"
            onDrop={(files) => void processDrop(files)}
          />
        </div>
      </div>
      {progress ? (
        <div>
          <ProgressBar
            intent="primary"
            value={progress.done / progress.total}
          />
          <p>
            {progress.done} of {progress.total} images
          </p>
        </div>
      ) : null}
      {error ? <Callout intent="danger">{error}</Callout> : null}
      {skipped > 0 ? (
        <Callout intent="warning">
          {skipped === 1
            ? '1 file was not an image a browser can read, and was left out.'
            : `${skipped} files were not images a browser can read, and were left out.`}
        </Callout>
      ) : null}
      {results.length > 0 ? (
        <HTMLTable
          compact
          striped
          className="auto-results"
          data-testid="auto-results"
        >
          <thead>
            <tr>
              <th>File</th>
              <th>Before</th>
              <th>After</th>
              <th>Size change</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.path}>
                <td>{result.path}</td>
                <td>
                  <ImageFacts
                    width={result.sourceWidth}
                    height={result.sourceHeight}
                    size={result.sourceSize}
                  />
                </td>
                {result.error === undefined ? (
                  <>
                    <td>
                      <ImageFacts
                        width={result.width}
                        height={result.height}
                        size={result.size}
                      />
                    </td>
                    <td>
                      <ShrinkBar
                        before={result.sourceSize}
                        after={result.size}
                      />
                    </td>
                  </>
                ) : (
                  <td colSpan={2}>{result.error}</td>
                )}
              </tr>
            ))}
          </tbody>
        </HTMLTable>
      ) : null}
    </div>
  );
}

function ImageFacts(props: {
  width?: number;
  height?: number;
  size?: number;
}): ReactElement {
  const { width, height, size } = props;
  return (
    <span className="image-facts">
      <span>
        {width === undefined || height === undefined
          ? '—'
          : `${width} × ${height} px`}
      </span>
      <span className="image-facts__bytes">
        {size === undefined || size === 0 ? '—' : formatBytes(size)}
      </span>
    </span>
  );
}

function ShrinkBar(props: { before: number; after?: number }): ReactElement {
  const { before, after } = props;
  if (after === undefined || before === 0) return <span>—</span>;
  const ratio = after / before;
  const larger = ratio > 1;
  const percent = Math.round(Math.abs(1 - ratio) * 100);
  const label = larger ? `${percent} % larger` : `${percent} % smaller`;
  return (
    <span className={larger ? 'shrink shrink--larger' : 'shrink'}>
      <span className="shrink__track" role="img" aria-label={label}>
        <span
          className="shrink__fill"
          style={{ width: larger ? '100%' : `${(1 - ratio) * 100}%` }}
        />
      </span>
      <span className="shrink__label">{label}</span>
    </span>
  );
}

async function processDrop(dropped: File[]): Promise<void> {
  state.view.error.value = null;
  state.view.autoResults.value = [];
  try {
    const many =
      dropped.length > 1 ||
      dropped.some((file) => file.name.toLowerCase().endsWith('.zip'));
    const target = await chooseTarget(state.preferences.delivery.peek(), many);
    if (target === null) return;
    const { images, skipped } = await readImageFiles(dropped);
    state.data.skipped.value = skipped;
    if (images.length === 0) return;
    state.view.progress.value = { done: 0, total: images.length };
    const { files, results } = await exportImages(
      images,
      () => DEFAULT_EDIT,
      state.preferences.output.peek(),
      (done, total) => {
        state.view.progress.value = { done, total };
      },
    );
    state.view.autoResults.value = results;
    await deliverFiles(files, target);
  } catch (error) {
    state.view.error.value = String(error);
  } finally {
    state.view.progress.value = null;
  }
}
