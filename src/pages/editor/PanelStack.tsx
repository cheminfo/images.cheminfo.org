import { Button } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { Accordion, AccordionProvider } from 'react-science/ui';

import type { ImageEntry } from '../../imaging/readFiles.ts';
import { state, togglePanel } from '../../state/index.ts';

import { EditPanel } from './EditPanel.tsx';
import { ImageList } from './ImageList.tsx';
import { OutputPanel } from './OutputPanel.tsx';
import type { PanelId } from './panels.ts';
import { PANELS } from './panels.ts';

/**
 * The open side panels, each with a share of the height.
 * @param props - The image on screen.
 * @returns The stack.
 */
export function PanelStack(props: { image: ImageEntry }): ReactElement {
  useSignals();
  const { image } = props;
  const open = state.view.panels.value;

  return (
    <div className="panel-stack">
      <AccordionProvider>
        <Accordion>
          {PANELS.filter((panel) => open.has(panel.id)).map((panel) => (
            <Accordion.Item
              key={panel.id}
              id={panel.id}
              title={panel.title}
              defaultOpen={panel.defaultOpen}
              renderToolbar={() => (
                <Button
                  variant="minimal"
                  icon="cross"
                  aria-label={`Close ${panel.title}`}
                  onClick={() => {
                    togglePanel(panel.id);
                  }}
                />
              )}
            >
              <PanelBody id={panel.id} image={image} />
            </Accordion.Item>
          ))}
        </Accordion>
      </AccordionProvider>
    </div>
  );
}

function PanelBody(props: { id: PanelId; image: ImageEntry }): ReactElement {
  useSignals();
  const { id, image } = props;
  if (id === 'images') {
    return (
      <div className="panel">
        <ImageList images={state.data.images.value} selectedId={image.id} />
      </div>
    );
  }
  if (id === 'adjust') return <EditPanel id={image.id} />;
  return <OutputPanel image={image} />;
}
