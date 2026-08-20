import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');
const exists = async (path) => {
  try {
    await access(fileUrl(path));
    return true;
  } catch {
    return false;
  }
};

test('release architecture is browser-PWA only with no native Android package or bridge', async () => {
  const html = await read('index.html');
  const workflow = await read('.github/workflows/validate.yml');
  assert.equal(await exists('android-native-bridge.js'), false);
  assert.equal(await exists('android/build.gradle'), false);
  assert.doesNotMatch(html, /android-native-bridge\.js/i);
  assert.doesNotMatch(workflow, /gradle\s+-p\s+android|Install Android SDK|Build and lint managed Android package/i);
});

test('Android no longer exposes an uninstall action', async () => {
  const html = await read('index.html');
  const js = await read('install.js');
  assert.doesNotMatch(html, /id=["']uninstall-button["']/i);
  assert.doesNotMatch(js, /requestAndroidUninstall|showUninstallHelp|nativeHasCapability|HRFHAndroidNative/);
});

test('confirmed Android PWA keeps installed UI to Open and Reinstall without Restore', async () => {
  const js = await read('install.js');
  const availability = js.match(/function getInstalledManagementAvailability\([^)]*\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  const installedState = js.match(/function setInstalledState\([^)]*\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(availability, /isAndroid\(\)[^\n]*restore:\s*false/i);
  assert.doesNotMatch(installedState, /Restore Home Screen shortcut/i);
  assert.match(installedState, /Reinstall/i);
});

test('supported Android related-app probe treats an empty self-PWA result as not installed', async () => {
  const js = await read('install.js');
  const probe = js.match(/async function getInstallationState\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(probe, /getInstalledRelatedApps\(\)/);
  assert.match(probe, /isAndroid\(\)[\s\S]*clearInstallReceipt\(\)[\s\S]*return ['"]not-installed['"]/);
});

test('Android receipt is only fallback evidence when the browser cannot complete the related-app probe', async () => {
  const js = await read('install.js');
  const initial = js.match(/async function renderInitialState\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(initial, /installationState === ['"]not-installed['"]/);
  assert.match(initial, /installationState === ['"]unknown['"][\s\S]*readInstallReceipt\(\)/);
});

test('PWA-only release rotates cache and removes native bridge shell asset', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /const CACHE_NAME = ['"]myhrfh-installer-v8['"]/);
  assert.match(worker, /ANDROID_INSTALL_REVISION\s*=\s*['"]android-pwa-recovery-v2['"]/);
  assert.doesNotMatch(worker, /ANDROID_NATIVE_MANAGEMENT_REVISION|android-native-bridge\.js/);
});

test('production contract documents app-installed detection versus launcher-icon visibility', async () => {
  const readme = await read('README.md');
  const readiness = await read('docs/PRODUCTION-READINESS.md');
  const security = await read('SECURITY.md');
  const combined = `${readme}\n${readiness}\n${security}`;
  assert.match(combined, /PWA-only|browser-only/i);
  assert.match(combined, /getInstalledRelatedApps/i);
  assert.match(combined, /cannot[^\n]*(?:inspect|detect|verify)[^\n]*(?:Home Screen|launcher)[^\n]*(?:icon|shortcut)/i);
  assert.doesNotMatch(readiness, /Managed Android TWA|Native command contract|Digital Asset Links release boundary/i);
});