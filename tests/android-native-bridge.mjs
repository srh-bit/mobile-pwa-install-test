import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');
const readOptional = async (path) => {
  try {
    return await read(path);
  } catch {
    return '';
  }
};

test('web native bridge is fixed-origin, capability-limited, and storage-independent', async () => {
  const bridge = await readOptional('android-native-bridge.js');

  assert.match(bridge, /TRUSTED_ORIGIN\s*=\s*['"]https:\/\/myhrfh\.com['"]/);
  assert.match(bridge, /restore-shortcut/);
  assert.match(bridge, /uninstall/);
  assert.match(bridge, /hrfh-native/);
  assert.match(bridge, /hrfh-management-result/);
  assert.match(bridge, /event\.origin\s*!==\s*TRUSTED_ORIGIN/);
  assert.match(bridge, /event\.ports\[0\]/);
  assert.match(bridge, /hrfh-android-native-ready/);
  assert.match(bridge, /port\.postMessage/);
  assert.doesNotMatch(bridge, /localStorage|sessionStorage|location\.search|navigator\.userAgent/i);
  assert.doesNotMatch(bridge, /eval\s*\(|Function\s*\(|intent|shell|packageName/i);
});

test('installer enables Android management only from validated native capabilities', async () => {
  const js = await read('install.js');
  const availability = js.match(/function getInstalledManagementAvailability\([^)]*\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

  assert.match(js, /window\.HRFHAndroidNative/);
  assert.match(js, /hrfh-android-native-ready/);
  assert.match(availability, /isAndroid\(\)/);
  assert.match(availability, /nativeHasCapability\(['"]restore-shortcut['"]\)/);
  assert.match(availability, /nativeHasCapability\(['"]uninstall['"]\)/);
  assert.match(js, /\.request\(['"]restore-shortcut['"]\)/);
  assert.match(js, /\.request\(['"]uninstall['"]\)/);
});

test('native bridge loads before install controller and is cached in v7 release', async () => {
  const html = await read('index.html');
  const worker = await read('service-worker.js');
  const bridgeIndex = html.indexOf('./android-native-bridge.js');
  const installIndex = html.indexOf('./install.js');

  assert.ok(bridgeIndex >= 0 && installIndex >= 0 && bridgeIndex < installIndex);
  assert.match(worker, /myhrfh-installer-v7/);
  assert.match(worker, /android-native-management-v1/);
  assert.match(worker, /\.\/android-native-bridge\.js/);
});
