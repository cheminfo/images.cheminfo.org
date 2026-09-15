import {
  Callout,
  FormGroup,
  HTMLSelect,
  NumericInput,
  SegmentedControl,
} from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';

import { canWriteFolder } from '../imaging/deliver.ts';
import type {
  Delivery,
  OutputFormat,
  OutputSettings,
  ResizeMode,
} from '../imaging/settings.ts';
import { DEFAULT_OUTPUT } from '../imaging/settings.ts';
import { state } from '../state/index.ts';

import { SliderRow } from './SliderRow.tsx';

const DELIVERIES: Array<{ value: Delivery; label: string }> = [
  { value: 'zip', label: 'One ZIP' },
  { value: 'files', label: 'Separate files' },
];

const RESIZE_MODES: Array<{ value: ResizeMode; label: string }> = [
  { value: 'longEdge', label: 'Longest edge' },
  { value: 'width', label: 'Width' },
  { value: 'height', label: 'Height' },
  { value: 'percent', label: 'Percentage' },
  { value: 'original', label: 'Original size' },
];

const FORMATS: Array<{ value: OutputFormat; label: string }> = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'keep', label: 'As source' },
];

/**
 * Size, format and JPEG quality of the output, shared by both pages.
 * @returns The form.
 */
export function OutputSettingsForm(): ReactElement {
  useSignals();
  const output = state.preferences.output.value;
  const delivery = state.preferences.delivery.value;
  const { resize, format, quality } = output;

  function update(change: Partial<OutputSettings>): void {
    state.preferences.output.value = { ...output, ...change };
  }

  return (
    <div className="output-form">
      <FormGroup label="Size" helperText="Images are never enlarged.">
        <div className="size-row">
          <HTMLSelect
            fill
            value={resize.mode}
            options={RESIZE_MODES}
            aria-label="Resize by"
            onChange={(event) => {
              update({
                resize: {
                  mode: event.currentTarget.value as ResizeMode,
                  value: event.currentTarget.value === 'percent' ? 50 : 1920,
                },
              });
            }}
          />
          {resize.mode === 'original' ? null : (
            <NumericInput
              value={resize.value}
              min={1}
              max={resize.mode === 'percent' ? 100 : 20_000}
              stepSize={resize.mode === 'percent' ? 5 : 100}
              majorStepSize={resize.mode === 'percent' ? 25 : 1000}
              style={{ width: '6rem' }}
              aria-label="Target size"
              data-testid="resize-value"
              onValueChange={(value) => {
                if (Number.isFinite(value) && value > 0) {
                  update({ resize: { mode: resize.mode, value } });
                }
              }}
            />
          )}
          {resize.mode === 'original' ? null : (
            <span>{resize.mode === 'percent' ? '%' : 'px'}</span>
          )}
        </div>
      </FormGroup>
      <FormGroup label="Format">
        <SegmentedControl
          fill
          options={FORMATS}
          value={format}
          onValueChange={(value) => {
            update({ format: value as OutputFormat });
          }}
        />
      </FormGroup>
      {format === 'png' ? null : (
        <FormGroup helperText="80–90 looks lossless for photos; lower is smaller.">
          <SliderRow
            label="JPEG quality"
            value={quality}
            min={1}
            max={100}
            step={1}
            neutral={DEFAULT_OUTPUT.quality}
            onChange={(value) => {
              update({ quality: value });
            }}
          />
        </FormGroup>
      )}
      <FormGroup label="Download as" helperText={deliveryHelp(delivery)}>
        <SegmentedControl
          fill
          options={DELIVERIES}
          value={delivery}
          onValueChange={(value) => {
            state.preferences.delivery.value = value as Delivery;
          }}
        />
      </FormGroup>
      {delivery === 'files' && canWriteFolder() ? (
        <Callout
          compact
          intent="warning"
          icon="warning-sign"
          title="Pick a folder inside Downloads"
          data-testid="folder-warning"
        >
          Chrome refuses Downloads, Desktop and Documents themselves. Click New
          Folder in the picker.
        </Callout>
      ) : null}
    </div>
  );
}

function deliveryHelp(delivery: Delivery): string {
  if (delivery === 'zip') return 'Folders are kept inside the ZIP.';
  return canWriteFolder()
    ? 'Written into a folder you pick, subfolders kept. Existing files are never replaced.'
    : 'One download each. Subfolders are not kept.';
}
