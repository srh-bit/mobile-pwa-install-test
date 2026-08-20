import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

test('iOS v2 guidance is confidence-aware instead of pretending browser chrome is inspectable', async () => {
  const html = await read('index.html');
  const js = await read('ios-guidance-v2.js');
  const css = await read('ios-guidance-v2.css');

  assert.match(html, /ios-guidance-v2\.css/i);
  assert.match(html, /ios-guidance-v2\.js/i);
  assert.match(js, /ios-guidance-v2/i);
  assert.match(js, /function guidanceProfile\(/);
  assert.match(js, /chrome-phone-portrait/i);
  assert.match(js, /safari-phone/i);
  assert.match(js, /safari-ipad/i);
  assert.match(js, /chrome-landscape/i);
  assert.match(js, /confidence:\s*['"]exact['"]/i);
  assert.match(js, /confidence:\s*['"]region['"]/i);
  assert.doesNotMatch(js, /navigator\.share\s*\(/i, 'install guidance must not open the generic Web Share sheet');

  assert.match(css, /\.ios-v2-edge-guide/);
  assert.match(css, /\.ios-v2-toolbar-preview/);
  assert.match(css, /\.ios-v2-safari-phone/);
  assert.match(css, /\.ios-v2-exact-top-right/);
  assert.match(css, /prefers-reduced-motion/i);
});

test('Safari guidance covers current Apple share-layout and web-app steps without extra default clutter', async () => {
  const js = await read('ios-guidance-v2.js');

  assert.match(js, /More[^\n]*Share|More.*→.*Share/is);
  assert.match(js, /Open as Web App/i);
  assert.match(js, /Edit Actions/i);
  assert.match(js, /Add to Home Screen/i);
  assert.match(js, /details/i);
});

test('Chrome portrait guidance does not claim an exact edge when the address bar setting is unknowable', async () => {
  const js = await read('ios-guidance-v2.js');

  assert.match(js, /chrome-phone-portrait[\s\S]*confidence:\s*['"]region['"]/i);
  assert.match(js, /right of your address bar|beside your address bar/i);
});

test('release cache includes the v2 iOS guidance assets', async () => {
  const worker = await read('service-worker.js');

  assert.match(worker, /ios-guidance-v2\.css/i);
  assert.match(worker, /ios-guidance-v2\.js/i);
  assert.match(worker, /ios-guidance-v2/i);
});
