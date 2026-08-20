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

function setInstalledState(message = 'HRFH web app added.') {
  deferredInstallPrompt = null;
  installButton.hidden = true;
  card.classList.add('installed');
  openButton.textContent = 'Open myHRFH';
  openButton.href = MYHRFH_URL;
  platformContent.innerHTML = `
    <p><strong>${message}</strong><br>Open it from your home screen anytime.</p>
  `;
}

function renderIOSInstructions() {
  installButton.hidden = true;

  if (!isIOSSafari()) {
    platformContent.innerHTML = `
      <p><strong>Open this page in Safari.</strong><br>Safari is required to add the HRFH web app to your home screen.</p>
    `;
    setStatus('Open Safari to continue.');
    return;
  }

  platformContent.innerHTML = `
    <p class="platform-lead">Add the HRFH web app in two quick steps.</p>
    <ol class="install-steps">
      <li class="install-step">
        <span class="step-number">1</span>
        <span class="step-copy"><strong>Tap Share</strong><span>Use Safari's Share button.</span></span>
      </li>
      <li class="install-step">
        <span class="step-number">2</span>
        <span class="step-copy"><strong>Add to Home Screen</strong><span>Choose Add to Home Screen, then tap Add.</span></span>
      </li>
    </ol>
  `;
  setStatus();
}

function renderFallback() {
  platformContent.innerHTML = `
    <p><strong>Add the HRFH web app.</strong><br>Use your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
  `;
  installButton.hidden = true;
  setStatus();
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
    <p><strong>Ready to add.</strong><br>Install the HRFH web app for quick access from your home screen.</p>
  `;
  setStatus();
});

installButton.addEventListener('click', async () => {
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

window.addEventListener('appinstalled', () => {
  setInstalledState();
  setStatus('Added successfully.');
});

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      setStatus('Offline support is unavailable.');
    });
  }
});

renderInitialState();
