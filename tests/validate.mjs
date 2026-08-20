import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');
const readBuffer = (path) => readFile(fileUrl(path));

async function readManifest() {
  return JSON.parse(await read('manifest.webmanifest'));
}

function pngMetadata(buffer) {
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'asset must be a PNG');
  const colorType = buffer[25];
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorType,
    hasTransparency: colorType === 6 || buffer.includes(Buffer.from('tRNS'))
  };
}

test('manifest defines a same-origin standalone myHRFH app with a dedicated launch shell', async () => {
  const manifest = await readManifest();
  assert.equal(manifest.name, 'myHRFH');
  assert.equal(manifest.short_name, 'myHRFH');
  assert.equal(manifest.id, './');
  assert.equal(manifest.start_url, './launch.html');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.background_color, '#ffffff');
  assert.equal(manifest.theme_color, '#4a0d7f');
  assert.equal(manifest.prefer_related_applications, false);
});

test('manifest uses only local standard HRFH PNG artwork and no maskable tile', async () => {
  const manifest = await readManifest();
  const icons = manifest.icons ?? [];
  assert.equal(icons.length, 2);
  assert.ok(icons.every((icon) => icon.src.startsWith('./icons/') && icon.type === 'image/png'));
  assert.ok(icons.every((icon) => icon.purpose === 'any'));
  assert.ok(icons.some((icon) => icon.src === './icons/icon-192.png' && icon.sizes === '192x192'));
  assert.ok(icons.some((icon) => icon.src === './icons/icon-512.png' && icon.sizes === '512x512'));
  assert.ok(!icons.some((icon) => /maskable/i.test(icon.purpose ?? '') || /maskable/i.test(icon.src)), 'mark-only design must not expose a maskable tile');
  assert.ok(!icons.some((icon) => /^https?:/i.test(icon.src)), 'install icons must not depend on an external host');
});

test('native standard install assets are transparent branded PNGs', async () => {
  const assets = [
    ['icons/icon-192.png', 192, 3000],
    ['icons/icon-512.png', 512, 9000]
  ];

  for (const [path, expectedSize, minimumBytes] of assets) {
    const buffer = await readBuffer(path);
    const metadata = pngMetadata(buffer);
    assert.deepEqual(
      { width: metadata.width, height: metadata.height },
      { width: expectedSize, height: expectedSize },
      `${path} dimensions`
    );
    assert.equal(metadata.hasTransparency, true, `${path} must preserve transparent background pixels`);
    assert.ok(buffer.length > minimumBytes, `${path} must contain full branded artwork`);
  }
});

