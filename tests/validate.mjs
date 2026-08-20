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
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorType: buffer[25]
  };
}

test('manifest defines a same-origin standalone myHRFH app with HRFH theme', async () => {
  const manifest = await readManifest();
  assert.equal(manifest.name, 'myHRFH');
  assert.equal(manifest.short_name, 'myHRFH');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.background_color, '#ffffff');
  assert.equal(manifest.theme_color, '#4a0d7f');
  assert.equal(manifest.prefer_related_applications, false);
});

test('manifest uses only local HR for Health PNG artwork for install icons', async () => {
  const manifest = await readManifest();
  const icons = manifest.icons ?? [];
  assert.ok(icons.length >= 4);
  assert.ok(icons.every((icon) => icon.src.startsWith('./icons/') && icon.type === 'image/png'));
  assert.ok(icons.some((icon) => icon.src === './icons/icon-192.png' && icon.sizes === '192x192' && icon.purpose === 'any'));
  assert.ok(icons.some((icon) => icon.src === './icons/icon-512.png' && icon.sizes === '512x512' && icon.purpose === 'any'));
  assert.ok(icons.some((icon) => icon.src === './icons/icon-maskable-192.png' && icon.sizes === '192x192' && icon.purpose === 'maskable'));
  assert.ok(icons.some((icon) => icon.src === './icons/icon-maskable-512.png' && icon.sizes === '512x512' && icon.purpose === 'maskable'));
  assert.ok(!icons.some((icon) => /^https?:/i.test(icon.src)), 'install icons must not depend on an external host');
});

test('native install assets are RGBA branded PNGs with translucent-capable artwork', async () => {
  const assets = [
    ['icons/icon-192.png', 192, 2500],
    ['icons/icon-512.png', 512, 5000],
    ['icons/icon-maskable-192.png', 192, 2500],
    ['icons/icon-maskable-512.png', 512, 5000]
  ];

  for (const [path, expectedSize, minimumBytes] of assets) {
    const buffer = await readBuffer(path);
    const metadata = pngMetadata(buffer);
    assert.deepEqual(
      { width: metadata.width, height: metadata.height },
      { width: expectedSize, height: expectedSize },
      `${path} dimensions`
    );
    assert.equal(metadata.colorType, 6, `${path} must use RGBA color for translucent icon treatment`);
    assert.ok(buffer.length > minimumBytes, `${path} must contain full branded artwork`);
  }
});

test('page uses concise sentence-case HRFH web app language', async () => {
  const html = await read('index.html');
  assert.match(html, /rel=["']manifest["'][^>]+href=["']\.\/manifest\.webmanifest["']/i);
  assert.match(html, /rel=["']apple-touch-icon["'][^>]+href=["']\.\/icons\/icon-192\.png["']/i);
  assert.match(html, /class=["']brand-icon["'][^>]+src=["']\.\/icons\/icon-192\.png["']/i);
  assert.match(html, /HR for Health/i);
  assert.match(html, />HRFH web app</i);
  assert.match(html, /Add the HRFH web app/i);
  assert.match(html, /Your HR for Health portal, one tap from your Home Screen\./i);
  assert.match(html, />Add HRFH web app</i);
  assert.match(html, />Open myHRFH</i);
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

test('install controller uses concise HRFH web app wording for Android and iOS', async () => {
  const js = await read('install.js');
  const destinations = js.match(/https:\/\/myhrfh\.com/g) ?? [];
  assert.ok(destinations.length >= 1, 'myHRFH destination must be present');
  assert.match(js, /beforeinstallprompt/);
  assert.match(js, /appinstalled/);
  assert.match(js, /Add the HRFH web app in two quick steps\./i);
  assert.match(js, /Add the HRFH web app\./i);
  assert.match(js, /\.\/service-worker\.js/);
  assert.doesNotMatch(js, /Add myHRFH in three quick steps/i);
});

test('installed shortcut immediately forwards to myHRFH instead of rendering installer', async () => {
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
});

test('service worker rotates cache after modern branded icon replacement', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /const CACHE_NAME = ['"]myhrfh-shortcut-test-v6['"]/);
});
