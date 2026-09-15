import { Callout } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useState } from 'react';
import {
  ActivityBar,
  DropZone,
  DropZoneContainer,
  SplitPane,
  Toolbar,
} from 'react-science/ui';

import { BrandMark } from '../components/Brand.tsx';
import type { ImageEntry } from '../imaging/readFiles.ts';
import { readImageFiles } from '../imaging/readFiles.ts';
import type { QuarterTurn } from '../imaging/settings.ts';
import { DEFAULT_EDIT } from '../imaging/settings.ts';
import { editOf, state, togglePanel, updateEdit } from '../state/index.ts';

import { AboutDialog } from './editor/AboutDialog.tsx';
import { CompareStage } from './editor/CompareStage.tsx';
import { PanelStack } from './editor/PanelStack.tsx';
import { Preview } from './editor/Preview.tsx';
import { DEFAULT_PANELS, PANELS } from './editor/panels.ts';

/**
 * The editor: tools on the left, the image, and the panels on the right.
 * @returns The page.
 */
export function Editor(): ReactElement {
  useSignals();
  const images = state.data.images.value;
  const selectedId = state.view.selectedId.value;
  const image = images.find((entry) => entry.id === selectedId) ?? images[0];
  const skipped = state.data.skipped.value;
  const error = state.view.error.value;
  const panels = state.view.panels.value;

  const messages = (
    <>
      {error ? <Callout intent="danger">{error}</Callout> : null}
      {skipped > 0 ? <SkippedCallout count={skipped} /> : null}
    </>
  );

  if (image === undefined) {
    return (
      <div className="editor-empty" data-testid="editor-drop">
        <p className="page-lead">
          Drop photos to crop, rotate, adjust, resize and compress them. They
          stay on your computer.
        </p>
        {messages}
        <DropZone
          emptyTitle="Drop images or a folder"
          emptyDescription="JPEG, PNG, WebP, GIF, AVIF, or ZIP archives of them."
          emptyButtonText="Choose images"
          emptyButtonIcon="folder-open"
          onDrop={(files) => void addImages(files)}
        />
      </div>
    );
  }

  const index = images.indexOf(image);
  return (
    <DropZoneContainer onDrop={(files) => void addImages(files)}>
      <div className="editor">
        <ImageTools image={image} />
        <SplitPane
          direction="horizontal"
          controlledSide="end"
          defaultSize="340px"
          open={panels.size > 0}
          onOpenChange={(isOpen) => {
            state.view.panels.value = isOpen ? DEFAULT_PANELS : new Set();
          }}
        >
          <div className="editor__main">
            {messages}
            {state.view.comparing.value ? (
              <CompareStage image={image} />
            ) : (
              <Preview image={image} />
            )}
            <div className="status-bar">
              {index + 1} / {images.length} · {image.relativePath}
            </div>
          </div>
          <PanelStack image={image} />
        </SplitPane>
        <ActivityBar>
          {PANELS.map((panel) => (
            <ActivityBar.Item
              key={panel.id}
              icon={panel.icon}
              tooltip={panel.title}
              active={panels.has(panel.id)}
              onClick={() => {
                togglePanel(panel.id);
              }}
            />
          ))}
        </ActivityBar>
      </div>
    </DropZoneContainer>
  );
}

function ImageTools(props: { image: ImageEntry }): ReactElement {
  useSignals();
  const { id } = props.image;
  const edit = editOf(id);
  const cropping = state.view.cropping.value;
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="editor__toolbar">
      <Toolbar vertical aria-label="Image tools">
        <Toolbar.Item
          icon={<BrandMark size={16} />}
          tooltip="About images.cheminfo"
          aria-label="About images.cheminfo"
          onClick={() => {
            setAboutOpen(true);
          }}
        />
        <Toolbar.Item
          icon="image-rotate-left"
          tooltip="Rotate left"
          aria-label="Rotate left"
          onClick={() => {
            updateEdit(id, { rotation: turn(edit.rotation, 270) });
          }}
        />
        <Toolbar.Item
          icon="image-rotate-right"
          tooltip="Rotate right"
          aria-label="Rotate right"
          onClick={() => {
            updateEdit(id, { rotation: turn(edit.rotation, 90) });
          }}
        />
        <Toolbar.Item
          icon="swap-horizontal"
          tooltip="Flip horizontally"
          aria-label="Flip horizontally"
          active={edit.flipHorizontal}
          onClick={() => {
            updateEdit(id, { flipHorizontal: !edit.flipHorizontal });
          }}
        />
        <Toolbar.Item
          icon="swap-vertical"
          tooltip="Flip vertically"
          aria-label="Flip vertically"
          active={edit.flipVertical}
          onClick={() => {
            updateEdit(id, { flipVertical: !edit.flipVertical });
          }}
        />
        <Toolbar.Item
          icon="clip"
          tooltip={cropping ? 'Finish cropping' : 'Crop'}
          aria-label="Crop"
          active={cropping}
          onClick={() => {
            state.view.comparing.value = false;
            state.view.cropping.value = !cropping;
          }}
        />
        <Toolbar.Item
          icon="comparison"
          tooltip="Compare the output with its lossless version"
          aria-label="Compare"
          active={state.view.comparing.value}
          onClick={() => {
            state.view.cropping.value = false;
            state.view.comparing.value = !state.view.comparing.value;
          }}
        />
        <Toolbar.Item
          icon="undo"
          tooltip="Reset every edit of this image"
          aria-label="Reset edits"
          onClick={() => {
            state.view.cropping.value = false;
            updateEdit(id, DEFAULT_EDIT);
          }}
        />
      </Toolbar>
      <AboutDialog
        isOpen={aboutOpen}
        onClose={() => {
          setAboutOpen(false);
        }}
      />
    </div>
  );
}

function SkippedCallout(props: { count: number }): ReactElement {
  const { count } = props;
  return (
    <Callout intent="warning">
      {count === 1
        ? '1 file was not an image a browser can read, and was left out.'
        : `${count} files were not images a browser can read, and were left out.`}
    </Callout>
  );
}

function turn(rotation: QuarterTurn, by: 90 | 270): QuarterTurn {
  return ((rotation + by) % 360) as QuarterTurn;
}

async function addImages(files: File[]): Promise<void> {
  state.view.error.value = null;
  try {
    const { images, skipped } = await readImageFiles(files);
    state.data.skipped.value = skipped;
    const [first] = images;
    if (first === undefined) return;
    state.data.images.value = [...state.data.images.peek(), ...images];
    state.view.selectedId.value = first.id;
    state.view.cropping.value = false;
  } catch (error) {
    state.view.error.value = String(error);
  }
}
