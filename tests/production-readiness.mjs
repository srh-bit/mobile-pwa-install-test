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

test('iOS guidance uses an automatic visual toolbar-edge walkthrough', async () => {
  const html = await read('index.html');
  const js = await read('install.js');
  const css = await read('ios-modal.css');

  assert.match(html, /id=["']ios-toolbar-guide["']/i);
  assert.match(html, /id=["']ios-guide-spotlight["']/i);
  assert.match(html, /id=["']ios-guide-arrow["']/i);
  assert.match(html, /id=["']ios-guide-step-one["']/i);
  assert.match(html, /id=["']ios-guide-step-two["']/i);
  assert.match(html, />Tap Share</i);
  assert.match(html, />Add to Home Screen</i);

  assert.match(js, /function configureIOSGuidance\(/);
  assert.match(js, /function isIPad\(\)/);
  assert.match(js, /orientation:\s*landscape/i);
  assert.match(js, /ios-guide-chrome/);
  assert.match(js, /ios-guide-safari/);
  assert.match(js, /ios-guide-top|ios-guide-bottom/);
  assert.match(js, /showIOSInstallModal/);

  assert.match(css, /\.ios-toolbar-guide/);
  assert.match(css, /\.ios-guide-spotlight/);
  assert.match(css, /\.ios-guide-arrow/);
  assert.match(css, /backdrop-filter:\s*blur/i);
  assert.match(css, /@keyframes\s+ios-guide-pulse/i);
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

  assert.match(html, /name=["']referrer["'][^>]+content=["']no-referrer["']/i);
  assert.match(html, /name=["']robots["'][^>]+content=["']noindex,\s*nofollow["']/i);
  assert.match(html, /aria-describedby=["']management-copy["']/i);
});

test('service worker uses production navigation freshness and a release cache identity', async () => {
  const worker = await read('service-worker.js');

  assert.match(worker, /const CACHE_NAME = ['"]myhrfh-installer-v2['"]/);
  assert.match(worker, /ios-guided-overlay-v1/i);
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
  assert.match(readiness, /home.?screen icon/i);
  assert.match(readiness, /visual guidance|guided overlay/i);
  assert.match(readiness, /management actions/i);
  assert.match(readiness, /uninstall/i);
  assert.match(readiness, /Content-Security-Policy/i);
  assert.match(readiness, /Strict-Transport-Security/i);
  assert.match(readiness, /browser/i);
  assert.match(security, /no credentials/i);
  assert.match(security, /no analytics/i);
  assert.match(security, /report/i);
});
