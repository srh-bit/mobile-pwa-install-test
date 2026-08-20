import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

async function readManifest() {
  return JSON.parse(await read('manifest.webmanifest'));
}

test('manifest defines a same-origin standalone myHRFH test app', async () => {
  const manifest = await readManifest();
  assert.equal(manifest.name, 'myHRFH Shortcut Test');
  assert.equal(manifest.short_name, 'myHRFH Test');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.prefer_related_applications, false);
});

test('manifest declares 192 and 512 PNG icons and maskable coverage', async () => {
  const manifest = await readManifest();
  const icons = manifest.icons ?? [];
  assert.ok(icons.some((icon) => icon.sizes === '192x192' && icon.type === 'image/png'));
  assert.ok(icons.some((icon) => icon.sizes === '512x512' && icon.type === 'image/png'));
  assert.ok(icons.some((icon) => icon.purpose?.includes('maskable')));
});

test('page links all install resources and presents myHRFH destination', async () => {
  const html = await read('index.html');
  assert.match(html, /rel=["']manifest["'][^>]+href=["']\.\/manifest\.webmanifest["']/i);
  assert.match(html, /rel=["']apple-touch-icon["'][^>]+href=["']\.\/icons\/icon-192\.png["']/i);
  assert.match(html, /href=["']\.\/styles\.css["']/i);
  assert.match(html, /src=["']\.\/install\.js["']/i);
  assert.match(html, /Add myHRFH to your phone/i);
  assert.match(html, /myhrfh\.com/i);
});

test('install controller targets myHRFH and supports Android and iOS flows', async () => {
  const js = await read('install.js');
  const destinations = js.match(/https:\/\/myhrfh\.com/g) ?? [];
  assert.ok(destinations.length >= 1, 'myHRFH destination must be present');
  assert.match(js, /beforeinstallprompt/);
  assert.match(js, /appinstalled/);
  assert.match(js, /Add to Home Screen/i);
  assert.match(js, /\.\/service-worker\.js/);
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
