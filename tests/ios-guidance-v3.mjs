import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

test('iOS stays in the current browser instead of forcing a Chrome handoff', async () => {
  const js = await read('ios-guidance-v2.js');

  assert.match(js, /function renderCurrentBrowserFlow\(/i);
  assert.match(js, /isIOSChrome\(\)[\s\S]*Chrome/i);
  assert.match(js, /isIOSSafari\(\)[\s\S]*Safari/i);
  assert.match(js, /current browser|this browser/i);
  assert.doesNotMatch(js, /googlechromes?:/i);
});

test('ambiguous iPhone layouts use one-tap calibration instead of guessed coordinates', async () => {
  const js = await read('ios-guidance-v2.js');

  assert.match(js, /GUIDANCE_REVISION\s*=\s*['"]ios-guidance-v3['"]/i);
  assert.match(js, /CALIBRATION_SESSION_KEY/i);
  assert.match(js, /sessionStorage/i);
  assert.match(js, /function needsCalibration\(/i);
  assert.match(js, /function buildCalibration\(/i);
  assert.match(js, /data-calibration-value/i);
  assert.match(js, /chrome-phone-portrait/i);
  assert.match(js, /address bar/i);
  assert.match(js, /Top/i);
  assert.match(js, /Bottom/i);
  assert.match(js, /safari-phone/i);
  assert.match(js, /Share/i);
  assert.match(js, /More/i);
});

test('calibration creates a precise coachmark only after the user supplies the missing setting', async () => {
  const js = await read('ios-guidance-v2.js');

  assert.match(js, /chrome-address-top|chrome-address-bottom/i);
  assert.match(js, /safari-control-share|safari-control-more/i);
  assert.match(js, /confidence:\s*['"]exact['"]/i);
  assert.match(js, /confidence:\s*['"]region['"]/i);
  assert.match(js, /ios-v3-coachmark/i);
  assert.doesNotMatch(js, /navigator\.share\s*\(/i);
});

test('iOS calibration remains private, disposable, and reconfigurable', async () => {
  const js = await read('ios-guidance-v2.js');

  assert.match(js, /sessionStorage\.getItem|sessionStorage\.setItem/i);
  assert.match(js, /Change|change/i);
  assert.match(js, /clearCalibration|removeItem/i);
  assert.doesNotMatch(js, /localStorage[^\n]*ios.*calibration/i);
});

test('v3 coachmark styling supports safe areas, calibration controls, and reduced motion', async () => {
  const css = await read('ios-guidance-v3.css');

  assert.match(css, /ios-v3-calibration/i);
  assert.match(css, /ios-v3-coachmark/i);
  assert.match(css, /env\(safe-area-inset-(top|bottom|left|right)\)/i);
  assert.match(css, /prefers-reduced-motion/i);
});

test('production contract documents current-browser-first and calibrated iOS guidance', async () => {
  const docs = await read('docs/PRODUCTION-READINESS.md');

  assert.match(docs, /stay in|current browser/i);
  assert.match(docs, /calibrat/i);
  assert.match(docs, /Chrome[^\n]*address bar[^\n]*(top|bottom)|(top|bottom)[^\n]*Chrome[^\n]*address bar/i);
  assert.match(docs, /Safari[^\n]*(Share|More)/i);
  assert.match(docs, /session/i);
});
