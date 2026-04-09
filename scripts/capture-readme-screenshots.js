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

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const capture = async (page, route, fileName, waitForMs = 1800) => {
  console.log(`Capturing ${route} -> ${fileName}`);
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(waitForMs);
  await page.screenshot({
    path: path.join(outputDir, fileName),
    fullPage: false,
  });
};

(async () => {
  ensureDir(outputDir);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1024 },
    deviceScaleFactor: 1,
  });
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(15000);

  try {
    console.log('Opening login page');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Sign in', { timeout: 30000 });
    await page.waitForSelector('input[name="email"]', { timeout: 30000 });
    await page.fill('input[name="email"]', 'demo@builderbrain.local');
    await page.fill('input[name="password"]', 'demo-password');
    console.log('Signing in with dev bypass');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.endsWith('/login'), {
      timeout: 15000,
    });
    await page.waitForTimeout(2000);

    await capture(page, '/', 'dashboard.png');
    await capture(page, '/projects', 'projects.png');
    await capture(page, '/projects/proj-hillside', 'project-detail.png', 2400);
    await capture(page, '/bids', 'bids.png');

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
