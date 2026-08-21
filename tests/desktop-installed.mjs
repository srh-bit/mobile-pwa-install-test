import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

test('manifest declares itself as a related web app for installed-state detection', async () => {
  const manifest = JSON.parse(await read('manifest.webmanifest'));
  const related = manifest.related_applications ?? [];
  assert.ok(related.some((app) => app.platform === 'webapp'));
  assert.equal(manifest.prefer_related_applications, false);
});

test('desktop controller keeps receipt fallback but lets a fresh browser install prompt invalidate stale desktop state', async () => {
  const js = await read('install.js');
  const launch = await read('launch.html');
  const promptHandler = js.match(/window\.addEventListener\(['"]beforeinstallprompt['"],\s*\(event\)\s*=>\s*\{([\s\S]*?)\n\}\);/)?.[1] ?? '';
  const initialState = js.match(/async function renderInitialState\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(js, /INSTALL_PROMPT_WAIT_MS\s*=\s*1200/i);
  assert.match(js, /INSTALL_RECEIPT_KEY\s*=\s*['"]myhrfh-install-receipt-v1['"]/i);
  assert.match(js, /function readInstallReceipt\(/i);
  assert.match(js, /function writeInstallReceipt\(/i);
  assert.match(js, /function clearInstallReceipt\(/i);
  assert.match(js, /navigator\.getInstalledRelatedApps/i);
  assert.match(promptHandler, /deferredInstallPrompt\s*=\s*event/i);
  assert.match(promptHandler, /if\s*\(isAndroid\(\)\s*&&\s*\(installedStateDetected\s*\|\|\s*readInstallReceipt\(\)\)\)/i);
  assert.match(promptHandler, /if\s*\(!isAndroid\(\)\)[\s\S]*clearInstallReceipt\(\)[\s\S]*installedStateDetected\s*=\s*false/i);
  assert.match(promptHandler, /renderInstallReady\(\)/i);
  assert.match(initialState, /installationState === ['"]unknown['"]\s*&&\s*readInstallReceipt\(\)/i);
  assert.match(initialState, /deferredInstallPrompt\s*\|\|\s*await waitForInstallPrompt\(\)/i);
  assert.match(js, /appinstalled[\s\S]*writeInstallReceipt\(\)/s);
  assert.match(launch, /display-mode:\s*standalone/i);
  assert.match(launch, /localStorage\.setItem\(['"]myhrfh-install-receipt-v1['"],\s*['"]installed['"]\)/i);
  assert.match(launch, /window\.location\.replace\(['"]https:\/\/myhrfh\.com['"]\)/i);
});

test('empty related-app result remains definitive only on Android when the browser API cannot prove desktop self-PWA support', async () => {
  const js = await read('install.js');
  const stateFunction = js.match(/async function getInstallationState\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(stateFunction, /if\s*\(isAndroid\(\)\)[\s\S]*return ['"]not-installed['"]/i);
  assert.match(stateFunction, /return ['"]unknown['"]/i);
});

test('service worker refreshes the app shell for restored pre-Marketing behavior', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /const CACHE_NAME = ['"]myhrfh-installer-v11['"]/);
  assert.match(worker, /const BUILD_REVISION = ['"]pre-marketing-install-behavior-v1['"]/);
  assert.match(worker, /const HRFH_ICON_REVISION = ['"]hrfh-transparent-icon-v1['"]/);
});
