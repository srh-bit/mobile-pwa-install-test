import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

test('iOS guidance uses the final direct assistant and accurate action symbols', async () => {
  const html = await read('index.html');
  const js = await read('ios-guidance-v2.js');
  const css = await read('ios-guidance-v3.css');
  assert.match(html, /ios-guidance-v3\.css/i);
  assert.match(html, /ios-guidance-v2\.js/i);
  assert.match(js, /ios-final-guidance-v2/i);
  assert.match(js, /function guidanceProfile\(/);
  assert.match(js, /chrome-phone-portrait/i);
  assert.match(js, /safari-phone/i);
  assert.match(js, /safari-ipad/i);
  assert.match(js, /chrome-landscape/i);
  assert.match(js, /function shareSymbol\(/i);
  assert.match(js, /function moreSymbol\(/i);
  assert.match(js, /function addHomeSymbol\(/i);
  assert.doesNotMatch(js, /navigator\.share\s*\(/i);
  assert.match(css, /\.ios-share-symbol/);
  assert.match(css, /\.ios-more-symbol/);
  assert.match(css, /\.ios-add-home-symbol/);
  assert.match(css, /\.ios-final-edge-guide/);
  assert.match(css, /prefers-reduced-motion/i);
});

test('Safari guidance covers direct Share, circled More fallback, and current web-app steps without asking questions', async () => {
  const js = await read('ios-guidance-v2.js');
  assert.match(js, /More[^\n]*Share|More.*Share/is);
  assert.match(js, /<circle\s+cx="12"\s+cy="12"\s+r="10"\s+fill="none"/i);
  assert.match(js, /Open as Web App/i);
  assert.match(js, /Edit Actions/i);
  assert.match(js, /Add to Home Screen/i);
  assert.match(js, /details/i);
  assert.doesNotMatch(js, /What do you see|data-calibration-value|sessionStorage/i);
});

test('Chrome portrait remains conservative when address bar placement is unknowable', async () => {
  const js = await read('ios-guidance-v2.js');
  assert.match(js, /chrome-phone-portrait[\s\S]*edge:\s*null/i);
  assert.match(js, /address bar at the top or bottom/i);
  assert.doesNotMatch(js, /chrome-address-top|chrome-address-bottom/i);
});

test('iOS final guidance rerenders safely on orientation and viewport changes', async () => {
  const js = await read('ios-guidance-v2.js');
  assert.match(js, /orientationchange/i);
  assert.match(js, /visualViewport\?\.addEventListener\(['"]resize['"]/i);
  assert.match(js, /requestAnimationFrame/i);
});

test('v12 staging cache includes final iOS guidance assets unchanged', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /ios-guidance-v2\.js/i);
  assert.match(worker, /ios-guidance-v3\.css/i);
  assert.match(worker, /ios-final-guidance-v2/i);
  assert.match(worker, /myhrfh-installer-v12/i);
  assert.match(worker, /hrfh-transparent-icon-v1/i);
});
