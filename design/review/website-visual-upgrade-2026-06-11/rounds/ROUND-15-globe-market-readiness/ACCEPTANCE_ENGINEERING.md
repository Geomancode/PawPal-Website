# Engineering Acceptance - Round 15

Owner: Engineering Lead

## Boundary

Engineering owns runtime safety, code ownership, lifecycle correctness, build health, and implementation maintainability. Engineering does not approve product value or visual taste except where they create technical risk.

## Review Checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| MapLibre startup failure is recoverable | `hasUsableWebGL`, constructor `try/catch`, fallback state | PASS |
| Post-init context loss is recoverable | Canvas listeners for `webglcontextlost` and `webglcontextcreationerror`; `post-init-context-loss` matrix case | PASS |
| RAF loops are guarded and canceled | `active`, `mapRef.current === map`, `animationFrames`, cleanup cancellation | PASS |
| Wheel RAF is guarded | `requestGuardedFrame` wrapper around wheel zoom RAF | PASS |
| Async map-touching paths are ownership-guarded | Geolocation callbacks, `style.load`, drag/zoom/spin handlers, and ChatBottomSheet marker/flyTo paths recheck current map ownership | PASS |
| Map cleanup tolerates context failure teardown | guarded `map.remove()` try/catch | PASS |
| Build/lint health | `npm run lint`, `npm run build` | PASS |
| Evidence is repeatable | `evidence/round15_cdp_verify.js` | PASS |

## Engineering Result

PASS for Round 15. The live map failure path is now recoverable before and after MapLibre initialization, with bounded animation cleanup.
