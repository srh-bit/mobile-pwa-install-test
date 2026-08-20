const MYHRFH_URL = 'https://myhrfh.com';

const installButton = document.getElementById('install-button');
const openButton = document.getElementById('open-button');
const platformContent = document.getElementById('platform-content');
const statusMessage = document.getElementById('status-message');
const card = document.querySelector('.install-card');

let deferredInstallPrompt = null;

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIOS() {
  const ua = navigator.userAgent || '';
  const classicIOS = /iPad|iPhone|iPod/.test(ua);
  const desktopModeIPad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return classicIOS || desktopModeIPad;
}

function isIOSSafari() {
  const ua = navigator.userAgent || '';
  return isIOS() && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
}

function setStatus(message = '') {
  statusMessage.textContent = message;
}

function setInstalledState(message = 'myHRFH was added to your Home Screen.') {
  deferredInstallPrompt = null;
  installButton.hidden = true;
  card.classList.add('installed');
  openButton.textContent = 'Open myHRFH';
  openButton.href = MYHRFH_URL;
  platformContent.innerHTML = `
    <p><strong>${message}</strong><br>Tap the myHRFH icon from your Home Screen anytime for one-tap access.</p>
  `;
}

function renderIOSInstructions() {
  installButton.hidden = true;
  const safariLead = isIOSSafari()
    ? 'Add myHRFH in three quick steps:'
    : 'Open this page in Safari first, then follow these steps:';

  platformContent.innerHTML = `
    <p class="platform-lead">${safariLead}</p>
    <ol class="install-steps">
      <li class="install-step">
        <span class="step-number">1</span>
        <span class="step-copy"><strong>Tap Share</strong><span>Use Safari's Share button.</span></span>
      </li>
      <li class="install-step">
        <span class="step-number">2</span>
        <span class="step-copy"><strong>Add to Home Screen</strong><span>Select Add to Home Screen in the Share sheet.</span></span>
      </li>
      <li class="install-step">
        <span class="step-number">3</span>
        <span class="step-copy"><strong>Tap Add</strong><span>Keep Open as Web App enabled if Safari offers it.</span></span>
      </li>
    </ol>
  `;

  setStatus(isIOSSafari() ? 'Ready to add myHRFH.' : 'Safari is required to add the iPhone or iPad shortcut.');
}

function renderFallback() {
  platformContent.innerHTML = `
    <p><strong>Add myHRFH from your browser menu.</strong><br>On Android, choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
  `;
  installButton.hidden = true;
  setStatus('You can also open myHRFH directly below.');
}

function renderInitialState() {
  openButton.href = MYHRFH_URL;

  if (isStandalone()) {
    window.location.replace(MYHRFH_URL);
    return;
  }

  if (isIOS()) {
    renderIOSInstructions();
    return;
  }

  renderFallback();
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
  platformContent.innerHTML = `
    <p><strong>Your phone is ready.</strong><br>Tap <strong>Add to Home Screen</strong> below, then confirm the browser prompt.</p>
  `;
  setStatus('One more tap and myHRFH will be on your Home Screen.');
});

installButton.addEventListener('click', async () => {
  if (!deferredInstallPrompt) {
    renderFallback();
    return;
  }

  installButton.disabled = true;
  setStatus('Opening your browser’s install prompt…');

  try {
    await deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setStatus('Great — your phone is finishing the setup.');
    } else {
      setStatus('Setup cancelled. You can add myHRFH whenever you’re ready.');
    }
  } finally {
    deferredInstallPrompt = null;
    installButton.disabled = false;
    installButton.hidden = true;
  }
});

window.addEventListener('appinstalled', () => {
  setInstalledState();
  setStatus('Added successfully. Launch myHRFH from your Home Screen.');
});

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      setStatus('The page is ready, but offline support could not be registered.');
    });
  }
});

renderInitialState();
