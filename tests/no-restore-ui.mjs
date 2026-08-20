import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('release UI has no restore management controls', async () => {
  const html = await read('index.html');
  const js = await read('install.js');
  assert.doesNotMatch(html, /restore-shortcut-button/i);
  assert.doesNotMatch(html, /management-dialog/i);
  assert.doesNotMatch(js, /restoreShortcutButton|showShortcutHelp|showManagementDialog|getInstalledManagementAvailability/);
});
