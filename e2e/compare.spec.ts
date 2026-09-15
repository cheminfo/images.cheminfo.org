import { expect, test } from '@playwright/test';

test('compare splits the lossless image from the compressed one', async ({
  page,
}) => {
  await page.goto('/about');
  const png = await page.screenshot({ type: 'png' });
  await page.goto('/');
  await page
    .getByTestId('editor-drop')
    .locator('input[type="file"]')
    .setInputFiles([{ name: 'shot.png', mimeType: 'image/png', buffer: png }]);

  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(page.getByTestId('compare-reference')).toBeVisible();
  await expect(page.getByTestId('compare-output')).toBeVisible();
  await expect(page.getByTestId('compare-reference-label')).toContainText(
    'Lossless PNG',
  );
  await expect(page.getByTestId('compare-output-label')).toContainText(
    'JPEG 85',
  );

  await page.getByRole('button', { name: 'Actual pixels' }).click();
  await expect(page.getByTestId('compare-zoom')).toHaveText('100%');

  const divider = page.getByTestId('compare-divider');
  await expect(divider).toHaveAttribute('aria-valuenow', '50');
  await divider.press('ArrowLeft');
  await expect(divider).toHaveAttribute('aria-valuenow', '48');
  await expect(page.locator('.compare__output')).toHaveCSS(
    'clip-path',
    'inset(0px 0px 0px 48%)',
  );

  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByTestId('preview-image')).toBeVisible();
});
