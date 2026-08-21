import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

function body(source, signature) {
  return source.match(new RegExp(`${signature}\\s*\\{([\\s\\S]*?)\\n\\}`, 'i'))?.[1] ?? '';
}

test('Android fallback keeps browser Install app guidance and hides the custom Install action without a live prompt', async () => {
  const js = await read('install.js');
  const fallback = body(js, 'function renderAndroidFallback\\(\\)');
  assert.match(fallback, /installButton\.hidden\s*=\s*true/i);
  assert.match(fallback, /Install app/i);
  assert.doesNotMatch(fallback, /installButton\.textContent/i);
});

test('desktop fallback keeps browser-native guidance and hides the custom Install action without a live prompt', async () => {
  const js = await read('install.js');
  const fallback = body(js, 'function renderDesktopFallback\\(\\)');
  assert.match(fallback, /installButton\.hidden\s*=\s*true/i);
  assert.match(fallback, /Add to Dock|Install app|install icon/i);
  assert.doesNotMatch(fallback, /installButton\.textContent/i);
});

test('beforeinstallprompt follows the pre-Marketing installed-evidence guard', async () => {
  const js = await read('install.js');
  const handler = js.match(/window\.addEventListener\(['"]beforeinstallprompt['"],\s*\(event\)\s*=>\s*\{([\s\S]*?)\n\}\);/)?.[1] ?? '';
  assert.match(handler, /deferredInstallPrompt\s*=\s*event/i);
  assert.match(handler, /installedStateDetected\s*\|\|\s*readInstallReceipt\(\)/i);
  assert.match(handler, /installButton\.hidden\s*=\s*true/i);
  assert.match(handler, /renderInstallReady\(\)/i);
  assert.doesNotMatch(handler, /clearInstallReceipt\(\)/i);
});

test('consumed or cancelled native prompt does not leave a dead custom Install button', async () => {
  const js = await read('install.js');
  const click = js.match(/installButton\.addEventListener\(['"]click['"],\s*async\s*\(\)\s*=>\s*\{([\s\S]*?)\n\}\);/)?.[1] ?? '';
  assert.match(click, /if\s*\(!deferredInstallPrompt\)[\s\S]*renderFallback\(\)[\s\S]*return/i);
  assert.match(click, /choice\.outcome\s*===\s*['"]accepted['"]/i);
  assert.match(click, /else\s*\{[\s\S]*Installation cancelled\./i);
  assert.match(click, /finally\s*\{[\s\S]*deferredInstallPrompt\s*=\s*null[\s\S]*installButton\.disabled\s*=\s*false[\s\S]*installButton\.hidden\s*=\s*true/i);
});

test('service worker registration retains the pre-Marketing window-load timing', async () => {
  const js = await read('install.js');
  const loadHandler = js.match(/window\.addEventListener\(['"]load['"],\s*\(\)\s*=>\s*\{([\s\S]*?)\n\}\);/)?.[1] ?? '';
  assert.match(loadHandler, /serviceWorker['"]?\s*in\s*navigator|['"]serviceWorker['"]\s*in\s*navigator/i);
  assert.match(loadHandler, /navigator\.serviceWorker\.register\(['"]\.\/service-worker\.js['"]\)/i);
  assert.doesNotMatch(js, /async function registerServiceWorker\(\)/i);
});

test('approved iOS install flow remains unchanged by Android and desktop revert', async () => {
  const js = await read('install.js');
  const ios = body(js, 'function renderIOSInstructions\\(\\)');
  assert.match(ios, /installButton\.textContent\s*=\s*['"]Show install steps['"]/i);
  assert.match(ios, /Tap Share, then Add to Home Screen/i);
  assert.match(ios, /showIOSInstallModal\(\)/i);
});
