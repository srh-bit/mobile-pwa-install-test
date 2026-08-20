const MYHRFH_URL = 'https://myhrfh.com';

const installButton = document.getElementById('install-button');
const openButton = document.getElementById('open-button');
const platformContent = document.getElementById('platform-content');
const statusMessage = document.getElementById('status-message');
const pageTitle = document.getElementById('page-title');
const introCopy = document.getElementById('intro-copy');
const card = document.querySelector('.install-card');
const iosInstallModal = document.getElementById('ios-install-modal');
const iosModalDismiss = document.getElementById('ios-modal-dismiss');
const iosModalTitle = document.getElementById('ios-modal-title');
const iosModalCopy = document.getElementById('ios-modal-copy');
const iosShareCue = document.getElementById('ios-share-cue');
const iosShareLabel = document.getElementById('ios-share-label');
const iosBrowserActions = document.getElementById('ios-browser-actions');
const iosOpenChrome = document.getElementById('ios-open-chrome');
const iosUseSafari = document.getElementById('ios-use-safari');
const iosModalNote = document.getElementById('ios-modal-note');

let deferredInstallPrompt = null;
let installedStateDetected = false;
let iosModalPreviousFocus = null;
let chromeHandoffTimer = null;

function userAgent() {
  return navigator.userAgent || '';
}

