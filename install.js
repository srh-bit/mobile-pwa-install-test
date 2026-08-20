const MYHRFH_URL = 'https://myhrfh.com';
const INSTALL_PROMPT_WAIT_MS = 1200;
const INSTALL_RECEIPT_KEY = 'myhrfh-install-receipt-v1';

const installButton = document.getElementById('install-button');
const openButton = document.getElementById('open-button');
const reinstallButton = document.getElementById('reinstall-button');
const restoreShortcutButton = document.getElementById('restore-shortcut-button');
const installedActions = document.getElementById('installed-actions');
const platformContent = document.getElementById('platform-content');
const statusMessage = document.getElementById('status-message');
const pageTitle = document.getElementById('page-title');
const introCopy = document.getElementById('intro-copy');
const card = document.querySelector('.install-card');
const iosInstallModal = document.getElementById('ios-install-modal');
const iosModalDismiss = document.getElementById('ios-modal-dismiss');
const managementDialog = document.getElementById('management-dialog');
const managementTitle = document.getElementById('management-title');
const managementCopy = document.getElementById('management-copy');
const managementSteps = document.getElementById('management-steps');
const managementClose = document.getElementById('management-close');
const managementDone = document.getElementById('management-done');

let deferredInstallPrompt = null;
let installedStateDetected = false;
let iosModalPreviousFocus = null;

function userAgent() {
  return navigator.userAgent || '';
}

