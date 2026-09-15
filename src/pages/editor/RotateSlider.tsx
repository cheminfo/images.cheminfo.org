import { batch } from '@preact/signals-react';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';

import { SliderRow } from '../../components/SliderRow.tsx';
import { editOf, state, updateEdit } from '../../state/index.ts';

/**
 * The free rotation of an image. The angle follows the slider on screen and
 * is applied to the image when the slider is let go.
 * @param props - The image the slider turns.
 * @returns The slider.
 */
export function RotateSlider(props: { id: string }): ReactElement {
  useSignals();
  const { id } = props;
  const dragged = state.view.straightening.value;

  return (
    <SliderRow
      label="Rotate"
      unit="°"
      min={-180}
      max={180}
      step={0.5}
      neutral={0}
      value={dragged ?? editOf(id).straighten}
      onChange={(straighten) => {
        state.view.straightening.value = straighten;
      }}
      onRelease={(straighten) => {
        batch(() => {
          updateEdit(id, { straighten });
          state.view.straightening.value = null;
        });
      }}
    />
  );
}
