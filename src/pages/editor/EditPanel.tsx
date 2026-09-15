import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { Toolbar } from 'react-science/ui';

import { SliderRow } from '../../components/SliderRow.tsx';
import type { ColorSettings } from '../../imaging/settings.ts';
import { NEUTRAL_COLOR } from '../../imaging/settings.ts';
import { editOf, state, updateEdit } from '../../state/index.ts';

const COLOR_SLIDERS: Array<{
  key: keyof ColorSettings;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}> = [
  {
    key: 'exposure',
    label: 'Exposure',
    min: -2,
    max: 2,
    step: 0.05,
    unit: ' EV',
  },
  { key: 'brightness', label: 'Brightness', min: -100, max: 100, step: 1 },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100, step: 1 },
  { key: 'gamma', label: 'Gamma', min: 0.2, max: 5, step: 0.05 },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100, step: 1 },
  { key: 'hue', label: 'Hue', min: -180, max: 180, step: 1, unit: '°' },
  { key: 'temperature', label: 'Warmth', min: -100, max: 100, step: 1 },
];

/**
 * Straightening and colour adjustments of one image.
 * @param props - The image the controls act on.
 * @returns The panel.
 */
export function EditPanel(props: { id: string }): ReactElement {
  useSignals();
  const { id } = props;
  const edit = editOf(id);

  return (
    <div className="panel">
      <div className="panel__toolbar">
        <Toolbar aria-label="Adjust">
          <Toolbar.Item
            icon="reset"
            tooltip="Reset colours"
            aria-label="Reset colours"
            onClick={() => {
              updateEdit(id, { color: NEUTRAL_COLOR });
            }}
          />
          <Toolbar.Item
            icon="duplicate"
            tooltip="Give every image these colours"
            aria-label="Colours to all images"
            onClick={() => {
              for (const image of state.data.images.peek()) {
                updateEdit(image.id, { color: edit.color });
              }
            }}
          />
        </Toolbar>
      </div>
      <div className="panel__body">
        <SliderRow
          label="Rotate"
          unit="°"
          min={-180}
          max={180}
          step={0.5}
          neutral={0}
          value={edit.straighten}
          onChange={(straighten) => {
            updateEdit(id, { straighten });
          }}
        />
        {COLOR_SLIDERS.map((slider) => (
          <SliderRow
            key={slider.key}
            label={slider.label}
            unit={slider.unit}
            min={slider.min}
            max={slider.max}
            step={slider.step}
            neutral={NEUTRAL_COLOR[slider.key]}
            value={edit.color[slider.key]}
            onChange={(value) => {
              updateEdit(id, { color: { ...edit.color, [slider.key]: value } });
            }}
          />
        ))}
      </div>
    </div>
  );
}