test('launch shell redirects before installer UI can paint', async () => {
  const launch = await read('launch.html');
  const head = launch.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  assert.match(head, /window\.location\.replace\(['"]https:\/\/myhrfh\.com['"]\)/i);
  assert.match(head, /http-equiv=["']refresh["'][^>]+https:\/\/myhrfh\.com/i);
  assert.doesNotMatch(launch, /install-card|platform-content|install-button/i);
});

test('installer page redirects standalone legacy launches in head before paint', async () => {
  const html = await read('index.html');
  const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  assert.match(head, /display-mode:\s*standalone/i);
  assert.match(head, /window\.location\.replace\(['"]https:\/\/myhrfh\.com['"]\)/i);
});

test('page uses concise sentence-case HRFH web app language', async () => {
  const html = await read('index.html');
  assert.match(html, /rel=["']manifest["'][^>]+href=["']\.\/manifest\.webmanifest["']/i);
  assert.match(html, /rel=["']apple-touch-icon["'][^>]+href=["']\.\/icons\/icon-192\.png["']/i);
  assert.match(html, /class=["']brand-icon["'][^>]+src=["']\.\/icons\/icon-192\.png["']/i);
  assert.match(html, /HR for Health/i);
  assert.match(html, />HRFH web app</i);
  assert.match(html, /Add the HRFH web app/i);
  assert.match(html, /Your HR for Health portal, one tap from your home screen\./i);
  assert.match(html, /<button[^>]+id=["']install-button["'][^>]*>\s*Install HRFH web app\s*<\/button>/is);
  assert.match(html, /<a[^>]+id=["']open-button["'][^>]*>\s*Open myHRFH\s*<\/a>/is);
  assert.match(html, /Opens <strong>myhrfh\.com<\/strong>/i);
  assert.doesNotMatch(html, /No app store|no download|no long setup/i);
});

test('styles preserve HRFH palette with subtle depth and gloss without forced uppercase', async () => {
  const css = await read('styles.css');
  assert.match(css, /--brand-purple:\s*#4a0d7f/i);
  assert.match(css, /--brand-purple-bright:\s*#8d4bd8/i);
  assert.match(css, /--brand-orange:\s*#f6a13d/i);
  assert.match(css, /--brand-coral:\s*#ff655e/i);
  assert.match(css, /--page:\s*#f7f5f2/i);
  assert.match(css, /--surface:\s*#ffffff/i);
  assert.match(css, /\.install-card::after/);
  assert.match(css, /\.button-primary::before/);
  assert.match(css, /backdrop-filter:\s*blur\(/i);
  assert.doesNotMatch(css, /text-transform:\s*uppercase/i);
});

test('install controller detects iOS, Android, Windows, macOS, and desktop Safari', async () => {
  const js = await read('install.js');
  assert.match(js, /function isIOS\(\)/);
  assert.match(js, /function isIOSChrome\(\)/);
  assert.match(js, /function isAndroid\(\)/);
  assert.match(js, /function isWindows\(\)/);
  assert.match(js, /function isMacOS\(\)/);
  assert.match(js, /function isDesktopSafari\(\)/);
  assert.match(js, /navigator\.userAgentData/);
  assert.match(js, /navigator\.platform/);
});

test('install controller is capability-first and adapts ready copy for Android and desktop', async () => {
  const js = await read('install.js');
  const destinations = js.match(/https:\/\/myhrfh\.com/g) ?? [];
  assert.ok(destinations.length >= 1, 'myHRFH destination must be present');
  assert.match(js, /beforeinstallprompt/);
  assert.match(js, /renderInstallReady\(\)/);
  assert.match(js, /Install the HRFH web app for quick access from your home screen\./i);
  assert.match(js, /Install the HRFH web app for quick access from this computer\./i);
  assert.match(js, /installButton\.textContent\s*=\s*['"]Install HRFH web app['"]/);
  assert.match(js, /appinstalled/);
  assert.match(js, /\.\/service-worker\.js/);
});

test('iPhone and iPad prioritize Chrome and retain Safari fallback guidance', async () => {
  const js = await read('install.js');
  assert.match(js, /Google Chrome is preferred/i);
  assert.match(js, /Chrome Share/i);
  assert.match(js, /Safari Share/i);
  assert.match(js, /Add to Home Screen/i);
  assert.match(js, /Continue in Safari/i);
  assert.match(js, /googlechromes:/i);
});

test('desktop fallbacks distinguish Mac Safari and general desktop browsers', async () => {
  const js = await read('install.js');
  assert.match(js, /Add to Dock/i);
  assert.match(js, /File[^<]*>[^<]*Add to Dock|File[^\n]*Add to Dock/i);
  assert.match(js, /Install the HRFH web app from your browser menu\./i);
  assert.match(js, /this computer/i);
});

test('legacy installed entry still forwards to myHRFH', async () => {
  const js = await read('install.js');
  assert.match(
    js,
    /if\s*\(isStandalone\(\)\)\s*\{\s*window\.location\.replace\(MYHRFH_URL\);\s*return;\s*\}/s
  );
});

test('manifest does not attempt a cross-origin myHRFH start_url or scope', async () => {
  const manifest = await readManifest();
  assert.doesNotMatch(manifest.start_url, /myhrfh\.com/i);
  assert.doesNotMatch(manifest.scope, /myhrfh\.com/i);
});

test('service worker never proxies or caches myHRFH and enforces same origin', async () => {
  const worker = await read('service-worker.js');
  assert.doesNotMatch(worker, /myhrfh\.com/i);
  assert.match(worker, /request\.method\s*!==\s*['"]GET['"]/);
  assert.match(worker, /url\.origin\s*!==\s*self\.location\.origin/);
  assert.match(worker, /\.\/launch\.html/);
});

test('service worker uses the guided release cache identity', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /const CACHE_NAME = ['"]myhrfh-installer-v2['"]/);
  assert.match(worker, /const IOS_GUIDED_OVERLAY_REVISION = ['"]ios-guided-overlay-v1['"]/);
});
