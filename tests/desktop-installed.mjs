import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

async function readManifest() {
  return JSON.parse(await read('manifest.webmanifest'));
}

test('manifest declares itself as a related web app for installed-state detection', async () => {
  const manifest = await readManifest();
  assert.deepEqual(manifest.related_applications, [
    {
      platform: 'webapp',
      url: './manifest.webmanifest',
      id: 'https://srh-bit.github.io/mobile-pwa-install-test/'
    }
  ]);
  assert.equal(manifest.prefer_related_applications, false);
});

test('desktop controller detects an already-installed PWA before rendering fallback guidance', async () => {
  const js = await read('install.js');
  assert.match(js, /navigator\.getInstalledRelatedApps/);
  assert.match(js, /async function isPWAInstalled\(\)/);
  assert.match(js, /HRFH web app is already installed\./i);
  assert.match(js, /openButton\.href\s*=\s*['"]\.\/launch\.html['"]/);
  assert.match(js, /openButton\.textContent\s*=\s*['"]Open HRFH web app['"]/);
  assert.match(js, /await isPWAInstalled\(\)/);
  assert.match(js, /if\s*\(deferredInstallPrompt\)\s*\{\s*renderInstallReady\(\)/s);
});

test('service worker refreshes the app shell for desktop installed-state detection', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /const CACHE_NAME = ['"]myhrfh-shortcut-test-v8['"]/);
  assert.match(worker, /const BUILD_REVISION = ['"]desktop-installed-state-v1['"]/);
});
