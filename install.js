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

function setInstalledState(message = 'Test shortcut installed.') {
  deferredInstallPrompt = null;
  installButton.hidden = true;
  card.classList.add('installed');
  openButton.textContent = 'Continue to myHRFH';
  openButton.href = MYHRFH_URL;
  platformContent.innerHTML = `
    <p><strong>${message}</strong><br>The shortcut is installed. Launch it from your Home Screen to open myhrfh.com directly.</p>
  `;
}

function renderIOSInstructions() {
  installButton.hidden = true;
  const safariLead = isIOSSafari()
    ? 'Safari requires three quick taps:'
    : 'Open this page in Safari first, then use these three quick taps:';

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

  setStatus(isIOSSafari() ? 'Ready for the iPhone/iPad test.' : 'Safari is required for the iOS home-screen test.');
}

function renderFallback() {
  platformContent.innerHTML = `
    <p>Your browser has not exposed its install prompt yet. On Android, use Chrome's browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
  `;
  installButton.hidden = true;
  setStatus('You can still open myHRFH directly below.');
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
    <p><strong>Your browser is ready.</strong><br>Tap Install shortcut, confirm the browser prompt, and the test icon will be added to your phone.</p>
  `;
  setStatus('Android install prompt is available.');
});

installButton.addEventListener('click', async () => {
  if (!deferredInstallPrompt) {
    renderFallback();
    return;
  }

  installButton.disabled = true;
  setStatus('Opening the browser install prompt…');

  try {
    await deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setStatus('Install accepted. Your browser is finishing the shortcut setup.');
    } else {
      setStatus('Install cancelled. You can try again when the browser offers the prompt.');
    }
  } finally {
    deferredInstallPrompt = null;
    installButton.disabled = false;
    installButton.hidden = true;
  }
});

window.addEventListener('appinstalled', () => {
  setInstalledState('The test shortcut was installed successfully.');
  setStatus('Installed. Launch it from your Home Screen to open myHRFH directly.');
});

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      setStatus('Install page loaded, but offline support could not be registered.');
    });
  }
});

renderInitialState();
