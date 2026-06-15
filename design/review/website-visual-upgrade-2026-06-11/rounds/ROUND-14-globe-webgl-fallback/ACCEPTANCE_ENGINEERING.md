# Engineering Acceptance

Round: 14 Globe WebGL Fallback Hardening  
Reviewer: Engineering Lead / McClintock  
Status: 有条件通过

## Engineering Scope

Engineering owns implementation boundaries, maintainability, runtime safety, lifecycle cleanup, and source-risk review.

## Evidence Reviewed

- `IMPLEMENTATION_RECORD.md`
- `evidence/COMMAND_RESULTS.md`
- `evidence/round14_cdp_matrix.json`
- `src/components/GlobeFullPage.tsx`
- `src/components/GlobeStaticPreview.tsx`
- `src/app/globals.css`

## Engineering Findings

- WebGL precheck is route-local and happens before MapLibre construction.
- MapLibre construction is protected by `try/catch`.
- MapLibre `error` events that look like WebGL/context/canvas/GPU failures now become fallback state.
- Map cleanup remains in the effect cleanup path.
- Fallback rendering hides map-dependent controls.
- `GlobeStaticPreview` changes are backward-compatible because all new props are optional and defaults preserve existing behavior.
- No dependencies, package files, APIs, auth, database, payment, deployment, or environment files were changed.

## Engineering Decision

有条件通过.

Conditions:

- Owner: Engineering / McClintock
- Target follow-up round: Round 15
- Required follow-up: Harden MapLibre live-map lifecycle by explicitly canceling RAF loops, adding removed guards to spin/inertia animation paths, and covering post-init `webglcontextlost` / `webglcontextcreationerror` canvas event paths.

- Owner: Engineering / McClintock, with QA consulted
- Target follow-up round: Round 15
- Required follow-up: Add post-init failure validation proving that a live map created first and then losing context enters the route-local fallback without global app error or runaway runtime/console errors.

These conditions do not block Round 14 because the Round 13 initialization-failure blocker is resolved, but they block final real-market engineering signoff.
