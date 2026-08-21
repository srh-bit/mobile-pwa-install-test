import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

test('Android successful related-app probe can distinguish installed from not installed', async () => {
  const js = await read('install.js');
  const probe = js.match(/async function getInstallationState\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(probe, /navigator\.getInstalledRelatedApps\(\)/);
  assert.match(probe, /return ['"]installed['"]/);
  assert.match(probe, /isAndroid\(\)[\s\S]*clearInstallReceipt\(\)[\s\S]*return ['"]not-installed['"]/);
  assert.match(probe, /catch[\s\S]*return ['"]unknown['"]/);
});

test('Android refresh uses receipt only when the browser probe is unknown', async () => {
  const js = await read('install.js');
  const initialState = js.match(/async function renderInitialState\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(initialState, /installationState === ['"]installed['"]/);
  assert.match(initialState, /installationState === ['"]unknown['"][\s\S]*isAndroid\(\)[\s\S]*readInstallReceipt\(\)/);
  assert.match(initialState, /installationState === ['"]not-installed['"][\s\S]*clearInstallReceipt\(\)/);
});

test('beforeinstallprompt supersedes stale Android fallback evidence', async () => {
  const js = await read('install.js');
  const handler = js.match(/window\.addEventListener\(['"]beforeinstallprompt['"],\s*\(event\)\s*=>\s*\{([\s\S]*?)\n\}\);/)?.[1] ?? '';
  assert.match(handler, /deferredInstallPrompt\s*=\s*event/);
  assert.match(handler, /installedStateDetected\s*=\s*false/);
  assert.match(handler, /clearInstallReceipt\(\)/);
  assert.match(handler, /renderInstallReady\(\)/);
  assert.doesNotMatch(handler, /readInstallReceipt\(\)/);
  assert.doesNotMatch(handler, /if\s*\([^)]*installedStateDetected/i);
});

test('accepted Android install writes the receipt immediately', async () => {
  const js = await read('install.js');
  const clickHandler = js.match(/installButton\.addEventListener\(['"]click['"],\s*async\s*\(\)\s*=>\s*\{([\s\S]*?)\n\}\);/)?.[1] ?? '';
  assert.match(clickHandler, /choice\.outcome\s*===\s*['"]accepted['"][\s\S]*writeInstallReceipt\(\)[\s\S]*setInstalledState\(/);
});

test('confirmed Android PWA shows Open and Reinstall without restore or uninstall actions', async () => {
  const html = await read('index.html');
  const js = await read('install.js');
  assert.doesNotMatch(html, /restore-shortcut-button|uninstall-button/i);
  assert.doesNotMatch(js, /getInstalledManagementAvailability|showShortcutHelp|Restore Home Screen shortcut/i);
  assert.match(js, /reinstallButton\.hidden\s*=\s*!\(confirmed\s*&&\s*isAndroid\(\)\)/i);
  assert.match(js, /openButton\.textContent\s*=\s*['"]Open HRFH web app['"]/i);
});

test('Android installed confirmation is concise', async () => {
  const js = await read('install.js');
  assert.match(js, /if\s*\(isAndroid\(\)\)\s*\{[\s\S]*The myHRFH icon was added to your Home Screen\./i);
  assert.doesNotMatch(js, /cannot inspect|launcher icon|restore quick access/i);
});

test('Android fallback remains browser install rather than an unverifiable bookmark', async () => {
  const js = await read('install.js');
  const fallback = js.match(/function renderAndroidFallback\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(fallback, /Install app/i);
  assert.match(fallback, /installButton\.hidden\s*=\s*false/i);
  assert.doesNotMatch(fallback, /Add to Home screen/i);
});

test('Android installed state retains intentional reinstall recovery', async () => {
  const html = await read('index.html');
  const js = await read('install.js');
  assert.match(html, /id=["']reinstall-button["'][^>]+hidden/i);
  assert.match(js, /reinstallButton\?\.addEventListener\(['"]click['"]/);
  assert.match(js, /clearInstallReceipt\(\)/);
});

test('PWA-only Android UI cleanup refreshes the cached shell', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /const CACHE_NAME = ['"]myhrfh-installer-v9['"]/);
  assert.match(worker, /ANDROID_INSTALL_REVISION\s*=\s*['"]android-pwa-recovery-v2['"]/);
  assert.match(worker, /ANDROID_UI_REVISION\s*=\s*['"]android-installed-ui-v1['"]/);
  assert.match(worker, /HRFH_ICON_REVISION\s*=\s*['"]hrfh-transparent-icon-v1['"]/);
  assert.doesNotMatch(worker, /ANDROID_NATIVE_MANAGEMENT_REVISION|android-native-bridge/);
});
