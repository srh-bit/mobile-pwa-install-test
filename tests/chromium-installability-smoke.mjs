import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const REPO_ROOT = resolve(new URL('..', import.meta.url).pathname);
const CDP_PORT = 9223;

const MIME = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.png', 'image/png']
]);

const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

function chromeBinary() {
  for (const candidate of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    const result = spawnSync('bash', ['-lc', `command -v ${candidate}`], { encoding: 'utf8' });
    if (result.status === 0 && result.stdout.trim()) return result.stdout.trim();
  }
  throw new Error('Chromium/Chrome executable is required for the installability gate.');
}

async function startStaticServer() {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
      const requestedPath = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
      const relative = normalize(decodeURIComponent(requestedPath)).replace(/^[/\\]+/, '');
      const absolute = resolve(join(REPO_ROOT, relative));
      if (!absolute.startsWith(`${REPO_ROOT}/`) && absolute !== REPO_ROOT) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      const fileStat = await stat(absolute);
      if (!fileStat.isFile()) throw new Error('Not a file');
      const body = await readFile(absolute);
      response.writeHead(200, {
        'Content-Type': MIME.get(extname(absolute)) ?? 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      response.end(body);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });

  await new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolvePromise);
  });
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  return { server, origin: `http://127.0.0.1:${address.port}` };
}

async function waitForTarget(expectedUrl) {
  const endpoint = `http://127.0.0.1:${CDP_PORT}/json/list`;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const targets = await response.json();
        const page = targets.find((target) => target.type === 'page' && target.url.startsWith(expectedUrl));
        if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
      }
    } catch {
      // Chrome may still be starting.
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for Chrome DevTools target at ${expectedUrl}`);
}

async function connectCdp(webSocketUrl) {
  assert.equal(typeof WebSocket, 'function', 'Node.js WebSocket support is required');
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();
  let nextId = 1;

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id || !pending.has(message.id)) return;
    const { resolve: resolvePromise, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolvePromise(message.result ?? {});
  });

  await new Promise((resolvePromise, reject) => {
    socket.addEventListener('open', resolvePromise, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  return {
    send(method, params = {}) {
      const id = nextId;
      nextId += 1;
      return new Promise((resolvePromise, reject) => {
        pending.set(id, { resolve: resolvePromise, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() {
      socket.close();
    }
  };
}

test('Chromium reports the staging shell as technically installable', { timeout: 30000 }, async (t) => {
  const { server, origin } = await startStaticServer();
  t.after(() => new Promise((resolvePromise) => server.close(resolvePromise)));

  const chrome = spawn(chromeBinary(), [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=/tmp/hrfh-pwa-installability-${process.pid}`,
    `${origin}/`
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let chromeStderr = '';
  chrome.stderr.on('data', (chunk) => { chromeStderr += chunk.toString(); });
  t.after(() => {
    if (!chrome.killed) chrome.kill('SIGKILL');
  });

  const webSocketUrl = await waitForTarget(`${origin}/`);
  const cdp = await connectCdp(webSocketUrl);
  t.after(() => cdp.close());

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Runtime.evaluate', {
    expression: `(async () => {
      if (!('serviceWorker' in navigator)) return { supported: false };
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error('service-worker-ready-timeout')), 8000))
      ]);
      return { supported: true, scope: registration.scope, controller: Boolean(navigator.serviceWorker.controller) };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  const manifest = await cdp.send('Page.getAppManifest');
  assert.ok(manifest.url?.endsWith('/manifest.webmanifest'), `Expected manifest URL, got ${manifest.url ?? 'none'}`);

  const result = await cdp.send('Page.getInstallabilityErrors');
  const errors = result.installabilityErrors ?? [];
  assert.deepEqual(
    errors,
    [],
    `Chromium installability errors: ${JSON.stringify(errors)}\nChrome stderr: ${chromeStderr}`
  );
});
