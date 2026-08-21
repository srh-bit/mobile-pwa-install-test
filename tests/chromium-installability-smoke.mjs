import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const REPO_ROOT = resolve(new URL('..', import.meta.url).pathname);
const STARTUP_ATTEMPTS = 3;
const STARTUP_POLL_COUNT = 100;

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

async function waitForDevToolsPort(getStderr) {
  const pattern = /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//;
  for (let attempt = 0; attempt < STARTUP_POLL_COUNT; attempt += 1) {
    const stderr = getStderr();
    const match = stderr.match(pattern);
    if (match) return Number(match[1]);
    await sleep(100);
  }
  throw new Error(`Timed out waiting for Chrome DevTools endpoint. Chrome stderr: ${getStderr()}`);
}

async function waitForTarget(port, expectedOrigin, getStderr) {
  const endpoint = `http://127.0.0.1:${port}/json/list`;
  for (let attempt = 0; attempt < STARTUP_POLL_COUNT; attempt += 1) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const targets = await response.json();
        const page = targets.find((target) => target.type === 'page' && target.url.startsWith(expectedOrigin));
        if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
      }
    } catch {
      // Chrome may still be creating the target.
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for Chrome DevTools target at ${expectedOrigin}. Chrome stderr: ${getStderr()}`);
}

function stopChrome(chrome) {
  if (chrome && !chrome.killed) chrome.kill('SIGKILL');
}

async function launchChromeWithDevTools(origin) {
  const failures = [];

  for (let attempt = 1; attempt <= STARTUP_ATTEMPTS; attempt += 1) {
    const chrome = spawn(chromeBinary(), [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--remote-debugging-port=0',
      `--user-data-dir=/tmp/hrfh-pwa-installability-${process.pid}-${Date.now()}-${attempt}`,
      `${origin}/`
    ], {
      stdio: ['ignore', 'ignore', 'pipe'],
      env: { ...process.env, DBUS_SESSION_BUS_ADDRESS: '' }
    });

    let chromeStderr = '';
    chrome.stderr.on('data', (chunk) => { chromeStderr += chunk.toString(); });

    try {
      const port = await waitForDevToolsPort(() => chromeStderr);
      const webSocketUrl = await waitForTarget(port, origin, () => chromeStderr);
      return { chrome, chromeStderr: () => chromeStderr, webSocketUrl };
    } catch (error) {
      failures.push(`attempt ${attempt}: ${error instanceof Error ? error.message : String(error)}`);
      stopChrome(chrome);
      await sleep(250);
    }
  }

  throw new Error(`Chrome failed to expose DevTools after ${STARTUP_ATTEMPTS} bounded attempts. ${failures.join(' | ')}`);
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

async function waitForManifest(cdp) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const manifest = await cdp.send('Page.getAppManifest');
    if (manifest.url?.endsWith('/manifest.webmanifest')) return manifest;
    await sleep(100);
  }
  return cdp.send('Page.getAppManifest');
}

test('Chromium reports the staging shell as technically installable', { timeout: 60000 }, async (t) => {
  const { server, origin } = await startStaticServer();
  t.after(() => new Promise((resolvePromise) => server.close(resolvePromise)));

  const launched = await launchChromeWithDevTools(origin);
  t.after(() => stopChrome(launched.chrome));

  const cdp = await connectCdp(launched.webSocketUrl);
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

  const manifest = await waitForManifest(cdp);
  assert.ok(manifest.url?.endsWith('/manifest.webmanifest'), `Expected manifest URL, got ${manifest.url ?? 'none'}`);

  const result = await cdp.send('Page.getInstallabilityErrors');
  const errors = result.installabilityErrors ?? [];
  assert.deepEqual(
    errors,
    [],
    `Chromium installability errors: ${JSON.stringify(errors)}\nChrome stderr: ${launched.chromeStderr()}`
  );
});

test('desktop installability signal invalidates a stale local install receipt', { timeout: 60000 }, async (t) => {
  const { server, origin } = await startStaticServer();
  t.after(() => new Promise((resolvePromise) => server.close(resolvePromise)));

  const launched = await launchChromeWithDevTools(origin);
  t.after(() => stopChrome(launched.chrome));

  const cdp = await connectCdp(launched.webSocketUrl);
  t.after(() => cdp.close());

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Runtime.evaluate', {
    expression: `localStorage.setItem('myhrfh-install-receipt-v1', 'installed')`
  });
  await cdp.send('Runtime.evaluate', {
    expression: `window.dispatchEvent(new Event('beforeinstallprompt', { cancelable: true }))`
  });
  await sleep(100);

  const rendered = await cdp.send('Runtime.evaluate', {
    expression: `({
      receipt: localStorage.getItem('myhrfh-install-receipt-v1'),
      installHidden: document.getElementById('install-button')?.hidden,
      installText: document.getElementById('install-button')?.textContent
    })`,
    returnByValue: true
  });

  assert.equal(rendered.result?.value?.receipt, null, 'A fresh Desktop installability signal must invalidate stale local installed state');
  assert.equal(rendered.result?.value?.installHidden, false);
  assert.equal(rendered.result?.value?.installText, 'Install HRFH web app');
});
