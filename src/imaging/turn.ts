import type { PixelRect } from './crop.ts';
import { toPixelsIn } from './crop.ts';
import type { Size } from './geometry.ts';
import { frameLayout, insideScale, orientedSize } from './geometry.ts';
import type { EditSettings, RelativeRect } from './settings.ts';

/** A drawn preview turned by the browser, until one at the new angle is drawn. */
export interface TurnedView {
  /** The box fitted into the stage, in pixels of the drawn image. */
  frame: Size;
  /** How far the drawn image turns, clockwise, in degrees. */
  angle: number;
  /** How much the drawn image grows around its centre. */
  zoom: number;
  /** The crop box, in pixels of `frame`; `null` when none is drawn. */
  box: PixelRect | null;
}

/** A drawn preview, and the angle it must look turned to. */
export interface TurnOptions {
  /** Size of the decoded source image. */
  source: Size;
  /** The edits the preview was drawn with. */
  drawnEdit: EditSettings;
  /** Size of the drawn preview. */
  drawn: Size;
  /** The straightening angle to show, in degrees. */
  angle: number;
  /** Whether the preview is the whole rotated image, as the crop view draws it. */
  fullFrame: boolean;
  /** The crop, drawn as a box over a whole rotated image. */
  crop: RelativeRect | null;
}

/**
 * How to show a drawn preview at another straightening angle without drawing
 * it again: turning an image rotated by one angle by the difference gives the
 * image rotated by the other.
 * @param options - The drawn preview and the angle to show.
 * @returns The box, the turn and the zoom to display it with.
 */
export function turnedView(options: TurnOptions): TurnedView {
  const { source, drawnEdit, drawn, angle, fullFrame, crop } = options;
  const turn = angle - drawnEdit.straighten;

  if (!fullFrame) {
    // The output keeps its shape; it only grows as less of the image stays inside.
    const oriented = orientedSize(source, drawnEdit.rotation);
    return {
      frame: drawn,
      angle: turn,
      zoom:
        insideScale(oriented, drawnEdit.straighten) /
        insideScale(oriented, angle),
      box: null,
    };
  }

  const factor = drawn.width / frameLayout(source, drawnEdit).bounds.width;
  const { bounds, inner } = frameLayout(source, {
    ...drawnEdit,
    straighten: angle,
  });
  const box = toPixelsIn(crop, inner);
  return {
    frame: { width: bounds.width * factor, height: bounds.height * factor },
    angle: turn,
    zoom: 1,
    box: {
      x: box.x * factor,
      y: box.y * factor,
      width: box.width * factor,
      height: box.height * factor,
    },
  };
}
