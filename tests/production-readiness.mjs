import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

test('installed state exposes open, shortcut restore, and uninstall management actions', async () => {
  const html = await read('index.html');
  const js = await read('install.js');

  assert.match(html, /id=["']restore-shortcut-button["']/i);
  assert.match(html, /id=["']uninstall-button["']/i);
  assert.match(html, /id=["']management-dialog["']/i);
  assert.match(html, /id=["']management-title["']/i);
  assert.match(html, /id=["']management-steps["']/i);

  assert.match(js, /function setInstalledState\(/);
  assert.match(js, /restoreShortcutButton\.hidden\s*=\s*false/);
  assert.match(js, /uninstallButton\.hidden\s*=\s*false/);
  assert.match(js, /HRFH web app is installed\./i);
  assert.match(js, /function showShortcutHelp\(\)/);
  assert.match(js, /function showUninstallHelp\(\)/);
  assert.doesNotMatch(js, /navigator\.[A-Za-z]*uninstall\s*\(/i, 'public web pages must not pretend they can uninstall a PWA');
});

test('installation probing distinguishes installed, not-installed, and unknown instead of guessing', async () => {
  const js = await read('install.js');

  assert.match(js, /async function getInstallationState\(\)/);
  assert.match(js, /return ['"]installed['"]/);
  assert.match(js, /return ['"]not-installed['"]/);
  assert.match(js, /return ['"]unknown['"]/);
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

  assert.match(worker, /const CACHE_NAME = ['"]myhrfh-installer-v1['"]/);
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
  assert.match(readiness, /uninstall/i);
  assert.match(readiness, /Content-Security-Policy/i);
  assert.match(readiness, /Strict-Transport-Security/i);
  assert.match(readiness, /browser/i);
  assert.match(security, /no credentials/i);
  assert.match(security, /no analytics/i);
  assert.match(security, /report/i);
});
