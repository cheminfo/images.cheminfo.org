import { Slider } from '@blueprintjs/core';
import type { ReactElement } from 'react';

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** The value a double click on the label returns to. */
  neutral: number;
  unit?: string;
  onChange: (value: number) => void;
  /**
   * Called when the slider is let go, and after a reset.
   * @default undefined — nothing is called
   */
  onRelease?: (value: number) => void;
}

/**
 * A labelled slider showing its value; double-click the label to reset it.
 * @param props - The value, its range and where it goes.
 * @returns The row.
 */
export function SliderRow(props: SliderRowProps): ReactElement {
  const {
    label,
    value,
    min,
    max,
    step,
    neutral,
    unit = '',
    onChange,
    onRelease,
  } = props;
  return (
    <div className="slider-row">
      <div
        className="slider-row__label"
        title="Double-click to reset"
        onDoubleClick={() => {
          onChange(neutral);
          onRelease?.(neutral);
        }}
      >
        <span>{label}</span>
        <span>
          {value}
          {unit}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        stepSize={step}
        value={value}
        labelRenderer={false}
        onChange={onChange}
        onRelease={onRelease}
      />
    </div>
  );
}
