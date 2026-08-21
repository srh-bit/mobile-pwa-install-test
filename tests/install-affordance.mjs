import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

function body(source, signature) {
  return source.match(new RegExp(`${signature}\\s*\\{([\\s\\S]*?)\\n\\}`, 'i'))?.[1] ?? '';
}

test('Android fallback keeps a discoverable Install action while the native prompt is pending or unavailable', async () => {
  const js = await read('install.js');
  const fallback = body(js, 'function renderAndroidFallback\\(\\)');
  assert.match(fallback, /installButton\.hidden\s*=\s*false/i);
  assert.match(fallback, /installButton\.textContent\s*=\s*['"]Install HRFH web app['"]/i);
  assert.match(fallback, /Install app/i);
});

test('desktop fallback keeps a discoverable Install action while the native prompt is pending or unavailable', async () => {
  const js = await read('install.js');
  const fallback = body(js, 'function renderDesktopFallback\\(\\)');
  assert.match(fallback, /installButton\.hidden\s*=\s*false/i);
  assert.match(fallback, /installButton\.textContent\s*=\s*['"]Install HRFH web app['"]/i);
  assert.match(fallback, /Add to Dock|Install app|install icon/i);
});

test('beforeinstallprompt is treated as current browser installability evidence instead of being blocked by stale fallback state', async () => {
  const js = await read('install.js');
  const handler = js.match(/window\.addEventListener\(['"]beforeinstallprompt['"],\s*\(event\)\s*=>\s*\{([\s\S]*?)\n\}\);/)?.[1] ?? '';
  assert.match(handler, /deferredInstallPrompt\s*=\s*event/i);
  assert.match(handler, /installedStateDetected\s*=\s*false/i);
  assert.match(handler, /clearInstallReceipt\(\)/i);
  assert.match(handler, /renderInstallReady\(\)/i);
  assert.doesNotMatch(handler, /if\s*\([^)]*(?:readInstallReceipt|installedStateDetected)/i);
  assert.doesNotMatch(handler, /readInstallReceipt\(\)/i);
});

test('cancelled or currently unavailable programmable prompt does not permanently hide the Install action', async () => {
  const js = await read('install.js');
  const click = js.match(/installButton\.addEventListener\(['"]click['"],\s*async\s*\(\)\s*=>\s*\{([\s\S]*?)\n\}\);/)?.[1] ?? '';
  assert.match(click, /if\s*\(!deferredInstallPrompt\)[\s\S]*renderFallback\(\)/i);
  assert.match(click, /choice\.outcome\s*===\s*['"]accepted['"][\s\S]*else[\s\S]*renderFallback\(\)/i);
  assert.doesNotMatch(click, /finally\s*\{[\s\S]*installButton\.hidden\s*=\s*true/i);
});

test('non-iOS service worker setup is initiated before final initial-state rendering rather than waiting only for window load', async () => {
  const js = await read('install.js');
  assert.match(js, /async function registerServiceWorker\(\)/i);
  const earlyRegister = js.indexOf('void registerServiceWorker()');
  const initialRender = js.indexOf('void renderInitialState()');
  assert.ok(earlyRegister >= 0, 'expected an explicit early service-worker registration call');
  assert.ok(initialRender >= 0, 'expected initial-state rendering call');
  assert.ok(earlyRegister < initialRender, 'service-worker initialization must begin before initial-state rendering');
  const earlyContext = js.slice(Math.max(0, earlyRegister - 160), earlyRegister + 80);
  assert.match(earlyContext, /!isIOS\(\)/i);
});

test('approved iOS install flow remains unchanged by Android and desktop correction', async () => {
  const js = await read('install.js');
  const ios = body(js, 'function renderIOSInstructions\\(\\)');
  assert.match(ios, /installButton\.textContent\s*=\s*['"]Show install steps['"]/i);
  assert.match(ios, /Tap Share, then Add to Home Screen/i);
  assert.match(ios, /showIOSInstallModal\(\)/i);
});
