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

test('desktop controller combines browser detection with a standalone install receipt', async () => {
  const js = await read('install.js');
  const launch = await read('launch.html');
  const promptHandler = js.match(/window\.addEventListener\(['"]beforeinstallprompt['"],\s*\(event\)\s*=>\s*\{([\s\S]*?)\n\}\);/)?.[1] ?? '';

  assert.match(js, /INSTALL_RECEIPT_KEY\s*=\s*['"]myhrfh-install-receipt-v1['"]/i);
  assert.match(js, /function readInstallReceipt\(/i);
  assert.match(js, /function writeInstallReceipt\(/i);
  assert.match(js, /function clearInstallReceipt\(/i);
  assert.match(js, /navigator\.getInstalledRelatedApps/i);
  assert.match(promptHandler, /readInstallReceipt\(\)/);
  assert.doesNotMatch(promptHandler, /clearInstallReceipt\(\)/);
  assert.match(js, /appinstalled[\s\S]*writeInstallReceipt\(\)/s);
  assert.match(js, /readInstallReceipt\(\)[\s\S]*setInstalledState/s);

  assert.match(launch, /display-mode:\s*standalone/i);
  assert.match(launch, /navigator\.standalone\s*===\s*true/i);
  assert.match(launch, /localStorage\.setItem\(['"]myhrfh-install-receipt-v1['"],\s*['"]installed['"]\)/i);
  assert.match(launch, /window\.location\.replace\(['"]https:\/\/myhrfh\.com['"]\)/i);
});

test('empty related-app results are not treated as definitive not-installed state', async () => {
  const js = await read('install.js');
  const stateFunction = js.match(/async function getInstallationState\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

  assert.match(stateFunction, /return ['"]installed['"]/i);
  assert.match(stateFunction, /return ['"]unknown['"]/i);
  assert.doesNotMatch(stateFunction, /return ['"]not-installed['"]/i);
});

test('service worker refreshes the app shell without regressing desktop installed-state detection', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /const CACHE_NAME = ['"]myhrfh-installer-v6['"]/);
  assert.match(worker, /const BUILD_REVISION = ['"]desktop-installed-state-v2['"]/);
});