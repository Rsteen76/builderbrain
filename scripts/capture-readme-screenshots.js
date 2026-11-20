const fs = require('fs');
const path = require('path');

const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
const outputDir = path.resolve(
  __dirname,
  '..',
  'docs',
  'screenshots'
);

// Heights are picked so no number or label is cut off at the bottom edge of a picture.
const DEFAULT_HEIGHT = 1064;

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const capture = async (page, route, fileName, waitForMs = 1800, height = DEFAULT_HEIGHT) => {
  console.log(`Capturing ${route} -> ${fileName}`);
  await page.setViewportSize({ width: 1440, height });
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(waitForMs);
  await page.screenshot({
    path: path.join(outputDir, fileName),
    fullPage: false,
  });
};

(async () => {
  ensureDir(outputDir);

  // PLAYWRIGHT_CHANNEL=chrome uses an installed Chrome when Playwright's own browser is not downloaded.
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: DEFAULT_HEIGHT },
    deviceScaleFactor: 1,
  });
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(15000);

  try {
    // Dev auth bypass signs in on its own, so only fill the form if it still shows.
    console.log('Opening app with dev auth bypass');
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    if (new URL(page.url()).pathname.endsWith('/login')) {
      await page.fill('input[name="email"]', 'demo@builderbrain.local');
      await page.fill('input[name="password"]', 'demo-password');
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.pathname.endsWith('/login'), {
        timeout: 15000,
      });
    }
    await page.waitForTimeout(2000);

    await capture(page, '/', 'dashboard.png');
    await capture(page, '/projects', 'projects.png');
    await capture(page, '/projects/proj-hillside', 'project-detail.png', 2400);
    await capture(page, '/bids', 'bids.png', 1800, 1150);

    console.log(`Screenshots saved to ${outputDir}`);
  } catch (error) {
    const debugPath = path.join(outputDir, 'capture-debug.png');
    await page.screenshot({ path: debugPath, fullPage: false }).catch(() => {});
    console.error(`Screenshot capture failed. Debug image: ${debugPath}`);
    throw error;
  } finally {
    await browser.close();
  }
})();
