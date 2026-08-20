import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

test('installed state exposes restore through explicit confirmation gating and no uninstall control', async () => {
  const html = await read('index.html');
  const js = await read('install.js');
  assert.match(html, /id=["']restore-shortcut-button["'][^>]+hidden/i);
  assert.doesNotMatch(html, /id=["']uninstall-button["']/i);
  assert.match(js, /function getInstalledManagementAvailability\(/);
  assert.match(js, /confirmed/);
  assert.match(js, /restoreShortcutButton\.hidden\s*=\s*!management\.restore/);
  assert.doesNotMatch(js, /requestAndroidUninstall|showUninstallHelp|HRFHAndroidNative/);
});

test('iOS guidance uses a branded modal and direct iOS-style action symbols', async () => {
  const html = await read('index.html');
  const guidanceJs = await read('ios-guidance-v2.js');
  const modalCss = await read('ios-modal.css');
  const finalCss = await read('ios-guidance-v3.css');
  assert.match(html, /id=["']ios-toolbar-guide["']/i);
  assert.match(html, /Tap Share/i);
  assert.match(html, /Add to Home Screen/i);
  assert.match(guidanceJs, /function guidanceProfile\(/);
  assert.match(guidanceJs, /function shareSymbol\(/);
  assert.match(guidanceJs, /function moreSymbol\(/);
  assert.match(guidanceJs, /function addHomeSymbol\(/);
  assert.doesNotMatch(guidanceJs, /sessionStorage|needsCalibration|buildCalibration/i);
  assert.match(modalCss, /\.ios-install-modal/);
  assert.match(finalCss, /env\(safe-area-inset-/i);
  assert.match(finalCss, /prefers-reduced-motion/i);
});

test('installation probing uses definitive empty result only on supported Android', async () => {
  const js = await read('install.js');
  const stateFunction = js.match(/async function getInstallationState\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(stateFunction, /return ['"]installed['"]/);
  assert.match(stateFunction, /isAndroid\(\)[\s\S]*return ['"]not-installed['"]/);
  assert.match(stateFunction, /return ['"]unknown['"]/);
});

test('shortcut recovery remains user-controlled', async () => {
  const js = await read('install.js');
  assert.match(js, /Open your app list and find myHRFH/i);
  assert.match(js, /chrome:\/\/apps/i);
  assert.match(js, /edge:\/\/apps/i);
  assert.match(js, /cannot inspect the Android Home Screen or launcher icon/i);
});

test('public installer includes privacy and indexing safeguards without iOS calibration storage', async () => {
  const html = await read('index.html');
  const guidanceJs = await read('ios-guidance-v2.js');
  assert.match(html, /name=["']referrer["'][^>]+content=["']no-referrer["']/i);
  assert.match(html, /name=["']robots["'][^>]+content=["']noindex,\s*nofollow["']/i);
  assert.doesNotMatch(guidanceJs, /sessionStorage|localStorage/i);
});

test('service worker uses production navigation freshness and v8 PWA-only release identity', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /const CACHE_NAME = ['"]myhrfh-installer-v8['"]/);
  assert.match(worker, /android-pwa-recovery-v2/i);
  assert.match(worker, /ios-final-guidance-v2/i);
  assert.match(worker, /production-readiness-v2/i);
  assert.match(worker, /request\.mode\s*===\s*['"]navigate['"]/);
  assert.match(worker, /url\.origin\s*!==\s*self\.location\.origin/);
});

test('production readiness and security guidance document browser-only boundaries', async () => {
  const readiness = await read('docs/PRODUCTION-READINESS.md');
  const security = await read('SECURITY.md');
  assert.match(readiness, /myhrfh\.com/i);
  assert.match(readiness, /getInstalledRelatedApps/i);
  assert.match(readiness, /Restore Home Screen shortcut/i);
  assert.match(readiness, /cannot[^\n]*(?:inspect|detect|verify)[^\n]*(?:Home Screen|launcher)/i);
  assert.doesNotMatch(readiness, /Managed Android TWA|ShortcutManager|ACTION_DELETE/i);
  assert.match(readiness, /Content-Security-Policy/i);
  assert.match(readiness, /Strict-Transport-Security/i);
  assert.match(security, /No credentials/i);
  assert.match(security, /No analytics/i);
});