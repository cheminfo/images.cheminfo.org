import './compare.css';

import { Button, Spinner } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useRef, useState } from 'react';
import { formatBytes } from 'react-cheminfo/core';
import {
  RoiContainer,
  RoiProvider,
  TargetImage,
  getTargetImageStyle,
  useActions,
  usePanZoomTransform,
} from 'react-roi';

import type { ImageEntry } from '../../imaging/readFiles.ts';
import { editOf, state } from '../../state/index.ts';

import type { Comparison } from './useComparison.ts';
import { useComparison } from './useComparison.ts';

// From this zoom on, output pixels are drawn as squares, so compression blocks show.
const PIXELATED_FROM = 2;
const SPLIT_STEP = 0.02;

/**
 * The output beside its lossless version: a divider splits them, the wheel
 * zooms and a drag pans both at once.
 * @param props - The image on screen.
 * @returns The comparison.
 */
export function CompareStage(props: { image: ImageEntry }): ReactElement {
  useSignals();
  const { image } = props;
  const { comparison, pending } = useComparison(
    image,
    editOf(image.id),
    state.preferences.output.value,
  );

  return (
    <div className="preview">
      {comparison ? (
        // react-roi fits the image once: a new size needs a new stage.
        <RoiProvider
          key={`${comparison.width}x${comparison.height}`}
          initialConfig={{ mode: 'select' }}
        >
          <CompareViewer comparison={comparison} pending={pending} />
        </RoiProvider>
      ) : (
        <div className="preview__stage">
          <Spinner />
        </div>
      )}
    </div>
  );
}

function CompareViewer(props: {
  comparison: Comparison;
  pending: boolean;
}): ReactElement {
  const { comparison, pending } = props;
  const {
    width,
    height,
    mimeType,
    quality,
    referenceUrl,
    referenceSize,
    outputUrl,
    outputSize,
  } = comparison;
  const actions = useActions();
  const transform = usePanZoomTransform();
  const scale = scaleOf(transform);
  const stageRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(0.5);

  function splitAt(clientX: number): void {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setSplit(clampFraction((clientX - rect.left) / rect.width));
  }

  const lossy = mimeType === 'image/jpeg';
  return (
    <>
      <div className="preview__toolbar">
        <Button
          size="small"
          variant="minimal"
          icon="zoom-out"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => {
            actions.zoom(0.5);
          }}
        />
        <span className="compare__zoom" data-testid="compare-zoom">
          {Math.round(scale * 100)}%
        </span>
        <Button
          size="small"
          variant="minimal"
          icon="zoom-in"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => {
            actions.zoom(2);
          }}
        />
        <Button
          size="small"
          icon="zoom-to-fit"
          text="Fit"
          title="Fit the image, as a double click does"
          onClick={() => {
            actions.zoomIntoROI(
              [
                { x: 0, y: 0 },
                { x: width, y: height },
              ],
              { margin: 0 },
            );
          }}
        />
        <Button
          size="small"
          icon="one-to-one"
          text="Actual pixels"
          onClick={() => {
            actions.zoom(1 / scale);
          }}
        />
        {pending ? <Spinner size={16} /> : null}
        <Button
          size="small"
          intent="primary"
          icon="tick"
          text="Done"
          onClick={() => {
            state.view.comparing.value = false;
          }}
        />
      </div>
      <div ref={stageRef} className="compare__stage">
        <RoiContainer
          className={
            scale >= PIXELATED_FROM
              ? 'compare__viewer compare__viewer--pixels'
              : 'compare__viewer'
          }
          target={
            <TargetImage
              src={referenceUrl}
              alt="Lossless"
              data-testid="compare-reference"
            />
          }
          zoomWithoutModifierKey
        >
          <div
            className="compare__output"
            style={{ clipPath: `inset(0 0 0 ${split * 100}%)` }}
          >
            <div style={{ transform, transformOrigin: '0 0' }}>
              <img
                src={outputUrl}
                alt={lossy ? `JPEG at quality ${quality}` : 'PNG'}
                style={getTargetImageStyle()}
                data-testid="compare-output"
              />
            </div>
          </div>
        </RoiContainer>
        <span
          className="compare__label compare__label--reference"
          data-testid="compare-reference-label"
        >
          Lossless PNG · {formatBytes(referenceSize)}
        </span>
        <span
          className="compare__label compare__label--output"
          data-testid="compare-output-label"
        >
          {lossy
            ? `JPEG ${quality} · ${formatBytes(outputSize)}, ${Math.round((100 * outputSize) / referenceSize)}% of lossless`
            : `PNG, lossless · ${formatBytes(outputSize)}`}
        </span>
        <div
          className="compare__divider"
          style={{ left: `${split * 100}%` }}
          role="slider"
          tabIndex={0}
          aria-label="Split between lossless and compressed"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(split * 100)}
          data-testid="compare-divider"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              splitAt(event.clientX);
            }
          }}
          onKeyDown={(event) => {
            const step =
              event.key === 'ArrowLeft'
                ? -SPLIT_STEP
                : event.key === 'ArrowRight'
                  ? SPLIT_STEP
                  : 0;
            if (step === 0) return;
            event.preventDefault();
            setSplit((value) => clampFraction(value + step));
          }}
        />
      </div>
    </>
  );
}

// react-roi exposes the total zoom only inside the transform it applies:
// `matrix(scale, 0, 0, scale, x, y)`.
function scaleOf(transform: string): number {
  const scale = Number.parseFloat(transform.slice('matrix('.length));
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

function clampFraction(value: number): number {
  return Math.min(1, Math.max(0, value));
}
