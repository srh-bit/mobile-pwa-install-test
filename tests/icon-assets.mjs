import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fileUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(fileUrl(path), 'utf8');
const readBuffer = (path) => readFile(fileUrl(path));

function pngMetadata(buffer) {
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  const colorType = buffer[25];
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    hasTransparency: colorType === 6 || buffer.includes(Buffer.from('tRNS'))
  };
}

test('manifest uses only the two transparent HRFH launcher icons', async () => {
  const manifest = JSON.parse(await read('manifest.webmanifest'));
  const icons = manifest.icons ?? [];
  assert.deepEqual(
    icons.map(({ src, sizes, type, purpose }) => ({ src, sizes, type, purpose })),
    [
      { src: './icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
    ]
  );
  assert.ok(icons.every((icon) => icon.purpose === 'any'));
  assert.ok(!icons.some((icon) => /maskable/i.test(icon.purpose ?? '') || /maskable/i.test(icon.src)));
});

test('launcher icon files are square transparent PNG assets', async () => {
  for (const [path, size] of [
    ['icons/icon-192.png', 192],
    ['icons/icon-512.png', 512]
  ]) {
    const buffer = await readBuffer(path);
    const metadata = pngMetadata(buffer);
    assert.deepEqual({ width: metadata.width, height: metadata.height }, { width: size, height: size });
    assert.equal(metadata.hasTransparency, true);
    assert.ok(buffer.length > 5000);
  }
});

test('service worker records the final transparent HRFH icon revision', async () => {
  const worker = await read('service-worker.js');
  assert.match(worker, /HRFH_ICON_REVISION\s*=\s*['"]hrfh-transparent-icon-v1['"]/);
  assert.doesNotMatch(worker, /icon-maskable|maskable/i);
});
