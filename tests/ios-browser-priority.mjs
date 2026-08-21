import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

test('iOS final assistant uses the detected browser without presenting a browser-switch decision', async () => {
  const guidance = await read('ios-guidance-v2.js');
  const css = await read('ios-guidance-v3.css');

  assert.match(guidance, /function isIOSChrome\(\)/);
  assert.match(guidance, /function isIOSSafari\(\)/);
  assert.match(guidance, /function renderCurrentBrowserFlow\(\)/);
  assert.match(guidance, /browserActions\.hidden\s*=\s*true/);
  assert.match(css, /#ios-browser-actions[\s\S]*display:\s*none\s*!important/i);
  assert.doesNotMatch(guidance, /googlechromes?:/i);
  assert.doesNotMatch(guidance, /no browser switch is required/i);
});

test('Chrome and Safari iOS paths both use the browser Share flow for Add to Home Screen', async () => {
  const guidance = await read('ios-guidance-v2.js');

  assert.match(guidance, /browser:\s*['"]Chrome['"]/i);
  assert.match(guidance, /browser:\s*['"]Safari['"]/i);
  assert.match(guidance, /Tap Share/i);
  assert.match(guidance, /Add to Home Screen/i);
  assert.match(guidance, /Open as Web App/i);
  assert.doesNotMatch(guidance, /navigator\.share\s*\(/, 'Web Share must not be treated as the install action');
});