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
  assert.match(initialState, /installationState === ['"]unknown['"][\s\S]*readInstallReceipt\(\)/);
  assert.match(initialState, /installationState === ['"]not-installed['"][\s\S]*clearInstallReceipt\(\)/);
});

test('beforeinstallprompt does not erase positive installed evidence on its own', async () => {
  const js = await read('install.js');
  const handler = js.match(/window\.addEventListener\(['"]beforeinstallprompt['"],\s*\(event\)\s*=>\s*\{([\s\S]*?)\n\}\);/)?.[1] ?? '';
  assert.doesNotMatch(handler, /clearInstallReceipt\(\)/);
  assert.match(handler, /readInstallReceipt\(\)|installedStateDetected/);
  assert.match(handler, /deferredInstallPrompt\s*=\s*event/);
});

test('accepted Android install writes the receipt immediately', async () => {
  const js = await read('install.js');
  const clickHandler = js.match(/installButton\.addEventListener\(['"]click['"],\s*async\s*\(\)\s*=>\s*\{([\s\S]*?)\n\}\);/)?.[1] ?? '';
  assert.match(clickHandler, /choice\.outcome\s*===\s*['"]accepted['"][\s\S]*writeInstallReceipt\(\)[\s\S]*setInstalledState\(/);
});

test('confirmed Android PWA shows Open and Reinstall without restore or uninstall actions', async () => {
  const html = await read('index.html');
  const js = await read('install.js');
  const availability = js.match(/function getInstalledManagementAvailability\([^)]*\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.doesNotMatch(html, /id=["']uninstall-button["']/i);
  assert.match(availability, /isAndroid\(\)[^\n]*restore:\s*false/i);
  const installedState = js.match(/function setInstalledState\([^)]*\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.doesNotMatch(installedState, /Restore Home Screen shortcut/i);
  assert.match(installedState, /Reinstall/i);
});

test('Android installed confirmation is concise', async () => {
  const js = await read('install.js');
  const installedState = js.match(/function setInstalledState\([^)]*\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(installedState, /The myHRFH icon was added to your Home Screen\./i);
  assert.doesNotMatch(installedState, /cannot inspect|launcher icon|restore quick access/i);
});

test('Android fallback remains browser install rather than an unverifiable bookmark', async () => {
  const js = await read('install.js');
  const fallback = js.match(/function renderAndroidFallback\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(fallback, /Install app/i);
  assert.doesNotMatch(fallback, /Add to Home screen/i);
});

test('Android installed state retains intentional reinstall recovery', async () => {
  const html = await read('index.html');
  const js = await read('install.js');
  assert.match(html, /id=["']reinstall-button["'][^>]+hidden/i);
  assert.match(js, /reinstallButton\?\.addEventListener\(['"]click['"]/);
  assert.match(js, /clearInstallReceipt\(\)/);
});

test('PWA-only Android recovery refreshes the cached shell', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /const CACHE_NAME = ['"]myhrfh-installer-v8['"]/);
  assert.match(worker, /ANDROID_INSTALL_REVISION\s*=\s*['"]android-pwa-recovery-v3['"]/);
  assert.doesNotMatch(worker, /ANDROID_NATIVE_MANAGEMENT_REVISION|android-native-bridge/);
});