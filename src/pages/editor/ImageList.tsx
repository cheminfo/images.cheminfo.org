import type { ReactElement } from 'react';
import { useEffect, useRef } from 'react';
import { formatBytes } from 'react-cheminfo/core';
import { useListKeyboardNavigation } from 'react-cheminfo/ui';

import type { ImageEntry } from '../../imaging/readFiles.ts';
import { state } from '../../state/index.ts';

/**
 * The dropped images; arrow keys move the selection.
 * @param props - The images and the one on screen.
 * @returns The list.
 */
export function ImageList(props: {
  images: readonly ImageEntry[];
  selectedId: string;
}): ReactElement {
  const { images, selectedId } = props;
  const listRef = useRef<HTMLUListElement>(null);
  const selectedIndex = images.findIndex((image) => image.id === selectedId);

  const onKeyDown = useListKeyboardNavigation({
    length: images.length,
    selectedIndex,
    onSelect: (index) => {
      const image = images[index];
      if (image) select(image.id);
    },
  });

  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  return (
    <ul
      ref={listRef}
      className="image-list"
      role="listbox"
      aria-label="Images"
      tabIndex={0}
      data-testid="image-list"
      onKeyDown={onKeyDown}
    >
      {images.map((image) => {
        const active = image.id === selectedId;
        const slash = image.relativePath.lastIndexOf('/');
        const folder = slash === -1 ? '' : image.relativePath.slice(0, slash);
        return (
          <li
            key={image.id}
            role="option"
            aria-selected={active}
            className={
              active
                ? 'image-list__item image-list__item--active'
                : 'image-list__item'
            }
            onClick={() => {
              select(image.id);
            }}
          >
            <span className="image-list__name" title={image.relativePath}>
              {image.name}
            </span>
            <span className="image-list__meta">
              {[folder, image.size > 0 ? formatBytes(image.size) : '']
                .filter(Boolean)
                .join(' · ')}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function select(id: string): void {
  state.view.selectedId.value = id;
  state.view.cropping.value = false;
}
