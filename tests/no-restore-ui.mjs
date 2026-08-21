import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const APPROVED_LOGO = 'https://hrforhealth.com/wp-content/uploads/2024/04/Logo-icon-1.png.webp';

test('release UI contains no Restore control or Restore-management implementation', async () => {
  const html = await read('index.html');
  const js = await read('install.js');
  assert.doesNotMatch(html, /restore-shortcut-button|installed-actions|management-dialog/i);
  assert.doesNotMatch(js, /const\s+restoreShortcutButton\b|const\s+installedActions\b|function\s+getInstalledManagementAvailability\b|function\s+showShortcutHelp\b|function\s+showManagementDialog\b|const\s+managementDialog\b/i);
});

test('approved HRFH logo URL is used for visible installer branding', async () => {
  const html = await read('index.html');
  const escaped = APPROVED_LOGO.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(html, new RegExp(escaped));
  assert.match(html, new RegExp(`<img[^>]+class=["']brand-icon["'][^>]+src=["']${escaped}["']`, 'i'));
});

test('desktop stale receipt cannot suppress a newly available native install prompt', async () => {
  const js = await read('install.js');
  const initialState = js.match(/async function renderInitialState\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  const promptHandler = js.match(/window\.addEventListener\(['"]beforeinstallprompt['"],\s*\(event\)\s*=>\s*\{([\s\S]*?)\n\}\);/)?.[1] ?? '';

  assert.match(initialState, /installationState === ['"]unknown['"][\s\S]*isAndroid\(\)[\s\S]*readInstallReceipt\(\)/i);
  assert.doesNotMatch(initialState, /installationState === ['"]unknown['"]\s*&&\s*readInstallReceipt\(\)/i);
  assert.match(promptHandler, /installedStateDetected\s*\|\|\s*\(isAndroid\(\)\s*&&\s*readInstallReceipt\(\)\)/i);
});
