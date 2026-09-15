import { join } from 'node:path';

import { chromium } from '@playwright/test';

// The card a shared link unfurls into: the mark and the name, with the literal
// colours of public/favicon.svg, since the card is a file served on its own.
const html = `<!doctype html>
<html>
  <body style="margin:0;width:1200px;height:630px;display:flex;align-items:center;justify-content:center;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
    <div style="display:flex;align-items:center;gap:48px;padding:64px 80px;background:#fff;border:1px solid #dfe3e8;border-radius:32px">
      <svg width="200" height="200" viewBox="0 0 32 32">
        <rect width="32" height="32" rx="7" fill="#a21caf"/>
        <circle cx="21.5" cy="10.5" r="3.5" fill="#f59e0b"/>
        <path d="M4 25 12.5 13 18 20.5 21 17 28 25Z" fill="#ffffff"/>
      </svg>
      <div>
        <div style="font-size:84px;font-weight:700;letter-spacing:-0.01em">
          <span style="color:#a21caf">images</span><span style="color:#8a96a3">.</span><span style="color:#b45309">cheminfo</span>
        </div>
        <div style="margin-top:16px;font-size:34px;color:#5b6875">Crop, rotate, adjust, resize and compress<br>images, in your browser.</div>
      </div>
    </div>
  </body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.screenshot({
  path: join(import.meta.dirname, '../public/og.png'),
  type: 'png',
});
await browser.close();
