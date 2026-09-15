import { Button, SegmentedControl } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import type { CustomRoiStyle } from 'react-roi';
import {
  RoiContainer,
  RoiList,
  RoiProvider,
  TargetImage,
  useActions,
} from 'react-roi';

import type { PixelRect } from '../../imaging/crop.ts';
import {
  fitCrop,
  largestAspectRect,
  toPixelsIn,
  toRelativeIn,
} from '../../imaging/crop.ts';
import type { Size } from '../../imaging/geometry.ts';
import type { TurnedView } from '../../imaging/turn.ts';
import { state, updateEdit } from '../../state/index.ts';

import { PreviewStage } from './PreviewStage.tsx';

const CROP_ID = 'crop';
const ASPECTS = ['Free', 'Original', '1:1', '4:3', '3:2', '16:9', '3:4'];
// The box is only its outline; what lies outside it is dimmed.
const CROP_STYLE: CustomRoiStyle = { rectAttributes: { fill: 'transparent' } };
const OUTSIDE_OPACITY = 0.55;

interface CropStageProps {
  /** The whole rotated image. */
  url: string;
  /** Size of that image. */
  drawn: Size;
  /** How that image is turned while a rotation is dragged, `null` otherwise. */
  turned: TurnedView | null;
  /** Where a crop may go, in pixels of that image. */
  area: PixelRect;
  imageId: string;
}

/**
 * The whole rotated image with the crop box on it; outside the box is dimmed,
 * the wheel zooms and a double click resets the zoom.
 * @param props - The image and where a crop may go.
 * @returns The crop stage.
 */
export function CropStage(props: CropStageProps): ReactElement {
  const { url, drawn, turned, area, imageId } = props;
  const initial = toPixelsIn(
    state.data.edits.peek()[imageId]?.crop ?? null,
    area,
  );

  return (
    <RoiProvider
      initialConfig={{
        mode: 'select',
        rois: [{ id: CROP_ID, ...initial, angle: 0 }],
        selectedRoiId: CROP_ID,
        commitRoiBoundaryStrategy: 'inside_auto',
        resizeStrategy: 'contain',
      }}
      onCommit={({ roi, actions, actionType }) => {
        const ratio = aspectRatio(state.view.cropAspect.peek(), area);
        const box = fitCrop(roi, area, ratio, actionType === 'moving');
        actions.updateRoi(roi.id, box);
        updateEdit(imageId, { crop: toRelativeIn(box, area) });
      }}
    >
      <CropToolbar area={area} imageId={imageId} />
      <PreviewStage url={url} drawn={drawn} turned={turned}>
        <RoiContainer
          className="preview__crop"
          target={<TargetImage src={url} />}
          zoomWithoutModifierKey
          noUnselection
        >
          <RoiList
            showGrid
            getStyle={() => CROP_STYLE}
            getOverlayOpacity={() => OUTSIDE_OPACITY}
          />
        </RoiContainer>
      </PreviewStage>
    </RoiProvider>
  );
}

function CropToolbar(props: {
  area: PixelRect;
  imageId: string;
}): ReactElement {
  useSignals();
  const { area, imageId } = props;
  const actions = useActions();
  const aspect = state.view.cropAspect.value;

  function setBox(box: PixelRect) {
    actions.updateRoi(CROP_ID, box);
    updateEdit(imageId, { crop: toRelativeIn(box, area) });
  }

  return (
    <div className="preview__toolbar">
      <SegmentedControl
        size="small"
        options={ASPECTS.map((label) => ({ label, value: label }))}
        value={aspect}
        onValueChange={(label) => {
          state.view.cropAspect.value = label;
          const ratio = aspectRatio(label, area);
          if (ratio === null) return;
          const box = largestAspectRect(area, ratio);
          setBox({ ...box, x: box.x + area.x, y: box.y + area.y });
        }}
      />
      <Button
        size="small"
        icon="reset"
        text="Whole image"
        onClick={() => {
          setBox(area);
        }}
      />
      <Button
        size="small"
        intent="primary"
        icon="tick"
        text="Done"
        onClick={() => {
          state.view.cropping.value = false;
        }}
      />
    </div>
  );
}

function aspectRatio(label: string, area: PixelRect): number | null {
  if (label === 'Original') return area.width / area.height;
  const match = /^(?<width>\d+):(?<height>\d+)$/.exec(label);
  if (!match?.groups) return null;
  return Number(match.groups.width) / Number(match.groups.height);
}
