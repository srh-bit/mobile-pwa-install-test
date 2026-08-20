import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('marketing artifact rewrites only the self-PWA identity to the approved marketing route', async () => {
  const workflow = await read('.github/workflows/validate.yml');
  assert.match(workflow, /https:\/\/hrfh\.hrforhealth\.com\/web-install\/manifest\.webmanifest/);
  assert.match(workflow, /https:\/\/hrfh\.hrforhealth\.com\/web-install\//);
  assert.match(workflow, /hrfh-web-install-marketing\.zip/);
});
