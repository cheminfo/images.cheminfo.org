import { Spinner } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { RoiContainer, RoiProvider, TargetImage } from 'react-roi';

import type { PixelRect } from '../../imaging/crop.ts';
import type { Size } from '../../imaging/geometry.ts';
import { frameLayout } from '../../imaging/geometry.ts';
import type { ImageEntry } from '../../imaging/readFiles.ts';
import { previewChannel } from '../../imaging/renderPool.ts';
import type { EditSettings } from '../../imaging/settings.ts';
import { turnedView } from '../../imaging/turn.ts';
import { editOf, state } from '../../state/index.ts';

import { CropStage } from './CropStage.tsx';
import { PreviewStage } from './PreviewStage.tsx';
import { RotateSlider } from './RotateSlider.tsx';

const PREVIEW_RESIZE = { mode: 'longEdge', value: 2048 } as const;

interface PreviewImage {
  key: string;
  url: string;
  width: number;
  height: number;
  /** The edits this image was drawn with. */
  edit: EditSettings;
  /** Size of the decoded source. */
  source: Size;
  /** The frame this image was drawn on: the crop stage is re-seeded when it changes. */
  frame: string;
  /** Where a crop may go, in pixels of this image. */
  area: PixelRect;
}

/**
 * The image as it will be written, zoomed with the wheel and reset with a
 * double click; while cropping, the whole rotated image with the crop box on
 * it and a free rotation under it.
 * @param props - The image on screen.
 * @returns The preview.
 */
export function Preview(props: { image: ImageEntry }): ReactElement {
  useSignals();
  const { image } = props;
  const cropping = state.view.cropping.value;
  const edit = editOf(image.id);
  const angle = state.view.straightening.value ?? edit.straighten;

  // While cropping, a change of the crop alone must not redraw the frame.
  const shownKey = JSON.stringify(cropping ? { ...edit, crop: null } : edit);
  const [preview, setPreview] = useState<PreviewImage | null>(null);
  const expectedKey = `${image.id}:${String(cropping)}`;

  useEffect(() => {
    const shown = JSON.parse(shownKey) as EditSettings;
    let cancelled = false;
    void image
      .read()
      .then((blob) =>
        previewChannel.request({
          blob,
          edit: shown,
          resize: PREVIEW_RESIZE,
          // PNG keeps the corners a rotation uncovers transparent.
          mimeType: cropping ? 'image/png' : 'image/jpeg',
          quality: 90,
          cacheKey: image.id,
          fullFrame: cropping,
        }),
      )
      .then((result) => {
        if (cancelled) return;
        const source = {
          width: result.sourceWidth,
          height: result.sourceHeight,
        };
        const { bounds, inner } = frameLayout(source, shown);
        const factor = result.width / bounds.width;
        setPreview({
          key: `${image.id}:${String(cropping)}`,
          url: URL.createObjectURL(result.blob),
          width: result.width,
          height: result.height,
          edit: shown,
          source,
          frame: frameKey(image.id, shown),
          area: {
            x: inner.x * factor,
            y: inner.y * factor,
            width: inner.width * factor,
            height: inner.height * factor,
          },
        });
      })
      .catch(() => {
        // Superseded by a newer preview, which is drawn instead.
      });
    return () => {
      cancelled = true;
    };
  }, [image, shownKey, cropping]);

  // The object URL of a preview lives until the next one replaces it.
  const url = preview?.url ?? '';
  useEffect(
    () => () => {
      URL.revokeObjectURL(url);
    },
    [url],
  );

  let stage: ReactElement;
  if (preview?.key !== expectedKey) {
    stage = (
      <div className="preview__stage">
        <Spinner />
      </div>
    );
  } else {
    const drawn = { width: preview.width, height: preview.height };
    const turned =
      angle === preview.edit.straighten
        ? null
        : turnedView({
            source: preview.source,
            drawnEdit: preview.edit,
            drawn,
            angle,
            fullFrame: cropping,
            crop: edit.crop,
          });
    stage = cropping ? (
      <CropStage
        key={preview.frame}
        url={preview.url}
        drawn={drawn}
        turned={turned}
        area={preview.area}
        imageId={image.id}
      />
    ) : (
      <PreviewStage url={preview.url} drawn={drawn} turned={turned}>
        {/* react-roi fits the image once: a new size needs a new stage. */}
        <ViewStage
          key={`${image.id}:${preview.width}x${preview.height}`}
          url={preview.url}
          alt={image.name}
        />
      </PreviewStage>
    );
  }

  return (
    <div className="preview">
      {stage}
      {cropping ? (
        <div className="preview__toolbar">
          <div className="preview__rotate">
            <RotateSlider id={image.id} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ViewStage(props: { url: string; alt: string }): ReactElement {
  const { url, alt } = props;
  return (
    <RoiProvider initialConfig={{ mode: 'select' }}>
      <RoiContainer
        className="preview__viewer"
        target={<TargetImage src={url} alt={alt} data-testid="preview-image" />}
        zoomWithoutModifierKey
      />
    </RoiProvider>
  );
}

// The crop box is re-seeded only when the frame under it changes; a colour
// change swaps the image and keeps the stage.
function frameKey(imageId: string, edit: EditSettings): string {
  const { rotation, flipHorizontal, flipVertical, straighten } = edit;
  return JSON.stringify([
    imageId,
    rotation,
    flipHorizontal,
    flipVertical,
    straighten,
  ]);
}
