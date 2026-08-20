const MYHRFH_URL = 'https://myhrfh.com';
const INSTALL_PROMPT_WAIT_MS = 1200;

const installButton = document.getElementById('install-button');
const openButton = document.getElementById('open-button');
const restoreShortcutButton = document.getElementById('restore-shortcut-button');
const uninstallButton = document.getElementById('uninstall-button');
const installedActions = document.getElementById('installed-actions');
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
const managementDialog = document.getElementById('management-dialog');
const managementTitle = document.getElementById('management-title');
const managementCopy = document.getElementById('management-copy');
const managementSteps = document.getElementById('management-steps');
const managementClose = document.getElementById('management-close');
const managementDone = document.getElementById('management-done');

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

function isEdgeDesktop() {
  return !isIOS() && /Edg\//i.test(userAgent());
}

function isChromeDesktop() {
  const ua = userAgent();
  return !isIOS() && /Chrome|Chromium/i.test(ua) && !/Edg|OPR/i.test(ua);
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

async function getInstallationState() {
  if (isStandalone()) {
    return 'installed';
  }

  if (typeof navigator.getInstalledRelatedApps !== 'function') {
    return 'unknown';
  }

  try {
    const relatedApps = await navigator.getInstalledRelatedApps();
    const installed = relatedApps.some((app) => {
      if (app.platform !== 'webapp') {
        return false;
      }

      const manifestMatches = typeof app.url === 'string' && app.url.endsWith('/manifest.webmanifest');
      const appIdMatches = app.id === new URL('./', window.location.href).href;
      return manifestMatches || appIdMatches;
    });

    return installed ? 'installed' : 'not-installed';
  } catch {
    return 'unknown';
  }
}

async function waitForInstallPrompt() {
  if (deferredInstallPrompt) {
    return true;
  }

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
  restoreShortcutButton.hidden = true;
  uninstallButton.hidden = true;
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
  resetInstalledActions();
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
  resetInstalledActions();

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
  resetInstalledActions();
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

function setInstalledState(message = 'HRFH web app is installed.') {
  deferredInstallPrompt = null;
  installedStateDetected = true;
  hideIOSInstallModal();
  installButton.hidden = true;
  card.classList.add('installed');
  installedActions.hidden = false;
  restoreShortcutButton.hidden = false;
  uninstallButton.hidden = false;
  pageTitle.textContent = 'HRFH web app is installed';
  introCopy.textContent = 'Open it now or manage it on this device.';
  openButton.textContent = 'Open HRFH web app';
  openButton.href = './launch.html';
  openButton.classList.remove('button-secondary');
  openButton.classList.add('button-primary');
  platformContent.innerHTML = `
    <p><strong>${message}</strong><br>Shortcut placement is managed by your device. If the icon is missing, restore it below.</p>
  `;
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
  let copy = 'Shortcut placement is managed by your device.';
  let steps;

  if (isAndroid()) {
    steps = [
      'Open your app list and find myHRFH.',
      'Touch and hold myHRFH, then place it on your home screen.',
      'If myHRFH is not in your app list, return to this page and install it again.'
    ];
  } else if (isIOS()) {
    steps = [
      'Open this installer in Google Chrome when available, or Safari as the fallback.',
      'Tap Share, choose Add to Home Screen, then tap Add.',
      'iPhone and iPad do not let a website verify whether a Home Screen icon is currently visible.'
    ];
  } else if (isEdgeDesktop()) {
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
      'Find myHRFH and use the browser or operating system shortcut option.',
      'If myHRFH is not listed, return here and install it again.'
    ];
  }

  setManagementContent('Restore shortcut', copy, steps);
  showManagementDialog();
}

function showUninstallHelp() {
  const copy = 'Your browser or your device controls removal; this page cannot uninstall the HRFH web app directly.';
  let steps;

  if (isAndroid()) {
    steps = [
      'Open your app list or device app settings and find myHRFH.',
      'Touch and hold myHRFH, then choose Uninstall myHRFH, Uninstall, or Remove.',
      'Confirm the removal when your device asks.'
    ];
  } else if (isIOS()) {
    steps = [
      'Touch and hold myHRFH on the Home Screen.',
      'Choose Remove App or Delete Bookmark, depending on the browser and iOS version.',
      'Confirm the removal.'
    ];
  } else if (isEdgeDesktop()) {
    steps = [
      'Open edge://apps in Microsoft Edge.',
      'Open the myHRFH app details.',
      'Choose Uninstall myHRFH or Uninstall and confirm.'
    ];
  } else if (isChromeDesktop()) {
    steps = [
      'Open chrome://apps in Google Chrome.',
      'Find myHRFH and open its app options.',
      'Choose Uninstall myHRFH or Remove from Chrome and confirm.'
    ];
  } else if (isDesktopSafari()) {
    steps = [
      'Open Applications and find myHRFH.',
      'Move the myHRFH web app to the Trash.',
      'Empty the Trash when appropriate.'
    ];
  } else {
    steps = [
      'Open your browser’s installed-apps page or your device application settings.',
      'Find myHRFH and choose Uninstall myHRFH, Uninstall, or Remove.',
      'Confirm the removal.'
    ];
  }

  setManagementContent('Uninstall myHRFH', copy, steps);
  showManagementDialog();
}

function renderAndroidFallback() {
  resetInstalledActions();
  installButton.hidden = true;
  platformContent.innerHTML = `
    <p><strong>Add the HRFH web app.</strong><br>Use your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
  `;
  setStatus();
}

function renderDesktopFallback() {
  resetInstalledActions();
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
  resetInstalledActions();
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

  platformContent.innerHTML = '<p><strong>Checking this device…</strong><br>Confirming the best available setup.</p>';
  setStatus('Checking this device…');

  const installationState = await getInstallationState();
  if (installationState === 'installed') {
    setInstalledState('HRFH web app is already installed.');
    return;
  }

  if (deferredInstallPrompt || await waitForInstallPrompt()) {
    renderInstallReady();
    return;
  }

  setStatus();
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

restoreShortcutButton?.addEventListener('click', showShortcutHelp);
uninstallButton?.addEventListener('click', showUninstallHelp);
managementClose?.addEventListener('click', closeManagementDialog);
managementDone?.addEventListener('click', closeManagementDialog);
managementDialog?.addEventListener('click', (event) => {
  if (event.target === managementDialog) {
    closeManagementDialog();
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
      setStatus('Install support could not be initialized. Refresh and try again.');
    });
  }
});

void renderInitialState();
