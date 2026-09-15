import { Dialog, DialogBody } from '@blueprintjs/core';
import type { ReactElement } from 'react';

import { BrandMark } from '../../components/Brand.tsx';
import { AboutContent } from '../About.tsx';

/**
 * The About, opened from the editor toolbar without leaving the images.
 * @param props - The dialog state.
 * @param props.isOpen - Whether the dialog is shown.
 * @param props.onClose - Called when the dialog is dismissed.
 * @returns The dialog.
 */
export function AboutDialog(props: {
  isOpen: boolean;
  onClose: () => void;
}): ReactElement {
  const { isOpen, onClose } = props;
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="About images.cheminfo"
      icon={<BrandMark size={20} />}
      style={{ width: 640 }}
    >
      <DialogBody data-testid="about-dialog">
        <AboutContent />
      </DialogBody>
    </Dialog>
  );
}
