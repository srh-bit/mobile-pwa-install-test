import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

test('iOS final guidance is direct and contains no calibration interaction', async () => {
  const js = await read('ios-guidance-v2.js');

  assert.match(js, /GUIDANCE_REVISION\s*=\s*['"]ios-final-guidance-v1['"]/i);
  assert.match(js, /chrome-phone-portrait/i);
  assert.match(js, /safari-phone/i);
  assert.match(js, /Tap Share/i);
  assert.match(js, /More/i);
  assert.doesNotMatch(js, /CALIBRATION_SESSION_KEY|needsCalibration|buildCalibration|sessionStorage|data-calibration-value/i);
});

test('stable layouts may use an edge cue while ambiguous Chrome portrait does not claim an exact coordinate', async () => {
  const js = await read('ios-guidance-v2.js');

  assert.match(js, /safari-ipad[\s\S]*edge:\s*['"]top-right['"]/i);
  assert.match(js, /chrome-landscape[\s\S]*edge:\s*['"]top-right['"]/i);
  assert.match(js, /chrome-phone-portrait[\s\S]*edge:\s*null/i);
  assert.match(js, /ios-final-edge-guide/i);
});

test('final coachmark styling supports safe areas and reduced motion', async () => {
  const css = await read('ios-guidance-v3.css');

  assert.match(css, /ios-final-edge-guide/i);
  assert.match(css, /ios-symbol-shell/i);
  assert.match(css, /env\(safe-area-inset-(top|bottom|left|right)\)/i);
  assert.match(css, /prefers-reduced-motion/i);
  assert.doesNotMatch(css, /ios-v3-calibration-option/i);
});

test('production contract documents direct iOS guidance without a questioning process', async () => {
  const docs = await read('docs/PRODUCTION-READINESS.md');

  assert.match(docs, /Share/i);
  assert.match(docs, /More/i);
  assert.match(docs, /Add to Home Screen/i);
  assert.match(docs, /vector|symbol|icon/i);
  assert.doesNotMatch(docs, /What do you see|Where is your Chrome address bar|Change toolbar setting/i);
  assert.doesNotMatch(docs, /sessionStorage[^\n]*calibrat|calibration choice/i);
});