import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('release UI exposes no Restore button or Restore shortcut action', async () => {
  const html = await read('index.html');
  assert.doesNotMatch(html, /<button[^>]+id=["']restore-shortcut-button["']/i);
  assert.doesNotMatch(html, />\s*Restore Home Screen shortcut\s*</i);
});
