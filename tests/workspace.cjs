const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));

const root = path.resolve(__dirname, '..');
const artifacts = path.join(root, 'artifacts');
fs.mkdirSync(artifacts, { recursive: true });
const url = process.env.TEST_URL || 'http://127.0.0.1:5173';
const routes = ['dashboard', 'project', 'sample', 'materials', 'chain', 'rights', 'crossborder', 'production', 'decision', 'release', 'archive'];
const errors = [];

async function settled(page, route) {
  await page.waitForFunction((id) => document.body.dataset.page === id && document.querySelector('.step-section.active')?.id === id, route);
  await page.waitForFunction(() => document.querySelectorAll('.step-section.active').length === 1);
  await page.waitForTimeout(850);
  assert.equal(await page.locator(`#${route}`).evaluate((element) => getComputedStyle(element).opacity), '1');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  assert.equal(overflow, false, `Horizontal overflow on ${route}`);
}

async function navigate(page, route) {
  await page.locator(`.nav-item[data-step="${route}"]`).click();
  await settled(page, route);
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(url, { waitUntil: 'networkidle' });
    await settled(page, 'dashboard');
    assert.equal(await page.evaluate(() => gsap.version), '3.15.0');
    assert.equal(await page.locator('#archiveImage').evaluate((image) => image.complete && image.naturalWidth > 0), true);
    assert.equal(await page.locator('.nav-item svg').count(), 11);
    await page.screenshot({ path: path.join(artifacts, 'dashboard-desktop.png'), fullPage: true });

    for (const route of routes.slice(1)) {
      await navigate(page, route);
      if (['sample', 'chain', 'production', 'archive'].includes(route)) await page.screenshot({ path: path.join(artifacts, `${route}-desktop.png`), fullPage: true });
    }
    await navigate(page, 'project');
    await page.locator('#projectName').fill('侨批动态交互测试项目');
    await page.locator('.nav-item[data-step="sample"]').click();
    await page.waitForTimeout(65);
    assert.equal(await page.evaluate(() => gsap.isTweening(document.getElementById('project'))), true, 'GSAP exit motion should be running');
    await page.waitForTimeout(180);
    assert.equal(await page.evaluate(() => gsap.isTweening(document.querySelector('.page-heading'))), true, 'GSAP entrance motion should be running');
    await settled(page, 'sample');
    await page.goBack();
    await settled(page, 'project');
    await page.evaluate(() => { for (const route of ['sample', 'chain', 'archive', 'rights', 'materials', 'production']) WorkspaceUI.navigate(route); });
    await settled(page, 'production');
    assert.equal(await page.locator('#projectName').inputValue(), '侨批动态交互测试项目');
    await page.goBack();
    await settled(page, 'project');
    await page.goForward();
    await settled(page, 'production');

    await page.locator('#imageUpload').setInputFiles({ name: 'invalid.png', mimeType: 'image/png', buffer: Buffer.from('invalid image') });
    await page.waitForFunction(() => document.querySelector('#mediaSummary').innerText.includes('无法读取'));
    assert.equal(await page.locator('.media-card').count(), 0, 'Invalid images must not be counted as recognized');
    await page.evaluate(async () => {
      const response = await fetch('assets/qiaopi.jpg');
      const blob = await response.blob();
      const scan = handleImageFiles([new File([blob], 'cancelled.jpg', { type: 'image/jpeg' })]);
      document.getElementById('clearImages').click();
      await scan;
    });
    assert.equal(await page.locator('.media-card').count(), 0, 'Clearing an in-flight scan must cancel its result');
    await page.locator('#imageUpload').setInputFiles(path.join(root, 'assets/qiaopi.jpg'));
    await page.waitForFunction(() => document.querySelector('#mediaGrid img')?.naturalWidth > 0);
    assert.match(await page.locator('#mediaSummary').innerText(), /已识别 1 张图片/);
    await page.locator('#saveProduction').click();
    assert.equal(await page.locator('#sidebarProgress').innerText(), '4 / 8');
    await page.screenshot({ path: path.join(artifacts, 'production-uploaded.png'), fullPage: true });
    await navigate(page, 'sample');
    await page.locator('#buildSample').click();
    await page.waitForSelector('.sample-card');
    await navigate(page, 'materials');
    await page.locator('#addMaterial').click();
    await navigate(page, 'rights');
    await page.locator('#buildBenefit').click();
    await navigate(page, 'release');
    await page.locator('#runReleaseCheck').click();
    assert.match(await page.locator('#releaseOutput').innerText(), /需整改/);
    for (const checkbox of await page.locator('#releaseChecks input').all()) await checkbox.check();
    await page.locator('#runReleaseCheck').click();
    assert.match(await page.locator('#releaseOutput').innerText(), /检查通过/);
    await navigate(page, 'archive');
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#exportArchive').click();
    const download = await downloadPromise;
    const filename = path.join(artifacts, 'tested-archive.json');
    await download.saveAs(filename);
    const archive = JSON.parse(fs.readFileSync(filename, 'utf8'));
    assert.equal(archive.samples.length, 1);
    assert.equal(archive.materials.length, 1);
    assert.equal(archive.production.mediaAnalyses.length, 1);
    assert.equal(archive.production.saved, true);
    assert.equal(archive.releaseStatus, '检查通过');
    await navigate(page, 'dashboard');
    assert.equal(await page.locator('#sampleCount').innerText(), '1');
    assert.equal(await page.locator('#materialCount').innerText(), '1');
    assert.equal(await page.locator('#imageCount').innerText(), '1');
    await page.screenshot({ path: path.join(artifacts, 'dashboard-with-records.png'), fullPage: true });

    await page.locator('#motionEnabled').uncheck({ force: true });
    await navigate(page, 'chain');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#motionEnabled').isChecked(), false);
    await settled(page, 'chain');
    await context.close();

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const mobilePage = await mobileContext.newPage();
    mobilePage.on('pageerror', (error) => errors.push(error.message));
    await mobilePage.goto(url, { waitUntil: 'networkidle' });
    await settled(mobilePage, 'dashboard');
    await mobilePage.screenshot({ path: path.join(artifacts, 'dashboard-mobile.png'), fullPage: true });
    for (const route of routes.slice(1)) {
      await mobilePage.locator('#menuToggle').click();
      await mobilePage.locator(`.nav-item[data-step="${route}"]`).click();
      await settled(mobilePage, route);
      assert.equal(await mobilePage.locator('#menuToggle').getAttribute('aria-expanded'), 'false');
      if (['production', 'chain'].includes(route)) await mobilePage.screenshot({ path: path.join(artifacts, `${route}-mobile.png`), fullPage: true });
    }
    await mobilePage.locator('#menuToggle').click();
    await mobilePage.keyboard.press('Escape');
    assert.equal(await mobilePage.locator('#menuToggle').getAttribute('aria-expanded'), 'false');
    await mobileContext.close();

    const reducedContext = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.goto(`${url}/#sample`, { waitUntil: 'networkidle' });
    await settled(reducedPage, 'sample');
    await navigate(reducedPage, 'chain');
    const activeAnimations = await reducedPage.evaluate(() => gsap.globalTimeline.getChildren(true, true, true).filter((animation) => animation.isActive()).length);
    assert.equal(activeAnimations, 0);
    await reducedContext.close();
    for (const width of [375, 768, 1024, 1920]) {
      const responsiveContext = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const responsivePage = await responsiveContext.newPage();
      await responsivePage.goto(url, { waitUntil: 'networkidle' });
      await settled(responsivePage, 'dashboard');
      await responsivePage.screenshot({ path: path.join(artifacts, `dashboard-${width}.png`), fullPage: true });
      for (const route of ['sample', 'rights', 'production', 'archive']) {
        await responsivePage.evaluate((id) => WorkspaceUI.navigate(id), route);
        await settled(responsivePage, route);
      }
      await responsiveContext.close();
    }
    assert.deepEqual(errors, [], 'Browser errors');
    console.log('PASS: 11 routes, active GSAP transitions, rapid navigation, history, form retention, uploads, invalid images, scan cancellation, JSON export, mobile drawer, motion setting, reduced motion and 375/768/1024/1920px layouts.');
    console.log(`Screenshots: ${artifacts}`);
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
