import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

test('installed state exposes management actions only through explicit capability gating', async () => {
  const html = await read('index.html');
  const js = await read('install.js');

  assert.match(html, /id=["']restore-shortcut-button["'][^>]+hidden/i);
  assert.match(html, /id=["']uninstall-button["'][^>]+hidden/i);
  assert.match(html, /id=["']management-dialog["']/i);
  assert.match(js, /function getInstalledManagementAvailability\(/);
  assert.match(js, /confirmed/);
  assert.match(js, /restoreShortcutButton\.hidden\s*=\s*!management\.restore/);
  assert.match(js, /uninstallButton\.hidden\s*=\s*!management\.uninstall/);
  assert.doesNotMatch(js, /navigator\.[A-Za-z]*uninstall\s*\(/i);
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
  assert.match(guidanceJs, /<circle\s+cx="12"\s+cy="12"\s+r="10"\s+fill="none"/i);
  assert.doesNotMatch(guidanceJs, /sessionStorage|needsCalibration|buildCalibration/i);

  assert.match(modalCss, /\.ios-install-modal/);
  assert.match(modalCss, /backdrop-filter:\s*blur/i);
  assert.match(finalCss, /\.ios-symbol-shell/);
  assert.match(finalCss, /var\(--brand-purple\)/i);
  assert.match(finalCss, /env\(safe-area-inset-/i);
  assert.match(finalCss, /prefers-reduced-motion/i);
});

test('installation probing confirms installed state and keeps empty relationship results unknown', async () => {
  const js = await read('install.js');
  const stateFunction = js.match(/async function getInstallationState\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

  assert.match(js, /async function getInstallationState\(\)/);
  assert.match(stateFunction, /return ['"]installed['"]/);
  assert.match(stateFunction, /return ['"]unknown['"]/);
  assert.doesNotMatch(stateFunction, /return ['"]not-installed['"]/);
  assert.match(js, /INSTALL_RECEIPT_KEY/);
  assert.match(js, /beforeinstallprompt[\s\S]*clearInstallReceipt\(\)/s);
  assert.match(js, /INSTALL_PROMPT_WAIT_MS/);
});

test('shortcut restore guidance is platform-aware and never claims icon visibility can be detected', async () => {
  const js = await read('install.js');

  assert.match(js, /chrome:\/\/apps/i);
  assert.match(js, /Create shortcut/i);
  assert.match(js, /edge:\/\/apps/i);
  assert.match(js, /Create Desktop shortcut/i);
  assert.match(js, /Shortcut placement is managed by your device/i);
  assert.doesNotMatch(js, /shortcut.*detected|icon.*detected/i);
});

test('uninstall guidance is platform-aware and user-controlled', async () => {
  const js = await read('install.js');

  assert.match(js, /Uninstall myHRFH/i);
  assert.match(js, /chrome:\/\/apps/i);
  assert.match(js, /edge:\/\/apps/i);
  assert.match(js, /your device controls removal/i);
});

test('public installer includes privacy and indexing safeguards without iOS calibration storage', async () => {
  const html = await read('index.html');
  const guidanceJs = await read('ios-guidance-v2.js');

  assert.match(html, /name=["']referrer["'][^>]+content=["']no-referrer["']/i);
  assert.match(html, /name=["']robots["'][^>]+content=["']noindex,\s*nofollow["']/i);
  assert.match(html, /aria-describedby=["']management-copy["']/i);
  assert.doesNotMatch(guidanceJs, /sessionStorage|localStorage/i);
});

test('service worker uses production navigation freshness and the v5 release cache identity', async () => {
  const worker = await read('service-worker.js');

  assert.match(worker, /const CACHE_NAME = ['"]myhrfh-installer-v5['"]/);
  assert.match(worker, /ios-final-guidance-v2/i);
  assert.match(worker, /production-readiness-v1/i);
  assert.match(worker, /request\.mode\s*===\s*['"]navigate['"]/);
  assert.match(worker, /fetch\(request\)[\s\S]*caches\.match\(request\)/s);
  assert.match(worker, /url\.origin\s*!==\s*self\.location\.origin/);
});

test('production readiness and security guidance are documented', async () => {
  const readiness = await read('docs/PRODUCTION-READINESS.md');
  const security = await read('SECURITY.md');

  assert.match(readiness, /myhrfh\.com/i);
  assert.match(readiness, /getInstalledRelatedApps/i);
  assert.match(readiness, /Home Screen[^\n]*icon|icon[^\n]*Home Screen/i);
  assert.match(readiness, /Share/i);
  assert.match(readiness, /Add to Home Screen/i);
  assert.match(readiness, /vector|symbol|icon/i);
  assert.match(readiness, /management actions/i);
  assert.match(readiness, /uninstall/i);
  assert.match(readiness, /Content-Security-Policy/i);
  assert.match(readiness, /Strict-Transport-Security/i);
  assert.doesNotMatch(readiness, /What do you see|Where is your Chrome address bar|Change toolbar setting/i);
  assert.match(security, /no credentials/i);
  assert.match(security, /no analytics/i);
  assert.match(security, /report/i);
});