import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

test('Android refresh honors a positive install receipt before exposing a new install prompt', async () => {
  const js = await read('install.js');
  const initialState = js.match(/async function renderInitialState\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

  const receiptIndex = initialState.indexOf('readInstallReceipt()');
  const promptIndex = initialState.indexOf('waitForInstallPrompt()');

  assert.ok(receiptIndex >= 0, 'renderInitialState should consult the persisted install receipt');
  assert.ok(promptIndex >= 0, 'renderInitialState should still support the browser install prompt');
  assert.ok(receiptIndex < promptIndex, 'positive install evidence must win before a new install prompt is rendered');
});

test('beforeinstallprompt does not erase positive installed evidence', async () => {
  const js = await read('install.js');
  const handler = js.match(/window\.addEventListener\(['"]beforeinstallprompt['"],\s*\(event\)\s*=>\s*\{([\s\S]*?)\n\}\);/)?.[1] ?? '';

  assert.doesNotMatch(handler, /clearInstallReceipt\(\)/);
  assert.match(handler, /readInstallReceipt\(\)|installedStateDetected/);
  assert.match(handler, /deferredInstallPrompt\s*=\s*event/);
});

test('accepted Android install writes the receipt immediately instead of waiting only for appinstalled', async () => {
  const js = await read('install.js');
  const clickHandler = js.match(/installButton\.addEventListener\(['"]click['"],\s*async\s*\(\)\s*=>\s*\{([\s\S]*?)\n\}\);/)?.[1] ?? '';
  const acceptedBranch = clickHandler.match(/if\s*\(choice\.outcome\s*===\s*['"]accepted['"]\)\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';

  assert.match(acceptedBranch, /writeInstallReceipt\(\)/);
  assert.match(acceptedBranch, /setInstalledState\(/);
});

test('Android web-only state does not expose instruction-only Restore or Uninstall controls', async () => {
  const js = await read('install.js');
  const availability = js.match(/function getInstalledManagementAvailability\([^)]*\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

  assert.doesNotMatch(availability, /isAndroid\(\)/);
});

test('desktop browser helpers explicitly exclude Android', async () => {
  const js = await read('install.js');
  const chromeDesktop = js.match(/function isChromeDesktop\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  const edgeDesktop = js.match(/function isEdgeDesktop\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

  assert.match(chromeDesktop, /!isAndroid\(\)/);
  assert.match(edgeDesktop, /!isAndroid\(\)/);
});

test('Android fallback does not encourage an unverifiable launcher bookmark', async () => {
  const js = await read('install.js');
  const fallback = js.match(/function renderAndroidFallback\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

  assert.match(fallback, /Install app/i);
  assert.doesNotMatch(fallback, /Add to Home screen/i);
});

test('Android installed state provides an intentional reinstall recovery action', async () => {
  const html = await read('index.html');
  const js = await read('install.js');

  assert.match(html, /id=["']reinstall-button["'][^>]+hidden/i);
  assert.match(js, /const reinstallButton\s*=\s*document\.getElementById\(['"]reinstall-button['"]\)/);
  assert.match(js, /reinstallButton\?\.addEventListener\(['"]click['"]/);
  assert.match(js, /clearInstallReceipt\(\)/);
  assert.match(js, /renderInstallReady\(\)|window\.location\.reload\(\)/);
});

test('Android installed-state release rotates the cached shell', async () => {
  const worker = await read('service-worker.js');

  assert.match(worker, /const CACHE_NAME = ['"]myhrfh-installer-v6['"]/);
  assert.match(worker, /ANDROID_INSTALL_REVISION\s*=\s*['"]android-installed-state-v1['"]/);
});

test('Android production contract distinguishes browser evidence from native management', async () => {
  const readme = await read('README.md');
  const readiness = await read('docs/PRODUCTION-READINESS.md');
  const security = await read('SECURITY.md');
  const combined = `${readme}\n${readiness}\n${security}`;

  assert.match(readme, /myhrfh-installer-v6/i);
  assert.match(readiness, /beforeinstallprompt[^\n]*(?:must not|does not|never)[^\n]*(?:clear|erase|invalidate)/i);
  assert.match(readiness, /arbitrary[^\n]*(?:launcher|home screen)[^\n]*(?:bookmark|shortcut|icon)/i);
  assert.match(readiness, /Reinstall/i);
  assert.match(readiness, /Trusted Web Activity|TWA/i);
  assert.match(readiness, /ShortcutManager/i);
  assert.match(readiness, /Restore[^\n]*Uninstall|Uninstall[^\n]*Restore/i);
  assert.match(security, /non-SDK|hidden API/i);
  assert.doesNotMatch(combined, /beforeinstallprompt[^\n]*(?:clears|invalidates)[^\n]*receipt/i);
});
