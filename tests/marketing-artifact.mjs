import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Marketing identity remains defined while staging validation produces no handoff ZIP', async () => {
  const workflow = await read('.github/workflows/validate.yml');
  const readiness = await read('docs/PRODUCTION-READINESS.md');
  assert.doesNotMatch(workflow, /hrfh-web-install-marketing\.zip|actions\/upload-artifact|Build marketing handoff artifact/i);
  assert.match(readiness, /https:\/\/hrfh\.hrforhealth\.com\/web-install\/manifest\.webmanifest/i);
  assert.match(readiness, /https:\/\/hrfh\.hrforhealth\.com\/web-install\//i);
  assert.match(readiness, /exact physically accepted PR head/i);
  assert.match(readiness, /produced ZIP must then be inspected/i);
});
