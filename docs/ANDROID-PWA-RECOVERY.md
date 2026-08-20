# Android PWA recovery

The Android release model is browser-only PWA installation. No APK/TWA/native wrapper is shipped.

## What the browser can know

On supported Android Chrome, `navigator.getInstalledRelatedApps()` can confirm whether this self-related PWA is installed. The manifest contains a `webapp` entry pointing back to its own manifest so the page can perform that check from within the PWA scope.

A successful matching result means the PWA is installed. A successful empty result on Android means the related PWA is not installed and stale fallback receipt state can be discarded. Unsupported/error states remain unknown and may fall back to the local install receipt.

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
