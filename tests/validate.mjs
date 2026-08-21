import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');
const readBuffer = (path) => readFile(fileUrl(path));
async function readManifest() { return JSON.parse(await read('manifest.webmanifest')); }
function pngMetadata(buffer) {
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  const colorType = buffer[25];
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), colorType, hasTransparency: colorType === 6 || buffer.includes(Buffer.from('tRNS')) };
}

test('manifest defines a same-origin standalone myHRFH app with a dedicated launch shell', async () => {
  const manifest = await readManifest();
  assert.equal(manifest.name, 'myHRFH');
  assert.equal(manifest.short_name, 'myHRFH');
  assert.equal(manifest.id, './');
  assert.equal(manifest.start_url, './launch.html');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.prefer_related_applications, false);
  assert.ok((manifest.related_applications ?? []).some((app) => app.platform === 'webapp'));
});

test('manifest uses the accepted local any-purpose HRFH PNG icon contract', async () => {
  const manifest = await readManifest();
  const icons = manifest.icons ?? [];
  assert.equal(icons.length, 2);
  assert.ok(icons.every((icon) => icon.src.startsWith('./icons/') && icon.type === 'image/png'));
  assert.ok(icons.every((icon) => icon.purpose === 'any'));
  assert.deepEqual(icons.map((icon) => icon.sizes).sort(), ['192x192', '512x512']);
});

test('standard install assets are transparent branded PNGs', async () => {
  for (const [path, expectedSize, minimumBytes] of [['icons/icon-192.png', 192, 3000], ['icons/icon-512.png', 512, 9000]]) {
    const buffer = await readBuffer(path);
    const metadata = pngMetadata(buffer);
    assert.deepEqual({ width: metadata.width, height: metadata.height }, { width: expectedSize, height: expectedSize });
    assert.equal(metadata.hasTransparency, true);
    assert.ok(buffer.length > minimumBytes);
  }
});

test('launch shell redirects before installer UI can paint', async () => {
  const launch = await read('launch.html');
  const head = launch.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  assert.match(head, /window\.location\.replace\(['"]https:\/\/myhrfh\.com['"]\)/i);
  assert.doesNotMatch(launch, /install-card|platform-content|install-button/i);
});

test('installer page redirects standalone legacy launches in head before paint', async () => {
  const html = await read('index.html');
  const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  assert.match(head, /display-mode:\s*standalone/i);
  assert.match(head, /window\.location\.replace\(['"]https:\/\/myhrfh\.com['"]\)/i);
});

test('page uses concise sentence-case HRFH web app language', async () => {
  const html = await read('index.html');
  assert.match(html, /rel=["']manifest["'][^>]+href=["']\.\/manifest\.webmanifest["']/i);
  assert.match(html, /HR for Health/i);
  assert.match(html, /Add the HRFH web app/i);
  assert.match(html, /Open myHRFH/i);
});

test('styles preserve HRFH palette with subtle depth and gloss without forced uppercase', async () => {
  const css = await read('styles.css');
  assert.match(css, /--brand-purple:\s*#4a0d7f/i);
  assert.match(css, /--brand-orange:\s*#f6a13d/i);
  assert.match(css, /\.install-card::after/);
  assert.match(css, /backdrop-filter:\s*blur\(/i);
  assert.doesNotMatch(css, /text-transform:\s*uppercase/i);
});

test('install controller detects iOS, Android, Windows, macOS, and desktop Safari', async () => {
  const js = await read('install.js');
  for (const name of ['isIOS', 'isIOSChrome', 'isAndroid', 'isWindows', 'isMacOS', 'isDesktopSafari']) {
    assert.match(js, new RegExp(`function ${name}\\(\\)`));
  }
  assert.match(js, /navigator\.userAgentData/);
});

test('install controller remains capability-first for browser installs only', async () => {
  const js = await read('install.js');
  assert.match(js, /beforeinstallprompt/);
  assert.match(js, /INSTALL_PROMPT_WAIT_MS\s*=\s*1200/);
  assert.match(js, /waitForInstallPrompt\(\)/);
  assert.match(js, /renderInstallReady\(\)/);
  assert.match(js, /appinstalled/);
  assert.match(js, /getInstalledRelatedApps/);
  assert.match(js, /\.\/service-worker\.js/);
  assert.doesNotMatch(js, /HRFHAndroidNative|nativeHasCapability/);
});

test('iPhone and iPad use direct final guidance without toolbar questions', async () => {
  const guidance = await read('ios-guidance-v2.js');
  assert.match(guidance, /ios-final-guidance-v2/i);
  assert.match(guidance, /Add to Home Screen/i);
  assert.doesNotMatch(guidance, /CALIBRATION_SESSION_KEY|sessionStorage|buildCalibration|needsCalibration/i);
});

test('pre-Marketing desktop fallbacks distinguish Mac Safari and general desktop browsers without a dead custom Install button', async () => {
  const js = await read('install.js');
  const fallback = js.match(/function renderDesktopFallback\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(fallback, /installButton\.hidden\s*=\s*true/i);
  assert.match(fallback, /Add to Dock/i);
  assert.match(fallback, /Install app|install icon/i);
  assert.doesNotMatch(fallback, /installButton\.textContent/i);
});

test('legacy installed entry records the install receipt before forwarding to myHRFH', async () => {
  const js = await read('install.js');
  assert.match(js, /if\s*\(isStandalone\(\)\)\s*\{\s*writeInstallReceipt\(\);\s*window\.location\.replace\(MYHRFH_URL\);\s*return;\s*\}/s);
});

test('manifest does not attempt a cross-origin myHRFH start_url or scope', async () => {
  const manifest = await readManifest();
  assert.doesNotMatch(manifest.start_url, /myhrfh\.com/i);
  assert.doesNotMatch(manifest.scope, /myhrfh\.com/i);
});

test('service worker never proxies or caches myHRFH and enforces same origin', async () => {
  const worker = await read('service-worker.js');
  assert.doesNotMatch(worker, /myhrfh\.com/i);
  assert.match(worker, /url\.origin\s*!==\s*self\.location\.origin/);
});

test('service worker uses the v10 pre-Marketing PWA-only recovery identity', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /const CACHE_NAME = ['"]myhrfh-installer-v10['"]/);
  assert.match(worker, /const BUILD_REVISION = ['"]pre-marketing-install-behavior-v1['"]/);
  assert.match(worker, /const ANDROID_INSTALL_REVISION = ['"]android-pwa-recovery-v2['"]/);
  assert.match(worker, /const HRFH_ICON_REVISION = ['"]hrfh-transparent-icon-v1['"]/);
  assert.match(worker, /const IOS_FINAL_GUIDANCE_REVISION = ['"]ios-final-guidance-v2['"]/);
  assert.doesNotMatch(worker, /ANDROID_NATIVE_MANAGEMENT_REVISION|android-native-bridge/);
});
