import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

test('iOS installer keeps the automatic branded modal while v3 owns browser guidance', async () => {
  const html = await read('index.html');
  const coreJs = await read('install.js');
  const guidanceJs = await read('ios-guidance-v2.js');
  const css = await read('ios-modal.css');

  assert.match(html, /href=["']\.\/ios-modal\.css["']/i);
  assert.match(html, /id=["']ios-install-modal["']/i);
  assert.match(html, /role=["']dialog["']/i);
  assert.match(html, /aria-modal=["']true["']/i);
  assert.match(html, /Tap Share, then Add to Home Screen\./i);
  assert.match(html, /id=["']ios-modal-dismiss["']/i);

  assert.match(coreJs, /function showIOSInstallModal\(/);
  assert.match(coreJs, /iosInstallModal\.hidden\s*=\s*false/);
  assert.doesNotMatch(coreJs, /navigator\.share\s*\(/, 'Web Share must not be presented as an Add to Home Screen shortcut');

  assert.match(guidanceJs, /function renderCurrentBrowserFlow\(/);
  assert.match(guidanceJs, /Stay in \$\{browser\}; no browser switch is required/i);
  assert.match(guidanceJs, /browserActions\.hidden\s*=\s*true/);
  assert.doesNotMatch(guidanceJs, /googlechromes?:/i);

  assert.match(css, /\.ios-install-modal/);
  assert.match(css, /position:\s*fixed/i);
  assert.match(css, /backdrop-filter:\s*blur\(/i);
  assert.match(css, /\.ios-share-cue/);
});

test('service worker refreshes the cached shell for the current-browser iOS flow', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /const IOS_MODAL_REVISION = ['"]ios-install-modal-v1['"]/);
  assert.match(worker, /const IOS_BROWSER_REVISION = ['"]ios-current-browser-v1['"]/);
  assert.match(worker, /const IOS_GUIDANCE_REVISION = ['"]ios-guidance-v3['"]/);
  assert.match(worker, /\.\/ios-modal\.css/);
  assert.match(worker, /\.\/ios-guidance-v3\.css/);
});
