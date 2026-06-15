# Command Results

Date: 2026-06-14

## Build Checks

- `npm run lint`: PASS.
- `npm run build`: PASS.

## Preview

- Existing `localhost:3000` preview was restarted after the build.
- Active preview: `http://localhost:3000`.

## Browser Fallback

Browser/IAB control tools were not callable in this turn, so rendered validation used system Chrome headless via Chrome DevTools Protocol and Chrome CLI.

## Automation Outputs

- DOM/runtime/interaction/media results: `evidence/round13_nav_results.json`.
- CLI screenshot batch results: `evidence/round13_cli_screenshot_results.json`.
- Screenshot directory: `evidence/screenshots/`.

## Notes

- CDP matrix passed after fixing the PWA banner overflow.
- Chrome CLI initially timed out on `/globe` 1440x900 but a single retry succeeded and wrote `nav-globe-1440x900.png`.
- `/globe` emits a WebGL context creation error in headless Chrome; this is recorded as a Round 14 follow-up blocker.
