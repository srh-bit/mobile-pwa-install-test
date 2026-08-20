(() => {
  'use strict';

  const GUIDANCE_REVISION = 'ios-final-guidance-v1';

  const modal = document.getElementById('ios-install-modal');
  const toolbarGuide = document.getElementById('ios-toolbar-guide');
  const sheet = modal?.querySelector('.ios-install-sheet');
  const guideSteps = modal?.querySelector('.ios-guide-steps');
  const modalTitle = document.getElementById('ios-modal-title');
  const modalCopy = document.getElementById('ios-modal-copy');
  const modalNote = document.getElementById('ios-modal-note');
  const shareCue = document.getElementById('ios-share-cue');
  const browserActions = document.getElementById('ios-browser-actions');
  const installButton = document.getElementById('install-button');
  const platformContent = document.getElementById('platform-content');
  const modalDismiss = document.getElementById('ios-modal-dismiss');

  if (!modal || !toolbarGuide || !sheet || !guideSteps || !modalNote) {
    return;
  }

  function ua() {
    return navigator.userAgent || '';
  }

  function isIPad() {
    return /iPad/i.test(ua()) || (/Macintosh/i.test(ua()) && navigator.maxTouchPoints > 1);
  }

  function isIOS() {
    return /iPhone|iPad|iPod/i.test(ua()) || isIPad();
  }

  function isIOSChrome() {
    return isIOS() && /CriOS/i.test(ua());
  }

  function isIOSSafari() {
    return isIOS() && /Safari/i.test(ua()) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua());
  }

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function isLandscape() {
    return window.matchMedia('(orientation: landscape)').matches;
  }

  function shareSymbol(extraClass = '') {
    return `<span class="ios-symbol-shell ios-share-symbol ${extraClass}" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M12 3v11" />
        <path d="m8.25 6.75 3.75-3.75 3.75 3.75" />
        <path d="M7.25 10H5.8A1.8 1.8 0 0 0 4 11.8v6.4A1.8 1.8 0 0 0 5.8 20h12.4a1.8 1.8 0 0 0 1.8-1.8v-6.4a1.8 1.8 0 0 0-1.8-1.8h-1.45" />
      </svg>
    </span>`;
  }

  function moreSymbol(extraClass = '') {
    return `<span class="ios-symbol-shell ios-more-symbol ${extraClass}" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <circle cx="5" cy="12" r="1.65" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.65" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1.65" fill="currentColor" stroke="none" />
      </svg>
    </span>`;
  }

  function addHomeSymbol(extraClass = '') {
    return `<span class="ios-symbol-shell ios-add-home-symbol ${extraClass}" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <rect x="4.5" y="4.5" width="15" height="15" rx="3.2" />
        <path d="M12 8.5v7" />
        <path d="M8.5 12h7" />
      </svg>
    </span>`;
  }

  function guidanceProfile() {
    if (!isIOS()) return null;

    if (isIOSSafari()) {
      if (isIPad()) {
        return {
          key: 'safari-ipad',
          browser: 'Safari',
          edge: 'top-right',
          showMoreAlternative: false,
          stepOne: 'Tap Share.',
          note: 'Choose Add to Home Screen, keep Open as Web App on when shown, then tap Add.'
        };
      }

      return {
        key: 'safari-phone',
        browser: 'Safari',
        edge: 'bottom-region',
        showMoreAlternative: true,
        stepOne: 'Tap Share. If Share is not visible, tap More (…) then Share.',
        note: 'Choose Add to Home Screen, keep Open as Web App on when shown, then tap Add.'
      };
    }

    if (isIOSChrome()) {
      if (isIPad() || isLandscape()) {
        return {
          key: isIPad() ? 'chrome-ipad' : 'chrome-landscape',
          browser: 'Chrome',
          edge: 'top-right',
          showMoreAlternative: false,
          stepOne: 'Tap Share beside the address bar.',
          note: 'Choose Add to Home Screen, then tap Add.'
        };
      }

      return {
        key: 'chrome-phone-portrait',
        browser: 'Chrome',
        edge: null,
        showMoreAlternative: false,
        stepOne: 'Tap Share beside the address bar. Chrome may place the address bar at the top or bottom.',
        note: 'Choose Add to Home Screen, then tap Add.'
      };
    }

    return {
      key: 'ios-other',
      browser: 'Browser',
      edge: null,
      showMoreAlternative: false,
      stepOne: 'Open the browser Share menu.',
      note: 'Choose Add to Home Screen, then tap Add.'
    };
  }

  function buildStepOne(profile) {
    const alternate = profile.showMoreAlternative
      ? `<span class="ios-final-or">or</span>${moreSymbol('ios-final-secondary-symbol')}`
      : '';

    return `
      <div class="ios-guide-step ios-final-step">
        <span class="ios-guide-number" aria-hidden="true">1</span>
        <span class="ios-final-symbols">${shareSymbol('ios-final-primary-symbol')}${alternate}</span>
        <span class="ios-final-step-copy">${profile.stepOne}</span>
      </div>`;
  }

  function buildStepTwo() {
    return `
      <div class="ios-guide-step ios-final-step">
        <span class="ios-guide-number" aria-hidden="true">2</span>
        <span class="ios-final-symbols">${addHomeSymbol('ios-final-primary-symbol')}</span>
        <span class="ios-final-step-copy">Add to Home Screen</span>
      </div>`;
  }

  function buildRecoveryDetails(profile) {
    if (!profile.key.startsWith('safari')) return '';

    return `
      <details class="ios-final-recovery">
        <summary>Can't find Add to Home Screen?</summary>
        <p>Scroll to the bottom of the Share sheet, tap <strong>Edit Actions</strong>, then add <strong>Add to Home Screen</strong>.</p>
      </details>`;
  }

  function buildEdgeGuide(profile) {
    toolbarGuide.innerHTML = '';
    toolbarGuide.hidden = !profile.edge;
    if (!profile.edge) return;

    const safariPhone = profile.key === 'safari-phone';
    toolbarGuide.innerHTML = `
      <div class="ios-final-edge-guide ios-final-${profile.edge}">
        <span class="ios-final-edge-icons">
          ${shareSymbol('ios-final-edge-symbol')}
          ${safariPhone ? moreSymbol('ios-final-edge-symbol ios-final-edge-more') : ''}
        </span>
        <span class="ios-final-edge-label">${safariPhone ? 'Share or More' : 'Share'}</span>
      </div>`;
  }

  function clearGeneratedContent() {
    sheet.querySelector('.ios-final-recovery')?.remove();
    toolbarGuide.innerHTML = '';
    toolbarGuide.hidden = true;
  }

  function renderCurrentBrowserFlow() {
    if (!isIOS() || isStandalone()) return;

    const profile = guidanceProfile();
    if (!profile) return;

    clearGeneratedContent();
    modal.classList.add('ios-v2-active', 'ios-v3-active', 'ios-v4-active');

    if (installButton) {
      installButton.hidden = false;
      installButton.textContent = 'Show install steps';
    }

    if (platformContent) {
      platformContent.innerHTML = '<p><strong>Add the HRFH web app in two quick steps.</strong></p>';
    }

    if (modalTitle) modalTitle.textContent = 'Add HRFH web app';
    if (modalCopy) {
      modalCopy.textContent = profile.browser === 'Safari' && profile.showMoreAlternative
        ? 'Tap Share, or More (…) then Share, and choose Add to Home Screen.'
        : 'Tap Share, then choose Add to Home Screen.';
    }

    if (shareCue) shareCue.hidden = true;
    if (browserActions) browserActions.hidden = true;

    guideSteps.innerHTML = `${buildStepOne(profile)}${buildStepTwo()}`;
    modalNote.innerHTML = profile.note
      .replace('Add to Home Screen', '<strong>Add to Home Screen</strong>')
      .replace('Open as Web App', '<strong>Open as Web App</strong>')
      .replace('Add.', '<strong>Add</strong>.');
    modalNote.insertAdjacentHTML('afterend', buildRecoveryDetails(profile));
    buildEdgeGuide(profile);

    modal.dataset.iosGuidanceRevision = GUIDANCE_REVISION;
    modal.dataset.iosGuidanceProfile = profile.key;
    modal.hidden = false;
    document.body.classList.add('ios-modal-open');

    requestAnimationFrame(() => {
      modal.classList.add('is-visible');
      modalDismiss?.focus({ preventScroll: true });
    });
  }

  let frame = null;
  function scheduleRender() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = null;
      if (!modal.hidden) renderCurrentBrowserFlow();
    });
  }

  installButton?.addEventListener('click', (event) => {
    if (!isIOS() || isStandalone()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    renderCurrentBrowserFlow();
  }, true);

  const modalObserver = new MutationObserver(() => {
    if (!modal.hidden) scheduleRender();
  });
  modalObserver.observe(modal, { attributes: true, attributeFilter: ['hidden'] });

  window.addEventListener('orientationchange', scheduleRender, { passive: true });
  window.addEventListener('resize', scheduleRender, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleRender, { passive: true });

  if (isIOS() && !isStandalone()) {
    renderCurrentBrowserFlow();
  }
})();