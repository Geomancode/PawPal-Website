# Command Results

Round: 14 Globe WebGL Fallback Hardening  
Date: 2026-06-14

## Build Checks

`npm run lint`

Result: PASS

`npm run build`

Result: PASS

Build output included a successful Next.js 16.1.6 production build, TypeScript pass, and generation of 26 static app pages including `/globe`.

## Preview

Production preview restarted on:

`http://localhost:3000`

## Browser/IAB Check

Flow under test:

`/globe` -> normal WebGL-capable render -> compact nav and live map shell remain visible without global error.

Result: PASS

Captured facts from Browser/IAB at 1280x720:

- URL: `http://localhost:3000/globe`
- Title: `Live Pet Globe | PawPal`
- Global app error panel: false
- Framework overlay text: false
- Fallback visible in normal path: false
- Map container present: true
- Navbar present: true
- Horizontal overflow: false
- Browser dev logs: no relevant errors/warnings

## Chrome/CDP Matrix

Evidence file:

`evidence/round14_cdp_matrix.json`

Result: 9/9 PASS

Validated cases:

- WebGL-unavailable `/globe`: 390x844, 768x1024, 1280x720, 1440x900
- Normal `/globe`: 390x844, 1280x720
- Cross-route smoke: `/`, `/store`, `/help` at 390x844

Key assertions:

- No global `PawPal could not load this page` panel.
- No framework overlay text.
- No horizontal overflow.
- Navbar present.
- Fallback visible when WebGL is unavailable.
- Normal `/globe` still has the map container when WebGL is available.
- Fallback actions are present with safe targets.
- Mobile fallback actions are 44px high.

## Console/Event Notes

CDP captured a small number of install-banner informational entries:

`Banner not shown: beforeinstallpromptevent.preventDefault() called...`

These are browser/PWA informational logs and are not related to the Round 14 fallback path. No app exception or framework overlay event was recorded in the passing matrix.

Chrome CLI also emitted macOS/headless Chrome updater and display-link warnings during one supplemental delayed screenshot. Those warnings came from the browser process, not from the PawPal app runtime.
