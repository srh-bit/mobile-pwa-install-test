import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

test('iOS installer uses an automatic branded modal instead of inline setup steps', async () => {
  const html = await read('index.html');
  const js = await read('install.js');
  const css = await read('ios-modal.css');

  assert.match(html, /href=["']\.\/ios-modal\.css["']/i);
  assert.match(html, /id=["']ios-install-modal["']/i);
  assert.match(html, /role=["']dialog["']/i);
  assert.match(html, /aria-modal=["']true["']/i);
  assert.match(html, /Tap Share, then Add to Home Screen\./i);
  assert.match(html, /id=["']ios-modal-dismiss["']/i);

  assert.match(js, /function showIOSInstallModal\(\)/);
  assert.match(js, /iosInstallModal\.hidden\s*=\s*false/);
  assert.match(js, /if\s*\(isIOSSafari\(\)\)[\s\S]*showIOSInstallModal\(\)/);
  assert.doesNotMatch(js, /navigator\.share\s*\(/, 'Web Share must not be presented as an Add to Home Screen shortcut');

  assert.match(css, /\.ios-install-modal/);
  assert.match(css, /position:\s*fixed/i);
  assert.match(css, /backdrop-filter:\s*blur\(/i);
  assert.match(css, /\.ios-share-cue/);
});

test('service worker refreshes the cached shell for the iOS modal build', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /const IOS_MODAL_REVISION = ['"]ios-install-modal-v1['"]/);
  assert.match(worker, /\.\/ios-modal\.css/);
});
