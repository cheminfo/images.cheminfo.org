import { expect, test } from '@playwright/test';

// A real PNG of the page itself: 1280 × 720 at the default viewport.
async function screenshotPng(page: import('@playwright/test').Page) {
  await page.goto('/about');
  return page.screenshot({ type: 'png' });
}

test('the editor resizes, rotates and downloads a ZIP', async ({ page }) => {
  const png = await screenshotPng(page);
  await page.goto('/');
  await page
    .getByTestId('editor-drop')
    .locator('input[type="file"]')
    .setInputFiles([
      { name: 'first.png', mimeType: 'image/png', buffer: png },
      { name: 'second.png', mimeType: 'image/png', buffer: png },
      { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('x') },
    ]);

  await expect(page.getByTestId('image-list').getByRole('option')).toHaveCount(
    2,
  );
  await expect(page.getByText('1 file was not an image')).toBeVisible();
  await expect(page.getByTestId('preview-image')).toBeVisible();
  await expect(page.getByTestId('output-size')).toContainText('1280 × 720 px');

  await page.getByRole('button', { name: 'Rotate right' }).click();
  await expect(page.getByTestId('output-size')).toContainText('720 × 1280 px');

  await page.getByTestId('resize-value').fill('640');
  await page.getByTestId('resize-value').blur();
  await expect(page.getByTestId('output-size')).toContainText('360 × 640 px');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download all images' }).click();
  expect((await download).suggestedFilename()).toBe('images.zip');
});

test('a colour change keeps the crop stage in place', async ({ page }) => {
  const png = await screenshotPng(page);
  await page.goto('/');
  await page
    .getByTestId('editor-drop')
    .locator('input[type="file"]')
    .setInputFiles([{ name: 'shot.png', mimeType: 'image/png', buffer: png }]);
  await expect(page.getByTestId('preview-image')).toBeVisible();

  await page.getByRole('button', { name: 'Crop' }).click();
  const stage = page.locator('.preview__crop');
  const target = stage.locator('img');
  await expect(target).toBeVisible();
  const before = await target.getAttribute('src');
  await stage.evaluate((element) => {
    element.dataset.mounted = 'first';
  });

  const exposure = page.locator('.slider-row', { hasText: 'Exposure' });
  await expect(exposure).toBeHidden();
  await page.getByText('Adjust', { exact: true }).click();
  await exposure.locator('.bp6-slider-handle').press('ArrowRight');
  await expect(target).not.toHaveAttribute('src', before ?? '');
  await expect(stage).toHaveAttribute('data-mounted', 'first');
});

test('the preview is centred, zooms with the wheel, and dims outside the crop', async ({
  page,
}) => {
  const png = await screenshotPng(page);
  await page.goto('/');
  await page
    .getByTestId('editor-drop')
    .locator('input[type="file"]')
    .setInputFiles([{ name: 'shot.png', mimeType: 'image/png', buffer: png }]);

  const image = page.getByTestId('preview-image');
  await expect(image).toBeVisible();
  const viewer = await page.locator('.preview__viewer').boundingBox();
  const fitted = await image.boundingBox();
  if (!viewer || !fitted) throw new Error('the preview is not laid out');
  const viewerCentre = viewer.x + viewer.width / 2;
  expect(Math.abs(fitted.x + fitted.width / 2 - viewerCentre)).toBeLessThan(1);

  await page.mouse.move(viewerCentre, viewer.y + viewer.height / 2);
  for (let step = 0; step < 10; step++) {
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(40);
  }
  await expect
    .poll(async () => (await image.boundingBox())?.width ?? 0)
    .toBeGreaterThan(fitted.width * 1.5);

  await page.mouse.dblclick(viewerCentre, viewer.y + viewer.height / 2);
  await expect
    .poll(async () => Math.round((await image.boundingBox())?.width ?? 0))
    .toBe(Math.round(fitted.width));

  await page.getByRole('button', { name: 'Crop' }).click();
  await expect(page.getByTestId('crop')).toHaveCSS(
    'box-shadow',
    /rgba\(0, 0, 0, 0\.55\)/,
  );
});

