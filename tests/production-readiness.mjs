import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

test('installed state keeps Android recovery to Open and Reinstall with no uninstall or restore control', async () => {
  const html = await read('index.html');
  const js = await read('install.js');
  assert.doesNotMatch(html, /uninstall-button|restore-shortcut-button|management-dialog/i);
  assert.match(js, /reinstallButton\.hidden\s*=\s*!\(confirmed\s*&&\s*isAndroid\(\)\)/i);
  assert.doesNotMatch(js, /requestAndroidUninstall|showUninstallHelp|HRFHAndroidNative|getInstalledManagementAvailability|showShortcutHelp/i);
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

test('Android and desktop install recovery is driven by live install capability, not restore shortcuts or stale receipts', async () => {
  const js = await read('install.js');
  const html = await read('index.html');
  const handler = js.match(/window\.addEventListener\(['"]beforeinstallprompt['"],\s*\(event\)\s*=>\s*\{([\s\S]*?)\n\}\);/)?.[1] ?? '';
  const androidFallback = js.match(/function renderAndroidFallback\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  const desktopFallback = js.match(/function renderDesktopFallback\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(handler, /deferredInstallPrompt\s*=\s*event/);
  assert.match(handler, /clearInstallReceipt\(\)/);
  assert.match(handler, /renderInstallReady\(\)/);
  assert.doesNotMatch(handler, /readInstallReceipt\(\)/);
  assert.match(androidFallback, /installButton\.hidden\s*=\s*false/i);
  assert.match(desktopFallback, /installButton\.hidden\s*=\s*false/i);
  assert.doesNotMatch(html, /restore-shortcut-button|management-dialog/i);
  assert.doesNotMatch(js, /chrome:\/\/apps|edge:\/\/apps|ShortcutManager|requestPinShortcut|launcher database/i);
});

test('public installer includes privacy and indexing safeguards without iOS calibration storage', async () => {
  const html = await read('index.html');
  const guidanceJs = await read('ios-guidance-v2.js');
  assert.match(html, /name=["']referrer["'][^>]+content=["']no-referrer["']/i);
  assert.match(html, /name=["']robots["'][^>]+content=["']noindex,\s*nofollow["']/i);
  assert.doesNotMatch(guidanceJs, /sessionStorage|localStorage/i);
});

test('service worker uses production navigation freshness and the non-iOS install-affordance release identity', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /const CACHE_NAME = ['"]myhrfh-installer-v9['"]/);
  assert.match(worker, /android-desktop-install-affordance-v1/i);
  assert.match(worker, /hrfh-transparent-icon-v1/i);
  assert.match(worker, /android-pwa-recovery-v2/i);
  assert.match(worker, /ios-final-guidance-v2/i);
  assert.match(worker, /production-readiness-v2/i);
  assert.match(worker, /request\.mode\s*===\s*['"]navigate['"]/);
  assert.match(worker, /url\.origin\s*!==\s*self\.location\.origin/);
});

test('production readiness and security guidance document browser-only boundaries and release packaging separation', async () => {
  const readiness = await read('docs/PRODUCTION-READINESS.md');
  const security = await read('SECURITY.md');
  const workflow = await read('.github/workflows/validate.yml');
  assert.match(readiness, /myhrfh\.com/i);
  assert.match(readiness, /getInstalledRelatedApps/i);
  assert.match(readiness, /beforeinstallprompt/i);
  assert.match(readiness, /cannot[^\n]*(?:inspect|detect|verify)[^\n]*(?:Home Screen|launcher)/i);
  assert.doesNotMatch(readiness, /Android[^\n]*Restore Home Screen shortcut/i);
  assert.doesNotMatch(readiness, /Managed Android TWA|ShortcutManager|ACTION_DELETE/i);
  assert.match(readiness, /Content-Security-Policy/i);
  assert.match(readiness, /Strict-Transport-Security/i);
  assert.match(readiness, /Packaging is a separate post-device-acceptance action/i);
  assert.doesNotMatch(workflow, /actions\/upload-artifact|hrfh-web-install-marketing\.zip/i);
  assert.match(security, /No credentials/i);
  assert.match(security, /No analytics/i);
});