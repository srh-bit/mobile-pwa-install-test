import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');

test('iOS installer keeps the automatic branded modal while final guidance owns the install steps', async () => {
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
  assert.doesNotMatch(coreJs, /navigator\.share\s*\(/);
  assert.match(guidanceJs, /function renderCurrentBrowserFlow\(/);
  assert.match(guidanceJs, /ios-final-guidance-v2/i);
  assert.match(css, /\.ios-install-modal/);
  assert.match(css, /position:\s*fixed/i);
});

test('v11 staging cache refreshes the shell while preserving final iOS guidance', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /const IOS_MODAL_REVISION = ['"]ios-install-modal-v1['"]/);
  assert.match(worker, /const IOS_BROWSER_REVISION = ['"]ios-current-browser-v1['"]/);
  assert.match(worker, /const IOS_FINAL_GUIDANCE_REVISION = ['"]ios-final-guidance-v2['"]/);
  assert.match(worker, /const CACHE_NAME = ['"]myhrfh-installer-v11['"]/);
  assert.match(worker, /const HRFH_ICON_REVISION = ['"]hrfh-transparent-icon-v1['"]/);
  assert.match(worker, /\.\/ios-modal\.css/);
  assert.match(worker, /\.\/ios-guidance-v3\.css/);
});
