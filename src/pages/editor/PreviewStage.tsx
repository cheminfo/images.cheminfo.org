import type { ReactElement, ReactNode } from 'react';
import { useRef } from 'react';
import { useContainerSize } from 'react-cheminfo/ui';

import type { Size } from '../../imaging/geometry.ts';
import type { TurnedView } from '../../imaging/turn.ts';

interface PreviewStageProps {
  /** The drawn preview. */
  url: string;
  /** Size of the drawn preview. */
  drawn: Size;
  /** How the preview is turned, `null` when it shows the angle it was drawn at. */
  turned: TurnedView | null;
  /** What the stage shows when nothing is turned. */
  children: ReactNode;
}

/**
 * The stage of the preview. While a rotation is dragged, and until its render
 * arrives, the drawn preview is turned by the browser, which keeps up with the
 * slider.
 * @param props - The preview, how it is turned, and the stage at rest.
 * @returns The stage.
 */
export function PreviewStage(props: PreviewStageProps): ReactElement {
  const { url, drawn, turned, children } = props;
  const ref = useRef<HTMLDivElement>(null);
  const stage = useContainerSize(ref);

  return (
    <div ref={ref} className="preview__stage">
      {turned && stage.width > 0 ? (
        <div className="turned">
          <TurnedImage url={url} drawn={drawn} turned={turned} stage={stage} />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function TurnedImage(props: {
  url: string;
  drawn: Size;
  turned: TurnedView;
  stage: Size;
}): ReactElement {
  const { url, drawn, turned, stage } = props;
  const { frame, angle, zoom, box } = turned;
  const fit = Math.min(stage.width / frame.width, stage.height / frame.height);

  return (
    <div
      className="turned__frame"
      data-testid="turned-preview"
      style={{
        width: frame.width * fit,
        height: frame.height * fit,
        overflow: box ? 'visible' : 'hidden',
      }}
    >
      <img
        className="turned__image"
        src={url}
        alt=""
        style={{
          width: drawn.width * fit,
          height: drawn.height * fit,
          transform: `translate(-50%, -50%) rotate(${angle}deg) scale(${zoom})`,
        }}
      />
      {box ? (
        <div
          className="turned__box"
          style={{
            left: box.x * fit,
            top: box.y * fit,
            width: box.width * fit,
            height: box.height * fit,
          }}
        />
      ) : null}
    </div>
  );
}
