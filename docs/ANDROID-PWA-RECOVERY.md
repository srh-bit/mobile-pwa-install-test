# Android PWA recovery

The Android release model is browser-only PWA installation. No APK/TWA/native wrapper is shipped.

## What the browser can know

On supported Android Chrome, `navigator.getInstalledRelatedApps()` can confirm whether this self-related PWA is installed. The manifest contains a `webapp` entry pointing back to its own manifest so the page can perform that check from within the PWA scope.

A successful matching result means the PWA is installed. A successful empty result on Android means the related PWA is not installed and stale fallback receipt state can be discarded. Unsupported/error states remain unknown and may fall back to the local install receipt.

## Chromium installability prerequisite

The custom Install button depends on Chromium first accepting the page as an installable PWA and delivering `beforeinstallprompt`. A missing button can therefore be caused by PWA installability, not only controller state.

A regression in the launcher PNG binaries caused current Chrome to report `no-acceptable-icon`, preventing `beforeinstallprompt` on both Android and Desktop. The accepted launcher binaries from Android duplicate-prevention head `337a6b1acdb611c7ee5698c0598696fb2ed35260` are the current runtime assets. The manifest exposes them as 192x192 and 512x512 PNG icons with `purpose: any`.

CI now launches real Chromium and requires DevTools `Page.getInstallabilityErrors` to return no errors. This is a browser-level guard in addition to static manifest and PNG checks.

## What the browser cannot know

The web platform does not expose Android's launcher/Home Screen icon inventory. The installer therefore cannot distinguish:

- PWA installed and Home Screen icon present; from
- PWA installed but Home Screen icon manually removed.

It must not claim otherwise.

## Installed experience

The Android installed state is intentionally minimal:

- **Open HRFH web app**
- **Reinstall**
- confirmation: **The myHRFH icon was added to your Home Screen.**

There is no Restore or Uninstall control on Android. If a user later removes only the Home Screen icon while keeping the PWA installed, recovery is handled directly through the Android launcher/app list rather than through this installer.

## Duplicate-install prevention

Positive installed evidence is checked before the page exposes another install action. `beforeinstallprompt` by itself never deletes positive evidence. On Android Chrome where the self-related-app probe succeeds, an empty result is allowed to clear a stale receipt so a genuinely removed PWA can be installed again.

Cache identity `myhrfh-installer-v11` deliberately replaces the v10 shell so devices that cached the rejected launcher assets receive the accepted binaries and manifest.
