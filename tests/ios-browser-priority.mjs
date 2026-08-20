import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

test('iOS install flow stays in the current browser and hides legacy handoff controls', async () => {
  const html = await read('index.html');
  const guidance = await read('ios-guidance-v2.js');

  assert.match(html, /id=["']ios-open-chrome["']/i);
  assert.match(html, /id=["']ios-use-safari["']/i);

  assert.match(guidance, /function isIOSChrome\(\)/);
  assert.match(guidance, /function isIOSSafari\(\)/);
  assert.match(guidance, /function renderCurrentBrowserFlow\(\)/);
  assert.match(guidance, /Stay in \$\{browser\}; no browser switch is required/i);
  assert.match(guidance, /browserActions\.hidden\s*=\s*true/);
  assert.doesNotMatch(guidance, /googlechromes?:/i);
});

test('Chrome and Safari iOS paths both use the browser Share flow for Add to Home Screen', async () => {
  const guidance = await read('ios-guidance-v2.js');

  assert.match(guidance, /Chrome Share/i);
  assert.match(guidance, /Safari Share/i);
  assert.match(guidance, /Add to Home Screen/i);
  assert.match(guidance, /Open as Web App/i);
  assert.doesNotMatch(guidance, /navigator\.share\s*\(/, 'Web Share must not be treated as the install action');
});
