# 0001. A PWA, not a native app

**Status:** accepted · November 2026

## Context

The app has to live on the phones of 2–4 people, some on iPhone, some on Android.
I'm a frontend developer, React and TypeScript every day. Swift and Kotlin — not really.

## Options

- **Native iOS + Android.** Best feel, but two codebases, stores, reviews, a paid Apple
  developer account. Overkill for a home shopping list.
- **React Native / Expo.** One codebase, but still builds, stores and its own component
  ecosystem. Time to the first working screen is noticeably longer.
- **PWA.** A regular website that installs to the home screen. Shipping is just
  a deploy. Downsides: iOS is limited (no vibration, keyboard quirks, install only via
  "Share").

## Decision

A PWA on React + TypeScript + Vite, with `vite-plugin-pwa` for the manifest and the
service worker.

## Consequences

- Updates land right away, no stores.
- I'll have to deal with Safari on iPhone separately — keyboard, `100vh`, install flow.
  I have a feeling this will come back.
- No offline editing: only the app shell is cached.
