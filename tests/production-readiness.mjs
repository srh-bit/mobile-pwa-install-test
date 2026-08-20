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
  assert.match(html, /id=["']management-title["']/i);
  assert.match(html, /id=["']management-steps["']/i);

  assert.match(js, /function getInstalledManagementAvailability\(/);
  assert.match(js, /confirmed/);
  assert.match(js, /restoreShortcutButton\.hidden\s*=\s*!management\.restore/);
  assert.match(js, /uninstallButton\.hidden\s*=\s*!management\.uninstall/);
  assert.match(js, /installedActions\.hidden\s*=\s*!\(management\.restore\s*\|\|\s*management\.uninstall\)/);
  assert.match(js, /HRFH web app is installed\./i);
  assert.match(js, /function showShortcutHelp\(\)/);
  assert.match(js, /function showUninstallHelp\(\)/);
  assert.doesNotMatch(js, /navigator\.[A-Za-z]*uninstall\s*\(/i, 'public web pages must not pretend they can uninstall a PWA');
});

test('iOS guidance uses a branded modal plus calibrated coachmarks', async () => {
  const html = await read('index.html');
  const coreJs = await read('install.js');
  const guidanceJs = await read('ios-guidance-v2.js');
  const modalCss = await read('ios-modal.css');
  const v3Css = await read('ios-guidance-v3.css');

  assert.match(html, /id=["']ios-toolbar-guide["']/i);
  assert.match(html, /id=["']ios-guide-step-one["']/i);
  assert.match(html, /id=["']ios-guide-step-two["']/i);
  assert.match(html, />Tap Share</i);
  assert.match(html, />Add to Home Screen</i);

  assert.match(coreJs, /function isIPad\(\)/);
  assert.match(coreJs, /showIOSInstallModal/);

  assert.match(guidanceJs, /function guidanceProfile\(/);
  assert.match(guidanceJs, /function needsCalibration\(/);
  assert.match(guidanceJs, /function buildCalibration\(/);
  assert.match(guidanceJs, /sessionStorage/i);
  assert.match(guidanceJs, /chrome-address-top|chrome-address-bottom/i);
  assert.match(guidanceJs, /safari-control-share|safari-control-more/i);

  assert.match(modalCss, /\.ios-install-modal/);
  assert.match(modalCss, /backdrop-filter:\s*blur/i);
  assert.match(v3Css, /\.ios-v3-coachmark/);
  assert.match(v3Css, /env\(safe-area-inset-/i);
  assert.match(v3Css, /prefers-reduced-motion/i);
});

test('installation probing confirms installed state and keeps empty relationship results unknown', async () => {
  const js = await read('install.js');
  const stateFunction = js.match(/async function getInstallationState\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

  assert.match(js, /async function getInstallationState\(\)/);
  assert.match(stateFunction, /return ['"]installed['"]/);
  assert.match(stateFunction, /return ['"]unknown['"]/);
  assert.doesNotMatch(stateFunction, /return ['"]not-installed['"]/, 'an empty relationship result is not definitive proof of uninstall');
  assert.match(js, /INSTALL_RECEIPT_KEY/);
  assert.match(js, /function readInstallReceipt\(\)/);
  assert.match(js, /beforeinstallprompt[\s\S]*clearInstallReceipt\(\)/s);
  assert.match(js, /INSTALL_PROMPT_WAIT_MS/);
  assert.match(js, /Checking this device/i);
  assert.doesNotMatch(js, /async function isPWAInstalled\(\)/);
});

test('shortcut restore guidance is platform-aware and never claims icon visibility can be detected', async () => {
  const js = await read('install.js');

  assert.match(js, /chrome:\/\/apps/i);
  assert.match(js, /Create shortcut/i);
  assert.match(js, /edge:\/\/apps/i);
  assert.match(js, /Create Desktop shortcut/i);
  assert.match(js, /home screen/i);
  assert.match(js, /Shortcut placement is managed by your device/i);
  assert.doesNotMatch(js, /shortcut.*detected|icon.*detected/i);
});

test('uninstall guidance is platform-aware and user-controlled', async () => {
  const js = await read('install.js');

  assert.match(js, /Uninstall myHRFH/i);
  assert.match(js, /chrome:\/\/apps/i);
  assert.match(js, /edge:\/\/apps/i);
  assert.match(js, /Delete Bookmark|Remove App/i);
  assert.match(js, /your device controls removal/i);
});

test('public installer includes privacy and indexing safeguards', async () => {
  const html = await read('index.html');
  const guidanceJs = await read('ios-guidance-v2.js');

  assert.match(html, /name=["']referrer["'][^>]+content=["']no-referrer["']/i);
  assert.match(html, /name=["']robots["'][^>]+content=["']noindex,\s*nofollow["']/i);
  assert.match(html, /aria-describedby=["']management-copy["']/i);
  assert.match(guidanceJs, /sessionStorage/i);
  assert.doesNotMatch(guidanceJs, /localStorage[^\n]*calibration/i);
});

test('service worker uses production navigation freshness and the v3 release cache identity', async () => {
  const worker = await read('service-worker.js');

  assert.match(worker, /const CACHE_NAME = ['"]myhrfh-installer-v3['"]/);
  assert.match(worker, /ios-guided-overlay-v1/i);
  assert.match(worker, /ios-guidance-v3/i);
  assert.match(worker, /ios-calibrated-coachmark-v1/i);
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
  assert.match(readiness, /coachmark|visual guidance|guided overlay/i);
  assert.match(readiness, /calibrat/i);
  assert.match(readiness, /current browser|stay in/i);
  assert.match(readiness, /management actions/i);
  assert.match(readiness, /uninstall/i);
  assert.match(readiness, /Content-Security-Policy/i);
  assert.match(readiness, /Strict-Transport-Security/i);
  assert.match(readiness, /browser/i);
  assert.match(security, /no credentials/i);
  assert.match(security, /no analytics/i);
  assert.match(security, /report/i);
});
