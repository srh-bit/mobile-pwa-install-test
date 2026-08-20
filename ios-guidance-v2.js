(() => {
  'use strict';

  const GUIDANCE_REVISION = 'ios-guidance-v2';
  const modal = document.getElementById('ios-install-modal');
  const toolbarGuide = document.getElementById('ios-toolbar-guide');
  const sheet = modal?.querySelector('.ios-install-sheet');
  const guideSteps = modal?.querySelector('.ios-guide-steps');
  const stepOne = document.getElementById('ios-guide-step-one');
  const stepTwo = document.getElementById('ios-guide-step-two');
  const modalCopy = document.getElementById('ios-modal-copy');
  const modalNote = document.getElementById('ios-modal-note');
  const shareCue = document.getElementById('ios-share-cue');
  const browserActions = document.getElementById('ios-browser-actions');

  if (!modal || !toolbarGuide || !sheet || !guideSteps) {
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

  function isChrome() {
    return isIOS() && /CriOS/i.test(ua());
  }

  function isSafari() {
    return isIOS() && /Safari/i.test(ua()) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua());
  }

  function isLandscape() {
    return window.matchMedia('(orientation: landscape)').matches;
  }

  function guidanceProfile() {
    if (!isIOS()) {
      return null;
    }

    if (isSafari()) {
      if (isIPad()) {
        return {
          key: 'safari-ipad',
          browser: 'Safari',
          confidence: 'exact',
          edge: 'top-right',
          stepOne: 'Tap Share',
          hint: 'Share is at the top right of Safari.',
          toolbar: 'top'
        };
      }

      return {
        key: 'safari-phone',
        browser: 'Safari',
        confidence: 'region',
        edge: 'bottom-region',
        stepOne: 'Tap Share, or More → Share',
        hint: 'Use Share in the bottom toolbar. If Share is not visible, tap More (…) → Share.',
        toolbar: 'bottom'
      };
    }

    if (isChrome()) {
      if (isIPad()) {
        return {
          key: 'chrome-ipad',
          browser: 'Chrome',
          confidence: 'exact',
          edge: 'top-right',
          stepOne: 'Tap Share',
          hint: 'Share is to the right of your address bar.',
          toolbar: 'top'
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
          toolbar: 'top'
        };
      }

      return {
        key: 'chrome-phone-portrait',
        browser: 'Chrome',
        confidence: 'region',
        edge: null,
        stepOne: 'Tap Share beside your address bar',
        hint: 'Share is beside your address bar. Chrome can place the address bar at the top or bottom.',
        toolbar: 'adaptive'
      };
    }

    return {
      key: 'ios-other',
      browser: 'Browser',
      confidence: 'region',
      edge: null,
      stepOne: 'Open Share',
      hint: 'Open your browser Share menu, then choose Add to Home Screen.',
      toolbar: 'adaptive'
    };
  }

  function shareGlyph() {
    return '<span class="ios-v2-share-icon" aria-hidden="true"><span>↑</span></span>';
  }

  function buildToolbarPreview(profile) {
    if (profile.key === 'safari-phone') {
      return `
        <div class="ios-v2-toolbar-preview ios-v2-toolbar-safari" data-guidance-profile="${profile.key}">
          <div class="ios-v2-toolbar-caption">Safari toolbar</div>
          <div class="ios-v2-toolbar-row">
            <span class="ios-v2-tool-muted">‹</span>
            ${shareGlyph()}
            <span class="ios-v2-tool-muted">▢</span>
            <span class="ios-v2-more">…</span>
          </div>
          <p>${profile.hint}</p>
        </div>`;
    }

    if (profile.browser === 'Chrome') {
      return `
        <div class="ios-v2-toolbar-preview ios-v2-toolbar-chrome" data-guidance-profile="${profile.key}">
          <div class="ios-v2-toolbar-caption">Chrome address bar</div>
          <div class="ios-v2-address-row">
            <span class="ios-v2-address-pill">myhrfh.com</span>
            ${shareGlyph()}
          </div>
          <p>${profile.hint}</p>
        </div>`;
    }

    if (profile.key === 'safari-ipad') {
      return `
        <div class="ios-v2-toolbar-preview ios-v2-toolbar-safari" data-guidance-profile="${profile.key}">
          <div class="ios-v2-toolbar-caption">Safari toolbar</div>
          <div class="ios-v2-address-row">
            <span class="ios-v2-address-pill">myhrfh.com</span>
            ${shareGlyph()}
          </div>
          <p>${profile.hint}</p>
        </div>`;
    }

    return `
      <div class="ios-v2-toolbar-preview" data-guidance-profile="${profile.key}">
        <div class="ios-v2-toolbar-caption">Browser Share</div>
        <div class="ios-v2-address-row">
          <span class="ios-v2-address-pill">myhrfh.com</span>
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
      <details class="ios-v2-recovery">
        <summary>Can't find Add to Home Screen?</summary>
        <p>Scroll to the bottom of the Share sheet, tap <strong>Edit Actions</strong>, then add <strong>Add to Home Screen</strong>.</p>
      </details>`;
  }

  function buildEdgeGuide(profile) {
    if (!profile.edge) {
      toolbarGuide.hidden = true;
      toolbarGuide.innerHTML = '';
      return;
    }

    toolbarGuide.hidden = false;
    const label = profile.key === 'safari-phone' ? 'Share / More' : 'Share';
    const direction = profile.edge === 'bottom-region' ? '↓' : '↑';
    toolbarGuide.innerHTML = `
      <div class="ios-v2-edge-guide ios-v2-${profile.edge}" data-confidence="${profile.confidence}">
        <span class="ios-v2-edge-label">${label}</span>
        <span class="ios-v2-edge-arrow" aria-hidden="true">${direction}</span>
      </div>`;
  }

  function clearProfileClasses() {
    for (const className of [...modal.classList]) {
      if (className.startsWith('ios-v2-')) {
        modal.classList.remove(className);
      }
    }
  }

  function enhanceIOSGuidance() {
    if (!isIOS() || modal.hidden || shareCue?.hidden || browserActions?.hidden === false) {
      return;
    }

    const profile = guidanceProfile();
    if (!profile) {
      return;
    }

    clearProfileClasses();
    modal.classList.add('ios-v2-active', `ios-v2-${profile.key}`, `ios-v2-${profile.confidence}`);
    if (profile.edge === 'top-right') {
      modal.classList.add('ios-v2-exact-top-right');
    }

    const oldPreview = sheet.querySelector('.ios-v2-toolbar-preview');
    oldPreview?.remove();
    const oldRecovery = sheet.querySelector('.ios-v2-recovery');
    oldRecovery?.remove();

    guideSteps.insertAdjacentHTML('afterend', buildToolbarPreview(profile));
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
        modalCopy.textContent = profile.key === 'safari-phone'
          ? 'Use Safari Share, then Add to Home Screen.'
          : 'Tap Share, then Add to Home Screen.';
      }
      if (modalNote) {
        modalNote.innerHTML = 'Choose <strong>Add to Home Screen</strong>, keep <strong>Open as Web App</strong> on, then tap <strong>Add</strong>.';
      }
    } else if (profile.browser === 'Chrome') {
      if (modalCopy) {
        modalCopy.textContent = 'Tap Share beside the address bar, then Add to Home Screen.';
      }
      if (modalNote) {
        modalNote.innerHTML = 'In the Share sheet, choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.';
      }
    }

    modal.dataset.iosGuidanceRevision = GUIDANCE_REVISION;
    modal.dataset.iosGuidanceProfile = profile.key;
    modal.dataset.iosGuidanceConfidence = profile.confidence;
  }

  let frame = null;
  function scheduleEnhancement() {
    if (frame !== null) {
      cancelAnimationFrame(frame);
    }
    frame = requestAnimationFrame(() => {
      frame = null;
      enhanceIOSGuidance();
    });
  }

  const modalObserver = new MutationObserver(scheduleEnhancement);
  modalObserver.observe(modal, { attributes: true, attributeFilter: ['class', 'hidden'] });
  if (shareCue) {
    modalObserver.observe(shareCue, { attributes: true, attributeFilter: ['hidden'] });
  }
  if (browserActions) {
    modalObserver.observe(browserActions, { attributes: true, attributeFilter: ['hidden'] });
  }

  window.addEventListener('orientationchange', scheduleEnhancement, { passive: true });
  window.addEventListener('resize', scheduleEnhancement, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleEnhancement, { passive: true });

  scheduleEnhancement();
})();
