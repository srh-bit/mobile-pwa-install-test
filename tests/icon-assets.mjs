import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');
const readBuffer = (path) => readFile(fileUrl(path));

function pngSize(buffer) {
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('manifest exposes separate regular and maskable HRFH launcher icons', async () => {
  const manifest = JSON.parse(await read('manifest.webmanifest'));
  const icons = manifest.icons ?? [];
  assert.equal(icons.length, 4);
  assert.deepEqual(
    icons.map(({ src, sizes, type, purpose }) => ({ src, sizes, type, purpose })),
    [
      { src: './icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: './icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: './icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  );
});

test('all four launcher icon files are valid square PNG assets', async () => {
  for (const [path, size] of [
    ['icons/icon-192.png', 192],
    ['icons/icon-512.png', 512],
    ['icons/icon-maskable-192.png', 192],
    ['icons/icon-maskable-512.png', 512]
  ]) {
    const buffer = await readBuffer(path);
    assert.deepEqual(pngSize(buffer), { width: size, height: size });
    assert.ok(buffer.length > 5000);
  }
});

test('service worker pre-caches the maskable launcher icons', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /\.\/icons\/icon-maskable-192\.png/);
  assert.match(worker, /\.\/icons\/icon-maskable-512\.png/);
  assert.match(worker, /HRFH_ICON_REVISION\s*=\s*['"]hrfh-launcher-icon-v2['"]/);
});
