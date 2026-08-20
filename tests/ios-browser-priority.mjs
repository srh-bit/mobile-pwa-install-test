import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

test('iOS install flow prioritizes Google Chrome with Safari fallback', async () => {
  const html = await read('index.html');
  const js = await read('install.js');

  assert.match(html, /id=["']ios-open-chrome["']/i);
  assert.match(html, /id=["']ios-use-safari["']/i);

  assert.match(js, /function isIOSChrome\(\)/);
  assert.match(js, /function buildChromeURL\(\)/);
  assert.match(js, /googlechromes:/i);
  assert.match(js, /function attemptChromeHandoff\(\)/);
  assert.match(js, /function renderIOSChromeInstructions\(\)/);
  assert.match(js, /function renderIOSSafariInstructions\(\)/);
  assert.match(js, /if\s*\(isIOSChrome\(\)\)[\s\S]*renderIOSChromeInstructions\(\)/);
  assert.match(js, /setTimeout\([\s\S]*renderIOSSafariInstructions\(\)/);
});

test('Chrome and Safari iOS paths both use Add to Home Screen from Share', async () => {
  const js = await read('install.js');

  assert.match(js, /Google Chrome is preferred/i);
  assert.match(js, /Chrome Share/i);
  assert.match(js, /Safari Share/i);
  assert.match(js, /Add to Home Screen/i);
  assert.doesNotMatch(js, /navigator\.share\s*\(/, 'Web Share must not be treated as the install action');
});