test('dragging the rotation turns the drawn crop frame, and draws it once let go', async ({
  page,
}) => {
  const png = await screenshotPng(page);
  await page.goto('/');
  await page
    .getByTestId('editor-drop')
    .locator('input[type="file"]')
    .setInputFiles([{ name: 'shot.png', mimeType: 'image/png', buffer: png }]);
  await page.getByRole('button', { name: 'Crop' }).click();
  const target = page.locator('.preview__crop img');
  await expect(target).toBeVisible();
  const before = await target.getAttribute('src');

  const rotate = page.locator('.preview__rotate');
  const handle = await rotate.locator('.bp6-slider-handle').boundingBox();
  if (!handle) throw new Error('the rotation slider is not laid out');
  await page.mouse.move(
    handle.x + handle.width / 2,
    handle.y + handle.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 + 40, handle.y, {
    steps: 5,
  });

  const turned = page.getByTestId('turned-preview');
  await expect(turned).toBeVisible();
  await expect(turned.locator('img')).toHaveAttribute('src', before ?? '');
  await expect(turned.locator('img')).toHaveAttribute(
    'style',
    /rotate\((?!0deg)[\d.]+deg\)/,
  );
  const label = await rotate.locator('.slider-row__label').textContent();
  expect(label).not.toBe('Rotate0°');

  await page.mouse.up();
  await expect(turned).toBeHidden();
  await expect(target).toBeVisible();
  await expect(target).not.toHaveAttribute('src', before ?? '');
  await expect(rotate.locator('.slider-row__label')).toHaveText(label ?? '');
});

test('auto mode downloads the resized image straight away', async ({
  page,
}) => {
  const png = await screenshotPng(page);
  await page.goto('/auto');
  await page.getByTestId('resize-value').fill('400');
  await page.getByTestId('resize-value').blur();

  const download = page.waitForEvent('download');
  await page
    .getByTestId('auto-drop')
    .locator('input[type="file"]')
    .setInputFiles([{ name: 'shot.png', mimeType: 'image/png', buffer: png }]);
  expect((await download).suggestedFilename()).toBe('shot.jpg');
  const results = page.getByTestId('auto-results');
  await expect(results).toContainText('1280 × 720 px');
  await expect(results).toContainText('400 × 225 px');
  await expect(results).toContainText(/\d+ % smaller/);
});

test('separate files go into the folder picked, and the choice is kept', async ({
  page,
}) => {
  // A picker cannot be driven headless: the origin's private file system
  // stands in for the folder the visitor would pick.
  await page.addInitScript(() => {
    Object.assign(globalThis, {
      showDirectoryPicker: () => navigator.storage.getDirectory(),
    });
  });
  const png = await screenshotPng(page);
  await page.goto('/auto');
  await page.getByText('Separate files', { exact: true }).click();
  await page
    .getByTestId('auto-drop')
    .locator('input[type="file"]')
    .setInputFiles([
      { name: 'a.png', mimeType: 'image/png', buffer: png },
      { name: 'b.png', mimeType: 'image/png', buffer: png },
    ]);

  await expect
    .poll(() =>
      page.evaluate(async () => {
        const root = await navigator.storage.getDirectory();
        const names = await Promise.all(
          ['a.jpg', 'b.jpg'].map((name) =>
            root.getFileHandle(name).then(
              () => name,
              () => null,
            ),
          ),
        );
        return names;
      }),
    )
    .toStrictEqual(['a.jpg', 'b.jpg']);

  await page.reload();
  await expect(page.getByText('Written into a folder you pick')).toBeVisible();
});

test('without a folder picker, separate files download one by one', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(globalThis, 'showDirectoryPicker');
  });
  const png = await screenshotPng(page);
  await page.goto('/auto');
  await page.getByText('Separate files', { exact: true }).click();
  await expect(page.getByText('One download each')).toBeVisible();

  const names: string[] = [];
  page.on('download', (download) => {
    names.push(download.suggestedFilename());
  });
  await page
    .getByTestId('auto-drop')
    .locator('input[type="file"]')
    .setInputFiles([
      { name: 'a.png', mimeType: 'image/png', buffer: png },
      { name: 'b.png', mimeType: 'image/png', buffer: png },
    ]);
  await expect.poll(() => names.toSorted()).toStrictEqual(['a.jpg', 'b.jpg']);
});

test('the editor toolbar opens the About in a dialog', async ({ page }) => {
  const png = await screenshotPng(page);
  await page.goto('/');
  await page
    .getByTestId('editor-drop')
    .locator('input[type="file"]')
    .setInputFiles([{ name: 'shot.png', mimeType: 'image/png', buffer: png }]);

  await page.getByRole('button', { name: 'About images.cheminfo' }).click();
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByRole('heading', { name: 'What you can do here' }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/$/);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId('preview-image')).toBeVisible();
});

test('the About is a page of its own', async ({ page }) => {
  await page.goto('/about');
  await expect(page).toHaveTitle('About — images.cheminfo.org');
  await expect(
    page.getByRole('heading', { name: 'What you can do here' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'images.cheminfo' }).first().click();
  await expect(page.getByTestId('editor-drop')).toBeVisible();
});
