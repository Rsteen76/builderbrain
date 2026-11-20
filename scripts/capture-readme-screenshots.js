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

const WIDTH = 1440;
const TALL_VIEWPORT_HEIGHT = 2400;
const BOTTOM_PADDING = 24;

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

/**
 * Bottom edge (in page pixels) of the outermost card or panel that contains the given text.
 * Each picture ends here, so no card, button or row is sliced at the bottom edge.
 */
const sectionBottom = (page, text) =>
  page.evaluate((needle) => {
    const heading = [...document.querySelectorAll('*')].find(
      (el) => el.children.length === 0 && el.textContent.trim() === needle
    );
    if (!heading) return null;
    let bottom = null;
    for (let el = heading.parentElement; el; el = el.parentElement) {
      if (el.matches('.MuiPaper-root, .MuiCard-root')) {
        bottom = el.getBoundingClientRect().bottom + window.scrollY;
      }
    }
    return bottom;
  }, text);

const capture = async (page, route, fileName, { endAfter, waitForMs = 1800 }) => {
  console.log(`Capturing ${route} -> ${fileName}`);
  await page.setViewportSize({ width: WIDTH, height: TALL_VIEWPORT_HEIGHT });
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(waitForMs);
  const bottom = await sectionBottom(page, endAfter);
  if (!bottom) {
    throw new Error(`Could not find "${endAfter}" on ${route} to end the picture after it`);
  }
  const height = Math.ceil(bottom + BOTTOM_PADDING);
  console.log(`  ends after "${endAfter}" at ${height}px`);
  await page.setViewportSize({ width: WIDTH, height });
  await page.waitForTimeout(400);
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
    viewport: { width: WIDTH, height: TALL_VIEWPORT_HEIGHT },
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

    await capture(page, '/', 'dashboard.png', { endAfter: 'Upcoming Deadlines' });
    await capture(page, '/projects', 'projects.png', { endAfter: 'Riverside Retail Tenant Improvement' });
    await capture(page, '/projects/proj-hillside', 'project-detail.png', {
      endAfter: 'Financial Overview',
      waitForMs: 2400,
    });
    await capture(page, '/bids', 'bids.png', { endAfter: 'HVAC modification and balance' });

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
