(() => {
  'use strict';

  const GUIDANCE_REVISION = 'ios-guidance-v3';
  const CALIBRATION_SESSION_KEY = 'myhrfh-ios-install-calibration-v1';

  const modal = document.getElementById('ios-install-modal');
  const toolbarGuide = document.getElementById('ios-toolbar-guide');
  const sheet = modal?.querySelector('.ios-install-sheet');
  const guideSteps = modal?.querySelector('.ios-guide-steps');
  const stepOne = document.getElementById('ios-guide-step-one');
  const stepTwo = document.getElementById('ios-guide-step-two');
  const modalTitle = document.getElementById('ios-modal-title');
  const modalCopy = document.getElementById('ios-modal-copy');
  const modalNote = document.getElementById('ios-modal-note');
  const shareCue = document.getElementById('ios-share-cue');
  const shareLabel = document.getElementById('ios-share-label');
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

  function currentBrowserName() {
    if (isIOSChrome()) return 'Chrome';
    if (isIOSSafari()) return 'Safari';
    return 'this browser';
  }

  function showModal() {
    if (!isIOS() || isStandalone()) {
      return;
    }

    modal.hidden = false;
    document.body.classList.add('ios-modal-open');
    requestAnimationFrame(() => {
      modal.classList.add('is-visible');
      modalDismiss?.focus({ preventScroll: true });
    });
  }

  function renderCurrentBrowserFlow() {
    if (!isIOS() || isStandalone()) {
      return;
    }

    const browser = currentBrowserName();
    const safari = isIOSSafari();
    const chrome = isIOSChrome();

    if (installButton) {
      installButton.hidden = false;
      installButton.textContent = 'Show install steps';
    }

    if (platformContent) {
      platformContent.innerHTML = `
        <p><strong>Add the HRFH web app in two quick steps.</strong><br>Stay in ${browser}; no browser switch is required.</p>
      `;
    }

    if (modalTitle) {
      modalTitle.textContent = 'Add HRFH web app';
    }

    if (modalCopy) {
      modalCopy.textContent = safari
        ? 'Use Safari Share, then Add to Home Screen.'
        : chrome
          ? 'Use Chrome Share, then Add to Home Screen.'
          : 'Use this browser’s Share menu, then Add to Home Screen.';
    }

    if (shareLabel) {
      shareLabel.textContent = safari ? 'Safari Share' : chrome ? 'Chrome Share' : 'Browser Share';
    }

    if (shareCue) {
      shareCue.hidden = true;
    }

    if (browserActions) {
      browserActions.hidden = true;
    }

    modalNote.innerHTML = safari
      ? 'Choose <strong>Add to Home Screen</strong>, keep <strong>Open as Web App</strong> on when shown, then tap <strong>Add</strong>.'
      : 'Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.';

    showModal();
  }

  function readCalibrationMap() {
    try {
      const raw = window.sessionStorage.getItem(CALIBRATION_SESSION_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function readCalibration(kind) {
    return readCalibrationMap()[kind] || null;
  }

  function writeCalibration(kind, value) {
    try {
      const map = readCalibrationMap();
      map[kind] = value;
      window.sessionStorage.setItem(CALIBRATION_SESSION_KEY, JSON.stringify(map));
    } catch {
      // Session storage can be unavailable; the guide remains usable without persistence.
    }
  }

  function clearCalibration(kind) {
    try {
      const map = readCalibrationMap();
      delete map[kind];
      if (Object.keys(map).length === 0) {
        window.sessionStorage.removeItem(CALIBRATION_SESSION_KEY);
      } else {
        window.sessionStorage.setItem(CALIBRATION_SESSION_KEY, JSON.stringify(map));
      }
    } catch {
      // Ignore storage restrictions and show the calibration choice again.
    }
  }

  function guidanceProfile() {
    if (!isIOS()) {
      return null;
    }

    if (isIOSSafari()) {
      if (isIPad()) {
        return {
          key: 'safari-ipad',
          browser: 'Safari',
          confidence: 'exact',
          edge: 'top-right',
          stepOne: 'Tap Share',
          hint: 'Share is at the top right of Safari.',
          toolbar: 'top',
          calibrationKind: null
        };
      }

      return {
        key: 'safari-phone',
        browser: 'Safari',
        confidence: 'region',
        edge: null,
        stepOne: 'Use Safari Share',
        hint: 'Safari can expose Share directly or place it behind More (…).',
        toolbar: 'adaptive',
        calibrationKind: 'safari-control'
      };
    }

    if (isIOSChrome()) {
      if (isIPad()) {
        return {
          key: 'chrome-ipad',
          browser: 'Chrome',
          confidence: 'exact',
          edge: 'top-right',
          stepOne: 'Tap Share',
          hint: 'Share is to the right of your address bar.',
          toolbar: 'top',
          calibrationKind: null
        };
      }

      if (isLandscape()) {
        return {
          key: 'chrome-landscape',
          browser: 'Chrome',
          confidence: 'exact',
          edge: 'top-right',
          stepOne: 'Tap Share',
          hint: 'Share is to the right of your address bar.',
          toolbar: 'top',
          calibrationKind: null
        };
      }

      return {
        key: 'chrome-phone-portrait',
        browser: 'Chrome',
        confidence: 'region',
        edge: null,
        stepOne: 'Use Chrome Share',
        hint: 'Chrome can place the address bar at the top or bottom.',
        toolbar: 'adaptive',
        calibrationKind: 'chrome-address-bar'
      };
    }

    return {
      key: 'ios-other',
      browser: 'Browser',
      confidence: 'region',
      edge: null,
      stepOne: 'Open Share',
      hint: 'Open this browser’s Share menu, then choose Add to Home Screen.',
      toolbar: 'adaptive',
      calibrationKind: null
    };
  }

  function needsCalibration(profile) {
    return Boolean(profile?.calibrationKind && !readCalibration(profile.calibrationKind));
  }

  function applyCalibration(profile) {
    if (!profile?.calibrationKind) {
      return profile;
    }

    const value = readCalibration(profile.calibrationKind);
    if (!value) {
      return profile;
    }

    if (profile.calibrationKind === 'chrome-address-bar') {
      if (value === 'top') {
        return {
          ...profile,
          key: 'chrome-address-top',
          confidence: 'exact',
          edge: 'top-right',
          stepOne: 'Tap Share beside the address bar',
          hint: 'Share is beside the address bar at the top of Chrome.',
          toolbar: 'top'
        };
      }

      if (value === 'bottom') {
        return {
          ...profile,
          key: 'chrome-address-bottom',
          confidence: 'exact',
          edge: 'bottom-right',
          stepOne: 'Tap Share beside the address bar',
          hint: 'Share is beside the address bar at the bottom of Chrome.',
          toolbar: 'bottom'
        };
      }
    }

    if (profile.calibrationKind === 'safari-control') {
      if (value === 'share') {
        return {
          ...profile,
          key: 'safari-control-share',
          confidence: 'region',
          edge: 'bottom-region',
          stepOne: 'Tap Share',
          hint: 'Use the Share control in Safari’s toolbar.',
          toolbar: 'bottom'
        };
      }

      if (value === 'more') {
        return {
          ...profile,
          key: 'safari-control-more',
          confidence: 'region',
          edge: 'bottom-region',
          stepOne: 'Tap More (…) → Share',
          hint: 'Open More (…) in Safari, then choose Share.',
          toolbar: 'bottom'
        };
      }
    }

    return profile;
  }

  function buildCalibration(profile) {
    if (profile.calibrationKind === 'chrome-address-bar') {
      return `
        <div class="ios-v3-calibration" data-calibration-kind="chrome-address-bar" role="group" aria-label="Chrome address bar position">
          <p class="ios-v3-calibration-title">Where is your Chrome address bar?</p>
          <p class="ios-v3-calibration-copy">One tap lets us point to the correct Share area.</p>
          <div class="ios-v3-calibration-options">
            <button class="ios-v3-calibration-option" type="button" data-calibration-value="top">Top</button>
            <button class="ios-v3-calibration-option" type="button" data-calibration-value="bottom">Bottom</button>
          </div>
        </div>`;
    }

    if (profile.calibrationKind === 'safari-control') {
      return `
        <div class="ios-v3-calibration" data-calibration-kind="safari-control" role="group" aria-label="Safari Share control">
          <p class="ios-v3-calibration-title">What do you see in Safari?</p>
          <p class="ios-v3-calibration-copy">Choose the control visible in your toolbar.</p>
          <div class="ios-v3-calibration-options">
            <button class="ios-v3-calibration-option" type="button" data-calibration-value="share">Share</button>
            <button class="ios-v3-calibration-option" type="button" data-calibration-value="more">More (…)</button>
          </div>
        </div>`;
    }

    return '';
  }

  function shareGlyph(active = true) {
    return `<span class="ios-v3-share-icon${active ? ' ios-v3-control-active' : ''}" aria-hidden="true">↑</span>`;
  }

  function moreGlyph(active = true) {
    return `<span class="ios-v3-more-icon${active ? ' ios-v3-control-active' : ''}" aria-hidden="true">…</span>`;
  }

  function buildToolbarPreview(profile) {
    if (profile.browser === 'Chrome') {
      const bottom = profile.toolbar === 'bottom';
      return `
        <div class="ios-v2-toolbar-preview ios-v3-coachmark" data-guidance-profile="${profile.key}">
          <div class="ios-v3-coachmark-caption">Chrome ${bottom ? 'bottom' : 'top'} bar</div>
          <div class="ios-v3-address-row">
            <span class="ios-v3-address-pill">srh-bit.github.io</span>
            ${shareGlyph()}
          </div>
          <p>${profile.hint}</p>
        </div>`;
    }

    if (profile.browser === 'Safari') {
      const useMore = profile.key === 'safari-control-more';
      return `
        <div class="ios-v2-toolbar-preview ios-v3-coachmark" data-guidance-profile="${profile.key}">
          <div class="ios-v3-coachmark-caption">Safari toolbar</div>
          <div class="ios-v3-toolbar-row">
            <span class="ios-v2-tool-muted">‹</span>
            ${shareGlyph(!useMore)}
            <span class="ios-v2-tool-muted">▢</span>
            ${moreGlyph(useMore)}
          </div>
          <p>${profile.hint}</p>
        </div>`;
    }

    return `
      <div class="ios-v2-toolbar-preview ios-v3-coachmark" data-guidance-profile="${profile.key}">
        <div class="ios-v3-coachmark-caption">Browser Share</div>
        <div class="ios-v3-address-row">
          <span class="ios-v3-address-pill">HRFH installer</span>
          ${shareGlyph()}
        </div>
        <p>${profile.hint}</p>
      </div>`;
  }

  function buildRecoveryDetails(profile) {
    if (!profile.key.startsWith('safari')) {
      return '';
    }

    return `
      <details class="ios-v2-recovery ios-v3-recovery">
        <summary>Can't find Add to Home Screen?</summary>
        <p>Scroll to the bottom of the Share sheet, tap <strong>Edit Actions</strong>, then add <strong>Add to Home Screen</strong>.</p>
      </details>`;
  }

  function buildChangeControl(profile) {
    if (!profile.calibrationKind || !readCalibration(profile.calibrationKind)) {
      return '';
    }

    return `<button class="ios-v3-change-calibration" type="button" data-change-calibration="${profile.calibrationKind}">Change toolbar setting</button>`;
  }

  function buildEdgeGuide(profile) {
    if (!profile.edge) {
      toolbarGuide.hidden = true;
      toolbarGuide.innerHTML = '';
      return;
    }

    toolbarGuide.hidden = false;
    const label = profile.key === 'safari-control-more' ? 'More (…) → Share' : 'Share';
    const direction = profile.edge === 'top-right' ? '↑' : '↓';
    toolbarGuide.innerHTML = `
      <div class="ios-v3-edge-guide ios-v3-${profile.edge}" data-confidence="${profile.confidence}">
        <span class="ios-v3-edge-label">${label}</span>
        <span class="ios-v3-edge-arrow" aria-hidden="true">${direction}</span>
      </div>`;
  }

  function clearProfileClasses() {
    for (const className of [...modal.classList]) {
      if (className.startsWith('ios-v2-') || className.startsWith('ios-v3-')) {
        modal.classList.remove(className);
      }
    }
  }

  function removeEnhancedElements() {
    sheet.querySelector('.ios-v3-calibration')?.remove();
    sheet.querySelector('.ios-v2-toolbar-preview')?.remove();
    sheet.querySelector('.ios-v3-change-calibration')?.remove();
    sheet.querySelector('.ios-v2-recovery')?.remove();
    toolbarGuide.hidden = true;
    toolbarGuide.innerHTML = '';
  }

  function isEnhancementIntact(profile, calibrating) {
    if (calibrating) {
      const calibration = sheet.querySelector('.ios-v3-calibration');
      return Boolean(calibration?.dataset.calibrationKind === profile.calibrationKind);
    }

    const preview = sheet.querySelector('.ios-v2-toolbar-preview');
    if (!preview || preview.dataset.guidanceProfile !== profile.key || stepOne?.textContent !== profile.stepOne) {
      return false;
    }

    if (profile.browser === 'Safari') {
      return modalNote.textContent.includes('Open as Web App');
    }

    return true;
  }

  let applying = false;
  let lastSignature = '';

  function enhanceIOSGuidance() {
    if (applying || !isIOS() || isStandalone() || modal.hidden) {
      return;
    }

    const baseProfile = guidanceProfile();
    if (!baseProfile) {
      return;
    }

    const calibrating = needsCalibration(baseProfile);
    const profile = calibrating ? baseProfile : applyCalibration(baseProfile);
    const signature = calibrating
      ? `calibrate|${profile.key}|${profile.calibrationKind}`
      : `${profile.key}|${profile.confidence}|${profile.edge || 'none'}`;

    if (signature === lastSignature && isEnhancementIntact(profile, calibrating)) {
      return;
    }

    applying = true;
    try {
      clearProfileClasses();
      removeEnhancedElements();
      modal.classList.add('ios-v2-active', 'ios-v3-active', `ios-v2-${profile.key}`, `ios-v2-${profile.confidence}`);

      if (calibrating) {
        modal.classList.add('ios-v3-calibrating');
        guideSteps.insertAdjacentHTML('afterend', buildCalibration(profile));
        toolbarGuide.hidden = true;
        if (modalCopy) {
          modalCopy.textContent = 'One quick check so we can point to the right browser control.';
        }
        modalNote.textContent = 'This choice is used only for this browser session.';
      } else {
        guideSteps.insertAdjacentHTML('afterend', buildToolbarPreview(profile));
        sheet.querySelector('.ios-v2-toolbar-preview')?.insertAdjacentHTML('afterend', buildChangeControl(profile));
        modalNote.insertAdjacentHTML('afterend', buildRecoveryDetails(profile));
        buildEdgeGuide(profile);

        if (stepOne) {
          stepOne.textContent = profile.stepOne;
        }
        if (stepTwo) {
          stepTwo.textContent = 'Add to Home Screen';
        }

        if (profile.browser === 'Safari') {
          if (modalCopy) {
            modalCopy.textContent = profile.key === 'safari-control-more'
              ? 'Open More, tap Share, then Add to Home Screen.'
              : 'Tap Share, then Add to Home Screen.';
          }
          modalNote.innerHTML = 'Choose <strong>Add to Home Screen</strong>, keep <strong>Open as Web App</strong> on when shown, then tap <strong>Add</strong>.';
        } else if (profile.browser === 'Chrome') {
          if (modalCopy) {
            modalCopy.textContent = 'Tap Share beside the address bar, then Add to Home Screen.';
          }
          modalNote.innerHTML = 'In the Share sheet, choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.';
        }
      }

      modal.dataset.iosGuidanceRevision = GUIDANCE_REVISION;
      modal.dataset.iosGuidanceProfile = profile.key;
      modal.dataset.iosGuidanceConfidence = profile.confidence;
      lastSignature = signature;
    } finally {
      applying = false;
    }
  }

  let frame = null;
  function scheduleEnhancement() {
    if (applying) {
      return;
    }
    if (frame !== null) {
      cancelAnimationFrame(frame);
    }
    frame = requestAnimationFrame(() => {
      frame = null;
      enhanceIOSGuidance();
    });
  }

  sheet.addEventListener('click', (event) => {
    const calibrationButton = event.target.closest('[data-calibration-value]');
    if (calibrationButton) {
      const calibration = calibrationButton.closest('[data-calibration-kind]');
      const kind = calibration?.dataset.calibrationKind;
      const value = calibrationButton.dataset.calibrationValue;
      if (kind && value) {
        writeCalibration(kind, value);
        lastSignature = '';
        scheduleEnhancement();
      }
      return;
    }

    const changeButton = event.target.closest('[data-change-calibration]');
    if (changeButton) {
      clearCalibration(changeButton.dataset.changeCalibration);
      lastSignature = '';
      scheduleEnhancement();
    }
  });

  installButton?.addEventListener('click', (event) => {
    if (!isIOS() || isStandalone()) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    renderCurrentBrowserFlow();
    lastSignature = '';
    scheduleEnhancement();
  }, true);

  const modalObserver = new MutationObserver(scheduleEnhancement);
  modalObserver.observe(modal, { attributes: true, attributeFilter: ['hidden'] });

  window.addEventListener('orientationchange', () => {
    lastSignature = '';
    scheduleEnhancement();
  }, { passive: true });
  window.addEventListener('resize', scheduleEnhancement, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleEnhancement, { passive: true });

  if (isIOS() && !isStandalone()) {
    renderCurrentBrowserFlow();
    scheduleEnhancement();
  }
})();
