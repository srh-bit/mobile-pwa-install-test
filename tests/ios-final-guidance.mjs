import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

test('final iOS assistant has no calibration questions or browser-switch copy', async () => {
  const html = await read('index.html');
  const js = await read('ios-guidance-v2.js');
  const css = await read('ios-guidance-v3.css');
  const docs = await read('docs/PRODUCTION-READINESS.md');
  for (const source of [js, docs]) {
    assert.doesNotMatch(source, /What do you see/i);
    assert.doesNotMatch(source, /Where is your Chrome address bar/i);
    assert.doesNotMatch(source, /Change toolbar setting/i);
    assert.doesNotMatch(source, /Stay in .*Safari|Stay in .*browser|no browser switch is required/i);
  }
  assert.doesNotMatch(js, /CALIBRATION_SESSION_KEY|buildCalibration|needsCalibration|data-calibration-value/i);
  assert.match(js, /browserActions\.hidden\s*=\s*true/i);
  assert.match(css, /#ios-browser-actions[\s\S]*display:\s*none\s*!important/i);
  assert.doesNotMatch(html, />\s*↑\s*</);
  assert.doesNotMatch(html, /▢/);
});

test('final iOS guide uses vector iOS-style Share, circled More, and Add to Home Screen symbols only', async () => {
  const js = await read('ios-guidance-v2.js');
  assert.match(js, /function shareSymbol\(/i);
  assert.match(js, /function moreSymbol\(/i);
  assert.match(js, /function addHomeSymbol\(/i);
  assert.match(js, /<svg[\s\S]*viewBox=/i);
  assert.match(js, /ios-share-symbol/i);
  assert.match(js, /ios-more-symbol/i);
  assert.match(js, /ios-add-home-symbol/i);
  const moreStart = js.indexOf('function moreSymbol');
  const moreEnd = js.indexOf('function addHomeSymbol');
  const moreMarkup = js.slice(moreStart, moreEnd);
  assert.match(moreMarkup, /<circle\s+cx="12"\s+cy="12"\s+r="(?:9\.5|10|10\.5)"[^>]*fill="none"/i);
  assert.equal((moreMarkup.match(/fill="currentColor"/g) || []).length, 3);
  assert.doesNotMatch(js, />\s*↑\s*</);
  assert.doesNotMatch(js, /▢/);
  assert.doesNotMatch(js, />\s*‹\s*</);
});

test('iPhone guidance stays direct while covering Share and circled More without asking questions', async () => {
  const js = await read('ios-guidance-v2.js');
  assert.match(js, /Tap Share, or More if Share (?:isn't|isn’t) shown\./i);
  assert.match(js, /Then choose Share\./i);
  assert.match(js, /Add to Home Screen/i);
  assert.match(js, /Open as Web App/i);
  assert.doesNotMatch(js, /sessionStorage/i);
  assert.doesNotMatch(js, /navigator\.share\s*\(/i);
});

test('v12 staging cache preserves final iOS guidance assets unchanged', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /myhrfh-installer-v12/i);
  assert.match(worker, /ios-final-guidance-v2/i);
  assert.match(worker, /hrfh-transparent-icon-v1/i);
  assert.doesNotMatch(worker, /android-native-management/i);
});
