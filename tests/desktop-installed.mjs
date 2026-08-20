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

test('desktop controller combines browser detection with a standalone install receipt', async () => {
  const js = await read('install.js');
  const launch = await read('launch.html');
  const html = await read('index.html');

  assert.match(js, /const INSTALL_RECEIPT_KEY = ['"]myhrfh-install-receipt-v1['"]/);
  assert.match(js, /function readInstallReceipt\(\)/);
  assert.match(js, /function writeInstallReceipt\(\)/);
  assert.match(js, /function clearInstallReceipt\(\)/);
  assert.match(js, /navigator\.getInstalledRelatedApps/);
  assert.match(js, /async function getInstallationState\(\)/);
  assert.match(js, /HRFH web app is already installed\./i);
  assert.match(js, /openButton\.href\s*=\s*['"]\.\/launch\.html['"]/);
  assert.match(js, /openButton\.textContent\s*=\s*['"]Open HRFH web app['"]/);
  assert.match(js, /const installationState = await getInstallationState\(\)/);
  assert.match(js, /installationState\s*===\s*['"]installed['"]/);
  assert.match(js, /deferredInstallPrompt\s*\|\|\s*await waitForInstallPrompt\(\)/);
  assert.match(js, /if\s*\(readInstallReceipt\(\)\)\s*\{[\s\S]*setInstalledState/s);
  assert.match(js, /beforeinstallprompt[\s\S]*clearInstallReceipt\(\)/s);
  assert.match(js, /appinstalled[\s\S]*writeInstallReceipt\(\)/s);

  const launchHead = launch.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  assert.match(launchHead, /display-mode:\s*standalone/i);
  assert.match(launchHead, /localStorage\.setItem\(['"]myhrfh-install-receipt-v1['"]/);
  assert.match(launchHead, /window\.location\.replace\(['"]https:\/\/myhrfh\.com['"]\)/i);

  const indexHead = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  assert.match(indexHead, /localStorage\.setItem\(['"]myhrfh-install-receipt-v1['"]/);
});

test('empty related-app results are not treated as definitive not-installed state', async () => {
  const js = await read('install.js');
  const stateFunction = js.match(/async function getInstallationState\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

  assert.match(stateFunction, /return ['"]installed['"]/);
  assert.match(stateFunction, /return ['"]unknown['"]/);
  assert.doesNotMatch(stateFunction, /return ['"]not-installed['"]/);
});

test('service worker refreshes the app shell without regressing desktop installed-state detection', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /const CACHE_NAME = ['"]myhrfh-installer-v3['"]/);
  assert.match(worker, /const BUILD_REVISION = ['"]desktop-installed-state-v2['"]/);
  assert.match(worker, /const IOS_GUIDANCE_REVISION = ['"]ios-guidance-v3['"]/);
});
