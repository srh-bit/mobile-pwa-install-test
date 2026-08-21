import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('staging validation does not create or upload a Marketing handoff package before device acceptance', async () => {
  const workflow = await read('.github/workflows/validate.yml');
  assert.doesNotMatch(workflow, /Build marketing handoff artifact/i);
  assert.doesNotMatch(workflow, /Upload marketing handoff artifact/i);
  assert.doesNotMatch(workflow, /hrfh-web-install-marketing\.zip/i);
  assert.doesNotMatch(workflow, /actions\/upload-artifact/i);
});
