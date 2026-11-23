# 0021. The app icon is chosen at install time

**Status:** accepted · November 2026

## Context

v0.11 added an icon picker to the settings. A web app can't change its Home Screen icon
by itself: an iPhone takes the icon only at "Add to Home Screen" in Safari, Android takes
it from the manifest at install time and on Chrome's scheduled check. That's why the
picker had a "Copy app link" button next to it: choose an icon in the installed app,
paste the link into Safari and install the app again.

On an iPhone the Home Screen app has its own storage, separate from Safari
([iOS notes](../ios-notes.md)). Safari doesn't see a choice made in the installed app, and
reinstalling without Google sign-in loses the home.

## Decision

The icon is chosen before installing, where it actually matters.

- The icon tiles (`features/choose-app-icon`) sit in the install card on the welcome
  screen, captioned "Choose an icon first: it can’t be changed after installing". If the
  browser can't install apps, there are no tiles.
- The settings keep the picker only when the app is open in a browser.
- The installed app has no picker on any platform. On Android Chrome may update the
  icon by itself, but this couldn't be confirmed on a device, so the picker is hidden
  everywhere.
- The "Copy app link" button is gone.
- "Installed" is `isStandalone()` in `shared/lib/device.ts` (`navigator.standalone` or
  `display-mode: standalone`); both the device label and the install card use it.

## Consequences

- Someone who has already installed the app can change the icon only by reinstalling
  from the browser. On an iPhone without Google sign-in that loses the home, and the UI
  no longer nudges people towards it.
- If Android turns out to update the icon by itself, the picker can come back to the
  installed app there only.
