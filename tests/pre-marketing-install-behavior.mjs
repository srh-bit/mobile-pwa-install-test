import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const functionBody = (source, signature) => source.match(new RegExp(`${signature}\\s*\\{([\\s\\S]*?)\\n\\}`, 'i'))?.[1] ?? '';

test('Android and desktop restore the exact pre-Marketing native-prompt timing contract', async () => {
  const js = await read('install.js');
  assert.match(js, /const INSTALL_PROMPT_WAIT_MS\s*=\s*1200;/);

  const wait = functionBody(js, 'async function waitForInstallPrompt\\(\\)');
  assert.match(wait, /if\s*\(deferredInstallPrompt\)\s*return true/);
  assert.match(wait, /window\.setTimeout\(resolve,\s*INSTALL_PROMPT_WAIT_MS\)/);
  assert.match(wait, /return Boolean\(deferredInstallPrompt\)/);

  const initial = functionBody(js, 'async function renderInitialState\\(\\)');
  assert.match(initial, /deferredInstallPrompt\s*\|\|\s*await waitForInstallPrompt\(\)/);
  assert.match(initial, /renderInstallReady\(\)/);
  assert.match(initial, /renderFallback\(\)/);
});

test('pre-Marketing fallbacks do not expose a dead Install button', async () => {
  const js = await read('install.js');
  const android = functionBody(js, 'function renderAndroidFallback\\(\\)');
  const desktop = functionBody(js, 'function renderDesktopFallback\\(\\)');

  assert.match(android, /installButton\.hidden\s*=\s*true/);
  assert.match(android, /browser menu[\s\S]*Install app/i);
  assert.doesNotMatch(android, /installButton\.textContent/);

  assert.match(desktop, /installButton\.hidden\s*=\s*true/);
  assert.match(desktop, /Install app|Add to Dock|install icon/i);
  assert.doesNotMatch(desktop, /installButton\.textContent/);
});

test('pre-Marketing beforeinstallprompt exposes Install only for a live browser prompt', async () => {
  const js = await read('install.js');
  const handler = js.match(/window\.addEventListener\(['"]beforeinstallprompt['"],\s*\(event\)\s*=>\s*\{([\s\S]*?)\n\}\);/)?.[1] ?? '';

  assert.match(handler, /deferredInstallPrompt\s*=\s*event/);
  assert.match(handler, /installedStateDetected\s*\|\|\s*readInstallReceipt\(\)/);
  assert.match(handler, /installButton\.hidden\s*=\s*true/);
  assert.match(handler, /renderInstallReady\(\)/);
  assert.doesNotMatch(handler, /clearInstallReceipt\(\)/);
});

test('pre-Marketing click lifecycle never leaves a nonfunctional Install action visible', async () => {
  const js = await read('install.js');
  const click = js.match(/installButton\.addEventListener\(['"]click['"],\s*async\s*\(\)\s*=>\s*\{([\s\S]*?)\n\}\);/)?.[1] ?? '';

  assert.match(click, /if\s*\(!deferredInstallPrompt\)[\s\S]*renderFallback\(\)[\s\S]*return/);
  assert.match(click, /choice\.outcome\s*===\s*['"]accepted['"]/);
  assert.match(click, /finally\s*\{[\s\S]*deferredInstallPrompt\s*=\s*null[\s\S]*installButton\.disabled\s*=\s*false[\s\S]*installButton\.hidden\s*=\s*true/);
  assert.doesNotMatch(click, /Installation cancelled\. You can try again\./);
});

test('approved iOS install interaction remains frozen while Android and desktop revert', async () => {
  const js = await read('install.js');
  const ios = functionBody(js, 'function renderIOSInstructions\\(\\)');
  assert.match(ios, /installButton\.hidden\s*=\s*false/);
  assert.match(ios, /Show install steps/);
  assert.match(ios, /Tap Share, then Add to Home Screen/);
  assert.match(ios, /showIOSInstallModal\(\)/);
});