function platformName() {
  return navigator.userAgentData?.platform || navigator.platform || '';
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIOS() {
  const ua = userAgent();
  const platform = platformName();
  const classicIOS = /iPad|iPhone|iPod/i.test(ua) || /iPad|iPhone|iPod/i.test(platform);
  const desktopModeIPad = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  return classicIOS || desktopModeIPad;
}

function isIOSChrome() {
  return isIOS() && /CriOS/i.test(userAgent());
}

function isAndroid() {
  return /Android/i.test(userAgent()) || /Android/i.test(platformName());
}

function isWindows() {
  return /Windows/i.test(userAgent()) || /Win/i.test(platformName());
}

function isMacOS() {
  if (isIOS()) {
    return false;
  }
  return /Macintosh|Mac OS X/i.test(userAgent()) || /Mac/i.test(platformName());
}

function isIOSSafari() {
  const ua = userAgent();
  return isIOS() && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
}

function isDesktopSafari() {
  const ua = userAgent();
  return isMacOS() && /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS/i.test(ua);
}

function environment() {
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  if (isWindows()) return 'windows';
  if (isMacOS()) return 'macos';
  return 'desktop';
}

function isMobileEnvironment() {
  const current = environment();
  return current === 'ios' || current === 'android';
}

async function isPWAInstalled() {
  if (typeof navigator.getInstalledRelatedApps !== 'function') {
    return false;
  }

  try {
    const relatedApps = await navigator.getInstalledRelatedApps();
    return relatedApps.some((app) => {
      if (app.platform !== 'webapp') {
        return false;
      }

      const manifestMatches = typeof app.url === 'string' && app.url.endsWith('/manifest.webmanifest');
      const appIdMatches = app.id === new URL('./', window.location.href).href;
      return manifestMatches || appIdMatches;
    });
  } catch {
    return false;
  }
}

function setStatus(message = '') {
  statusMessage.textContent = message;
}

function applyEnvironmentCopy() {
  if (isMobileEnvironment()) {
    pageTitle.textContent = 'Add the HRFH web app';
    introCopy.textContent = 'Your HR for Health portal, one tap from your home screen.';
    return;
  }

  pageTitle.textContent = 'Install the HRFH web app';
  introCopy.textContent = 'Your HR for Health portal, ready from this computer.';
}

function setIOSModalContent({ title, copy, shareLabel = '', note = '', showShare = true, showBrowserActions = false }) {
  if (!iosInstallModal) {
    return;
  }

  iosModalTitle.textContent = title;
  iosModalCopy.textContent = copy;
  iosShareLabel.textContent = shareLabel;
  iosShareCue.hidden = !showShare;
  iosBrowserActions.hidden = !showBrowserActions;
  iosModalNote.innerHTML = note;
}

function showIOSInstallModal(focusTarget = iosModalDismiss) {
  if (!isIOS() || isStandalone() || !iosInstallModal) {
    return;
  }

  iosModalPreviousFocus = document.activeElement;
  iosInstallModal.hidden = false;
  document.body.classList.add('ios-modal-open');
  requestAnimationFrame(() => {
    iosInstallModal.classList.add('is-visible');
    focusTarget?.focus({ preventScroll: true });
  });
}

function hideIOSInstallModal() {
  if (!iosInstallModal || iosInstallModal.hidden) {
    return;
  }

  iosInstallModal.classList.remove('is-visible');
  document.body.classList.remove('ios-modal-open');
  iosInstallModal.hidden = true;

  if (iosModalPreviousFocus instanceof HTMLElement) {
    iosModalPreviousFocus.focus({ preventScroll: true });
  }
}

function buildChromeURL() {
  const currentURL = window.location.href;

  if (/^https:/i.test(currentURL)) {
    return currentURL.replace(/^https:/i, 'googlechromes:');
  }

  if (/^http:/i.test(currentURL)) {
    return currentURL.replace(/^http:/i, 'googlechrome:');
  }

  return null;
}

function renderIOSChromeInstructions() {
  installButton.hidden = false;
  installButton.textContent = 'Show install steps';
  platformContent.innerHTML = `
    <p><strong>Add the HRFH web app in two quick steps.</strong><br>Tap Share, then Add to Home Screen.</p>
  `;
  setIOSModalContent({
    title: 'Add HRFH web app',
    copy: 'Tap Share, then Add to Home Screen.',
    shareLabel: 'Chrome Share',
    note: 'Then choose <strong>Add to Home Screen</strong> and tap <strong>Add</strong>.'
  });
  setStatus();
  showIOSInstallModal();
}

function renderIOSSafariInstructions() {
  if (!isIOSSafari()) {
    installButton.hidden = true;
    platformContent.innerHTML = `
      <p><strong>Continue in Safari.</strong><br>Open this page in Safari to add the HRFH web app to your home screen.</p>
    `;
    setIOSModalContent({
      title: 'Continue in Safari',
      copy: 'Open this installer in Safari, then use Share to add it to your home screen.',
      note: 'Safari is the fallback when Google Chrome is unavailable.',
      showShare: false
    });
    setStatus('Open Safari to continue.');
    showIOSInstallModal();
    return;
  }

  installButton.hidden = false;
  installButton.textContent = 'Show install steps';
  platformContent.innerHTML = `
    <p><strong>Add the HRFH web app in two quick steps.</strong><br>Tap Share, then Add to Home Screen.</p>
  `;
  setIOSModalContent({
    title: 'Add HRFH web app',
    copy: 'Tap Share, then Add to Home Screen.',
    shareLabel: 'Safari Share',
    note: 'Then choose <strong>Add to Home Screen</strong> and tap <strong>Add</strong>.'
  });
  setStatus();
  showIOSInstallModal();
}

function renderIOSChromePriority() {
  installButton.hidden = false;
  installButton.textContent = 'Use Google Chrome';
  platformContent.innerHTML = `
    <p><strong>Google Chrome is preferred on iPhone and iPad.</strong><br>Use Chrome when available; Safari remains the fallback.</p>
  `;
  setIOSModalContent({
    title: 'Use Google Chrome',
    copy: 'Google Chrome is preferred for adding the HRFH web app on iPhone and iPad.',
    note: 'If Chrome is unavailable, continue in Safari.',
    showShare: false,
    showBrowserActions: true
  });
  setStatus();
  showIOSInstallModal(iosOpenChrome);
}

function renderIOSInstructions() {
  if (isIOSChrome()) {
    renderIOSChromeInstructions();
    return;
  }

  renderIOSChromePriority();
}

function attemptChromeHandoff() {
  const chromeURL = buildChromeURL();

  if (!chromeURL) {
    renderIOSSafariInstructions();
    return;
  }

  if (chromeHandoffTimer) {
    window.clearTimeout(chromeHandoffTimer);
  }

  let leftCurrentBrowser = false;
  const markBrowserExit = () => {
    if (document.visibilityState === 'hidden') {
      leftCurrentBrowser = true;
    }
  };

  document.addEventListener('visibilitychange', markBrowserExit, { once: true });
  window.addEventListener('pagehide', () => {
    leftCurrentBrowser = true;
  }, { once: true });

  setStatus('Opening Google Chrome…');
  iosModalCopy.textContent = 'Opening Google Chrome…';

  chromeHandoffTimer = window.setTimeout(() => {
    if (!leftCurrentBrowser && document.visibilityState !== 'hidden') {
      renderIOSSafariInstructions();
    }
  }, 1400);

  window.location.href = chromeURL;
}

function setInstalledState(message = 'HRFH web app installed.') {
  deferredInstallPrompt = null;
  installedStateDetected = true;
  hideIOSInstallModal();
  installButton.hidden = true;
  card.classList.add('installed');
  openButton.textContent = 'Open HRFH web app';
  openButton.href = './launch.html';
  const launchPlace = isMobileEnvironment() ? 'your home screen' : 'your apps';
  platformContent.innerHTML = `
    <p><strong>${message}</strong><br>Open it anytime from ${launchPlace}.</p>
  `;
}

function renderAndroidFallback() {
  installButton.hidden = true;
  platformContent.innerHTML = `
    <p><strong>Add the HRFH web app.</strong><br>Use your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
  `;
  setStatus();
}

function renderDesktopFallback() {
  installButton.hidden = true;

  if (isDesktopSafari()) {
    platformContent.innerHTML = `
      <p><strong>Add the HRFH web app to your Mac.</strong><br>In Safari, choose <strong>File → Add to Dock</strong>, then click Add.</p>
    `;
    setStatus();
    return;
  }

  platformContent.innerHTML = `
    <p><strong>Install the HRFH web app from your browser menu.</strong><br>Look for <strong>Install app</strong> or the install icon to add it to this computer.</p>
  `;
  setStatus();
}

function renderFallback() {
  if (environment() === 'ios') {
    renderIOSInstructions();
    return;
  }

  if (environment() === 'android') {
    renderAndroidFallback();
    return;
  }

  renderDesktopFallback();
}

function renderInstallReady() {
  installButton.hidden = false;
  installButton.textContent = 'Install HRFH web app';

  if (isAndroid()) {
    platformContent.innerHTML = `
      <p><strong>Ready to install.</strong><br>Install the HRFH web app for quick access from your home screen.</p>
    `;
  } else {
    platformContent.innerHTML = `
      <p><strong>Ready to install.</strong><br>Install the HRFH web app for quick access from this computer.</p>
    `;
  }

  setStatus();
}

async function renderInitialState() {
  openButton.href = MYHRFH_URL;

  if (isStandalone()) {
    window.location.replace(MYHRFH_URL);
    return;
  }

  applyEnvironmentCopy();

  if (isIOS()) {
    renderIOSInstructions();
    return;
  }

  if (await isPWAInstalled()) {
    setInstalledState('HRFH web app is already installed.');
    setStatus();
    return;
  }

  if (deferredInstallPrompt) {
    renderInstallReady();
    return;
  }

  renderFallback();
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();

  if (installedStateDetected) {
    return;
  }

  deferredInstallPrompt = event;
  applyEnvironmentCopy();
  renderInstallReady();
});

installButton.addEventListener('click', async () => {
  if (isIOS()) {
    if (isIOSChrome()) {
      renderIOSChromeInstructions();
    } else {
      renderIOSChromePriority();
    }
    return;
  }

  if (!deferredInstallPrompt) {
    renderFallback();
    return;
  }

  installButton.disabled = true;
  setStatus('Opening install prompt…');

  try {
    await deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setStatus('Finishing setup…');
    } else {
      setStatus('Installation cancelled.');
    }
  } finally {
    deferredInstallPrompt = null;
    installButton.disabled = false;
    installButton.hidden = true;
  }
});

iosOpenChrome?.addEventListener('click', attemptChromeHandoff);
iosUseSafari?.addEventListener('click', renderIOSSafariInstructions);
iosModalDismiss?.addEventListener('click', hideIOSInstallModal);

iosInstallModal?.addEventListener('click', (event) => {
  if (event.target === iosInstallModal) {
    hideIOSInstallModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && iosInstallModal && !iosInstallModal.hidden) {
    hideIOSInstallModal();
  }
});

window.addEventListener('appinstalled', () => {
  setInstalledState();
  setStatus('Installed successfully.');
});

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      setStatus('Offline support is unavailable.');
    });
  }
});

void renderInitialState();