function platformName() {
  return navigator.userAgentData?.platform || navigator.platform || '';
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIPad() {
  const ua = userAgent();
  return /iPad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
}

function isIOS() {
  const ua = userAgent();
  const platform = platformName();
  return /iPad|iPhone|iPod/i.test(ua) || /iPad|iPhone|iPod/i.test(platform) || isIPad();
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
  if (isIOS()) return false;
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

function isEdgeDesktop() {
  return !isIOS() && !isAndroid() && /Edg\//i.test(userAgent());
}

function isChromeDesktop() {
  const ua = userAgent();
  return !isIOS() && !isAndroid() && /Chrome|Chromium/i.test(ua) && !/Edg|OPR/i.test(ua);
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

function readInstallReceipt() {
  try {
    return window.localStorage.getItem(INSTALL_RECEIPT_KEY) === 'installed';
  } catch {
    return false;
  }
}

function writeInstallReceipt() {
  try {
    window.localStorage.setItem(INSTALL_RECEIPT_KEY, 'installed');
  } catch {
    // Browser capability checks remain available when storage is restricted.
  }
}

function clearInstallReceipt() {
  try {
    window.localStorage.removeItem(INSTALL_RECEIPT_KEY);
  } catch {
    // Ignore storage restrictions and continue with browser capability checks.
  }
}

async function getInstallationState() {
  if (isStandalone()) {
    writeInstallReceipt();
    return 'installed';
  }

  if (typeof navigator.getInstalledRelatedApps !== 'function') {
    return 'unknown';
  }

  try {
    const relatedApps = await navigator.getInstalledRelatedApps();
    const installed = relatedApps.some((app) => {
      if (app.platform !== 'webapp') return false;
      const manifestMatches = typeof app.url === 'string' && app.url.endsWith('/manifest.webmanifest');
      const appIdMatches = app.id === new URL('./', window.location.href).href;
      return manifestMatches || appIdMatches;
    });

    if (installed) {
      writeInstallReceipt();
      return 'installed';
    }

    if (isAndroid()) {
      clearInstallReceipt();
      return 'not-installed';
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

async function waitForInstallPrompt() {
  if (deferredInstallPrompt) return true;
  await new Promise((resolve) => window.setTimeout(resolve, INSTALL_PROMPT_WAIT_MS));
  return Boolean(deferredInstallPrompt);
}

function setStatus(message = '') {
  statusMessage.textContent = message;
}

function resetInstalledActions() {
  installedStateDetected = false;
  card.classList.remove('installed');
  installedActions.hidden = true;
  reinstallButton.hidden = true;
  restoreShortcutButton.hidden = true;
  openButton.textContent = 'Open myHRFH';
  openButton.href = MYHRFH_URL;
  openButton.classList.remove('button-primary');
  openButton.classList.add('button-secondary');
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

function showIOSInstallModal() {
  if (!isIOS() || isStandalone() || !iosInstallModal) return;
  iosModalPreviousFocus = document.activeElement;
  iosInstallModal.hidden = false;
  document.body.classList.add('ios-modal-open');
  requestAnimationFrame(() => {
    iosInstallModal.classList.add('is-visible');
    iosModalDismiss?.focus({ preventScroll: true });
  });
}

function hideIOSInstallModal() {
  if (!iosInstallModal || iosInstallModal.hidden) return;
  iosInstallModal.classList.remove('is-visible');
  document.body.classList.remove('ios-modal-open');
  iosInstallModal.hidden = true;
  if (iosModalPreviousFocus instanceof HTMLElement) {
    iosModalPreviousFocus.focus({ preventScroll: true });
  }
}

function renderIOSInstructions() {
  resetInstalledActions();
  installButton.hidden = false;
  installButton.textContent = 'Show install steps';
  platformContent.innerHTML = '<p><strong>Add the HRFH web app in two quick steps.</strong><br>Tap Share, then Add to Home Screen.</p>';
  setStatus();
  showIOSInstallModal();
}

function getInstalledManagementAvailability({ confirmed = false } = {}) {
  if (!confirmed || isIOS()) return { restore: false };
  if (isAndroid()) return { restore: false };
  return {
    restore: isChromeDesktop() || isEdgeDesktop() || (isMacOS() && isDesktopSafari())
  };
}

function setInstalledState(message = 'HRFH web app is installed.', { confirmed = true } = {}) {
  installedStateDetected = confirmed;
  hideIOSInstallModal();
  installButton.hidden = true;
  reinstallButton.hidden = !(confirmed && isAndroid());
  card.classList.add('installed');

  const management = getInstalledManagementAvailability({ confirmed });
  restoreShortcutButton.hidden = !management.restore;
  installedActions.hidden = !management.restore;

  pageTitle.textContent = 'HRFH web app is installed';
  introCopy.textContent = management.restore
    ? 'Open it now or restore quick access on this device.'
    : 'Open the HRFH web app from this device.';
  openButton.textContent = 'Open HRFH web app';
  openButton.href = './launch.html';
  openButton.classList.remove('button-secondary');
  openButton.classList.add('button-primary');

  if (isAndroid()) {
    platformContent.innerHTML = '<p><strong>The myHRFH icon was added to your Home Screen.</strong></p>';
  } else if (management.restore) {
    platformContent.innerHTML = `<p><strong>${message}</strong><br>Shortcut placement is managed by your device. If quick access is missing, use Restore shortcut below.</p>`;
  } else {
    platformContent.innerHTML = `<p><strong>${message}</strong><br>Open the HRFH web app when you are ready.</p>`;
  }
  setStatus();
}

function setManagementContent(title, copy, steps) {
  managementTitle.textContent = title;
  managementCopy.textContent = copy;
  managementSteps.replaceChildren();
  steps.forEach((step) => {
    const item = document.createElement('li');
    item.textContent = step;
    managementSteps.append(item);
  });
}

function showManagementDialog() {
  if (typeof managementDialog.showModal === 'function') {
    managementDialog.showModal();
    managementClose?.focus({ preventScroll: true });
    return;
  }
  managementDialog.setAttribute('open', '');
}

function closeManagementDialog() {
  if (typeof managementDialog.close === 'function' && managementDialog.open) {
    managementDialog.close();
    return;
  }
  managementDialog.removeAttribute('open');
}

function showShortcutHelp() {
  const copy = 'Shortcut placement is managed by your device.';
  let steps;

  if (isEdgeDesktop()) {
    steps = [
      'Open edge://apps in Microsoft Edge.',
      'Find myHRFH and open its app details.',
      'Choose Create Desktop shortcut or pin it where you want quick access.'
    ];
  } else if (isChromeDesktop()) {
    steps = [
      'Open chrome://apps in Google Chrome.',
      'Find myHRFH and open its app options.',
      'Choose Create shortcut to restore desktop or menu access.'
    ];
  } else if (isDesktopSafari()) {
    steps = [
      'Open Applications and find myHRFH.',
      'Drag myHRFH to the Dock if you want a Dock shortcut.',
      'If it is not in Applications, return to Safari and choose File → Add to Dock.'
    ];
  } else {
    steps = [
      'Open your browser’s installed-apps or applications page.',
      'Find myHRFH and use the browser or operating-system shortcut option.',
      'If myHRFH is not listed, return here and install it again.'
    ];
  }

  setManagementContent('Restore shortcut', copy, steps);
  showManagementDialog();
}

function renderAndroidFallback() {
  resetInstalledActions();
  installButton.hidden = true;
  platformContent.innerHTML = '<p><strong>Install the HRFH web app.</strong><br>Open your browser menu and choose <strong>Install app</strong>.</p>';
  setStatus();
}

function renderDesktopFallback() {
  resetInstalledActions();
  installButton.hidden = true;
  if (isDesktopSafari()) {
    platformContent.innerHTML = '<p><strong>Add the HRFH web app to your Mac.</strong><br>In Safari, choose <strong>File → Add to Dock</strong>, then click Add.</p>';
    setStatus();
    return;
  }
  platformContent.innerHTML = '<p><strong>Install the HRFH web app from your browser menu.</strong><br>Look for <strong>Install app</strong> or the install icon to add it to this computer.</p>';
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
  resetInstalledActions();
  installButton.hidden = false;
  installButton.textContent = 'Install HRFH web app';
  platformContent.innerHTML = isAndroid()
    ? '<p><strong>Ready to install.</strong><br>Install the HRFH web app for quick access from your home screen.</p>'
    : '<p><strong>Ready to install.</strong><br>Install the HRFH web app for quick access from this computer.</p>';
  setStatus();
}

async function renderInitialState() {
  openButton.href = MYHRFH_URL;

  if (isStandalone()) {
    writeInstallReceipt();
    window.location.replace(MYHRFH_URL);
    return;
  }

  applyEnvironmentCopy();
  if (isIOS()) {
    renderIOSInstructions();
    return;
  }

  platformContent.innerHTML = '<p><strong>Checking this device…</strong><br>Confirming the best available setup.</p>';
  setStatus('Checking this device…');

  const installationState = await getInstallationState();
  if (installationState === 'installed') {
    setInstalledState('HRFH web app is already installed.', { confirmed: true });
    return;
  }

  if (installationState === 'unknown' && readInstallReceipt()) {
    setInstalledState('HRFH web app was previously installed.', { confirmed: true });
    return;
  }

  if (installationState === 'not-installed') {
    clearInstallReceipt();
  }

  if (deferredInstallPrompt || await waitForInstallPrompt()) {
    renderInstallReady();
    return;
  }

  renderFallback();
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (installedStateDetected || readInstallReceipt()) {
    installButton.hidden = true;
    return;
  }
  applyEnvironmentCopy();
  renderInstallReady();
});

installButton.addEventListener('click', async () => {
  if (isIOS()) {
    renderIOSInstructions();
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
      writeInstallReceipt();
      setInstalledState('HRFH web app is installed.', { confirmed: true });
      setStatus('Installed successfully.');
    } else {
      setStatus('Installation cancelled.');
    }
  } finally {
    deferredInstallPrompt = null;
    installButton.disabled = false;
    installButton.hidden = true;
  }
});

reinstallButton?.addEventListener('click', () => {
  if (!isAndroid()) return;
  clearInstallReceipt();
  installedStateDetected = false;
  reinstallButton.hidden = true;
  if (deferredInstallPrompt) {
    applyEnvironmentCopy();
    renderInstallReady();
    setStatus('Ready to reinstall.');
    return;
  }
  window.location.reload();
});

restoreShortcutButton?.addEventListener('click', showShortcutHelp);
managementClose?.addEventListener('click', closeManagementDialog);
managementDone?.addEventListener('click', closeManagementDialog);
managementDialog?.addEventListener('click', (event) => {
  if (event.target === managementDialog) closeManagementDialog();
});
iosModalDismiss?.addEventListener('click', hideIOSInstallModal);
iosInstallModal?.addEventListener('click', (event) => {
  if (event.target === iosInstallModal) hideIOSInstallModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && iosInstallModal && !iosInstallModal.hidden) hideIOSInstallModal();
});

window.addEventListener('appinstalled', () => {
  writeInstallReceipt();
  setInstalledState('HRFH web app is installed.', { confirmed: true });
  setStatus('Installed successfully.');
});

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      setStatus('Install support could not be initialized. Refresh and try again.');
    });
  }
});

void renderInitialState();