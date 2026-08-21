const CACHE_NAME = 'myhrfh-installer-v9';
const BUILD_REVISION = 'desktop-installed-state-v2';
const DESKTOP_INSTALL_FIX_REVISION = 'desktop-install-recovery-v1';
const ANDROID_INSTALL_REVISION = 'android-pwa-recovery-v2';
const ANDROID_UI_REVISION = 'android-installed-ui-v1';
const HRFH_ICON_REVISION = 'hrfh-transparent-icon-v1';
const IOS_MODAL_REVISION = 'ios-install-modal-v1';
const IOS_BROWSER_REVISION = 'ios-current-browser-v1';
const IOS_FINAL_GUIDANCE_REVISION = 'ios-final-guidance-v2';
const PRODUCTION_REVISION = 'production-readiness-v2';
const APP_SHELL = [
  './',
  './index.html',
  './launch.html',
  './styles.css',
  './ios-modal.css',
  './ios-guidance-v2.css',
  './ios-guidance-v3.css',
  './install.js',
  './ios-guidance-v2.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

function cacheResponse(request, response) {
  if (!response || response.status !== 200 || response.type !== 'basic') return response;
  const copy = response.clone();
  caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => cacheResponse(request, response)).catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html'))));
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => cacheResponse(request, response))));
});