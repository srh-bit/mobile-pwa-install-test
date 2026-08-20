(() => {
  'use strict';

  const TRUSTED_ORIGIN = 'https://myhrfh.com';
  const PROTOCOL_VERSION = 1;
  const READY_EVENT = 'hrfh-android-native-ready';
  const REQUEST_TIMEOUT_MS = 10000;
  const ALLOWED_ACTIONS = new Set(['restore-shortcut', 'uninstall']);
  const ALLOWED_STATUSES = new Set(['requested', 'already-present', 'unsupported', 'rejected', 'error']);

  let port = null;
  let ready = false;
  let sequence = 0;
  let capabilities = new Set();
  const pending = new Map();

  function parseMessage(value) {
    if (typeof value !== 'string' || value.length === 0 || value.length > 2048) {
      return null;
    }
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function hasExactKeys(value, expected) {
    const actual = Object.keys(value).sort();
    const wanted = [...expected].sort();
    return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
  }

  function validHandshake(value) {
    if (!value || !hasExactKeys(value, ['type', 'version', 'capabilities'])) {
      return false;
    }
    if (value.type !== 'hrfh-native' || value.version !== PROTOCOL_VERSION || !Array.isArray(value.capabilities)) {
      return false;
    }
    const unique = new Set(value.capabilities);
    return unique.size === value.capabilities.length
      && value.capabilities.length > 0
      && value.capabilities.every((capability) => ALLOWED_ACTIONS.has(capability));
  }

  function validResult(value) {
    return Boolean(
      value
      && hasExactKeys(value, ['type', 'version', 'requestId', 'status'])
      && value.type === 'hrfh-management-result'
      && value.version === PROTOCOL_VERSION
      && typeof value.requestId === 'string'
      && /^[A-Za-z0-9_-]{1,64}$/.test(value.requestId)
      && ALLOWED_STATUSES.has(value.status)
    );
  }

  function handlePortMessage(raw) {
    const message = parseMessage(raw);
    if (!validResult(message)) {
      return;
    }
    const request = pending.get(message.requestId);
    if (!request) {
      return;
    }
    window.clearTimeout(request.timeoutId);
    pending.delete(message.requestId);
    request.resolve(Object.freeze({ status: message.status }));
  }

  function acceptHandshake(event) {
    if (event.origin !== TRUSTED_ORIGIN || !event.ports || !event.ports[0]) {
      return;
    }
    const message = parseMessage(event.data);
    if (!validHandshake(message)) {
      return;
    }

    if (port && port !== event.ports[0]) {
      try {
        port.close();
      } catch {
        // Closing a superseded MessagePort is best-effort only.
      }
    }

    port = event.ports[0];
    port.onmessage = (messageEvent) => handlePortMessage(messageEvent.data);
    port.start?.();
    capabilities = new Set(message.capabilities);
    ready = true;
    window.dispatchEvent(new CustomEvent(READY_EVENT));
  }

  function isReady() {
    return ready && Boolean(port);
  }

  function getCapabilities() {
    return Object.freeze([...capabilities]);
  }

  function request(action) {
    if (!isReady() || !ALLOWED_ACTIONS.has(action) || !capabilities.has(action)) {
      return Promise.reject(new Error('Android native management is unavailable.'));
    }

    sequence += 1;
    const requestId = `hrfh_${Date.now().toString(36)}_${sequence.toString(36)}`;
    const payload = JSON.stringify({
      type: 'hrfh-management',
      version: PROTOCOL_VERSION,
      requestId,
      action
    });

    return new Promise((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        pending.delete(requestId);
        reject(new Error('Android did not acknowledge the request.'));
      }, REQUEST_TIMEOUT_MS);

      pending.set(requestId, { resolve, reject, timeoutId });
      try {
        port.postMessage(payload);
      } catch {
        window.clearTimeout(timeoutId);
        pending.delete(requestId);
        reject(new Error('Android native management is unavailable.'));
      }
    });
  }

  window.addEventListener('message', acceptHandshake);
  window.HRFHAndroidNative = Object.freeze({ isReady, getCapabilities, request });
})();
