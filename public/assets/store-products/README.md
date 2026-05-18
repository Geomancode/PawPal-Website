# Store Product Assets

Production-ready product images for the PawPal Store.

## Structure

- `current/` contains the approved assets used by the website/app catalog.
- `versions/2026-05-18-photo-led/` preserves the approved photo-led export set.
- `manifest.json` records the active version and replacement policy.
- `current/manifest.json` lists stable public paths for catalog integration.

## Replacement Workflow

For a quick image swap, replace the matching file under `current/<product>/` with the same filename and dimensions when possible.

For a full refresh, add a new folder under `versions/<date-or-slug>/`, review it, then update `manifest.json` and copy the approved files into `current/`.

Original uploaded photos for this set are archived at `design/assets/source/store-products/2026-05-18-raw/`.
