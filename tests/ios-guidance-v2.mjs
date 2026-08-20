import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

test('iOS guidance remains confidence-aware under the v3 calibrated assistant', async () => {
  const html = await read('index.html');
  const js = await read('ios-guidance-v2.js');
  const legacyCss = await read('ios-guidance-v2.css');
  const v3Css = await read('ios-guidance-v3.css');

  assert.match(html, /ios-guidance-v2\.css/i);
  assert.match(html, /ios-guidance-v3\.css/i);
  assert.match(html, /ios-guidance-v2\.js/i);
  assert.match(js, /ios-guidance-v3/i);
  assert.match(js, /function guidanceProfile\(/);
  assert.match(js, /chrome-phone-portrait/i);
  assert.match(js, /safari-phone/i);
  assert.match(js, /safari-ipad/i);
  assert.match(js, /chrome-landscape/i);
  assert.match(js, /confidence:\s*['"]exact['"]/i);
  assert.match(js, /confidence:\s*['"]region['"]/i);
  assert.doesNotMatch(js, /navigator\.share\s*\(/i, 'install guidance must not open the generic Web Share sheet');

  assert.match(legacyCss, /\.ios-v2-toolbar-preview/);
  assert.match(v3Css, /\.ios-v3-edge-guide/);
  assert.match(v3Css, /\.ios-v3-coachmark/);
  assert.match(v3Css, /prefers-reduced-motion/i);
});

test('Safari guidance covers current Apple share-layout and web-app steps without extra default clutter', async () => {
  const js = await read('ios-guidance-v2.js');

  assert.match(js, /More[^\n]*Share|More.*→.*Share/is);
  assert.match(js, /Open as Web App/i);
  assert.match(js, /Edit Actions/i);
  assert.match(js, /Add to Home Screen/i);
  assert.match(js, /details/i);
});

test('Chrome portrait starts conservative and becomes exact only after address-bar calibration', async () => {
  const js = await read('ios-guidance-v2.js');

  assert.match(js, /chrome-phone-portrait[\s\S]*confidence:\s*['"]region['"]/i);
  assert.match(js, /chrome-address-top[\s\S]*confidence:\s*['"]exact['"]/i);
  assert.match(js, /chrome-address-bottom[\s\S]*confidence:\s*['"]exact['"]/i);
  assert.match(js, /address bar/i);
});

test('iOS guidance observer is idempotent for an unchanged browser, calibration, and orientation state', async () => {
  const js = await read('ios-guidance-v2.js');

  assert.match(js, /let\s+lastSignature\s*=\s*['"][^'"]*['"]/i);
  assert.match(js, /signature\s*===\s*lastSignature/i);
  assert.match(js, /isEnhancementIntact\(profile,\s*calibrating\)/i);
  assert.match(js, /if\s*\(applying[^)]*\)\s*\{\s*return;/s);
});

test('release cache includes both legacy compatibility and v3 iOS guidance assets', async () => {
  const worker = await read('service-worker.js');

  assert.match(worker, /ios-guidance-v2\.css/i);
  assert.match(worker, /ios-guidance-v2\.js/i);
  assert.match(worker, /ios-guidance-v3\.css/i);
  assert.match(worker, /ios-guidance-v3/i);
});
