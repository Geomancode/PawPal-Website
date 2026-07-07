# Website Tokens

The website token layer is mapped from the App `PawPalNextTokens` and
`PawPalColors` definitions:

- `/Users/nuemann/Desktop/GeoPet/PawPal/lib/next_ui/theme/next_ui_theme.dart`
- `/Users/nuemann/Desktop/GeoPet/PawPal/lib/core/theme/pawpal_tokens.dart`

`src/app/globals.css` is the source of truth for website CSS variables. It
defines light values in `:root`, dark values in `@media (prefers-color-scheme:
dark)`, and Tailwind v4 utility mappings in `@theme`.

## Color Roles

Use the semantic `paw-*` roles in UI code:

- Solid tones: `paw-primary`, `paw-green`, `paw-trust`, `paw-accent`,
  `paw-yellow`, `paw-warning`, `paw-critical`, `paw-danger`.
- Soft surfaces: `paw-primary-soft`, `paw-green-soft`, `paw-trust-soft`,
  `paw-accent-soft`, `paw-warning-soft`, `paw-critical-soft`,
  `paw-danger-soft`.
- Solid foregrounds: `paw-on-primary`, `paw-on-green`, `paw-on-trust`,
  `paw-on-accent`, `paw-on-warning`, `paw-on-critical`, `paw-on-danger`.
- Soft foregrounds: `paw-on-primary-soft`, `paw-on-green-soft`,
  `paw-on-trust-soft`, `paw-on-accent-soft`, `paw-on-warning-soft`,
  `paw-on-critical-soft`, `paw-on-danger-soft`.

When text or icons sit on a soft tone, use the matching `on-*-soft` foreground.
For example:

```tsx
<span className="bg-paw-warning-soft text-paw-on-warning-soft">
  Demo fallback
</span>
```

The global stylesheet also protects older combinations such as
`bg-paw-warning-soft text-paw-warning` by remapping them to the App `on*Soft`
foreground variables.

## Shape, Spacing, Type, Depth

The App primitive ladders are exposed as CSS variables and Tailwind utilities:

- Spacing: `paw-xxs` through `paw-xxxl`, plus `paw-min-tap`.
- Radius: `paw-xs`, `paw-sm`, `paw-md`, `paw-lg`, `paw-xl`, `paw-pill`,
  `paw-sheet`, `paw-next-card`.
- Type: `text-paw-type-display`, `text-paw-type-h1`, `text-paw-type-h2`,
  `text-paw-type-h3`, `text-paw-type-body`, `text-paw-type-caption`,
  `text-paw-type-metric`.
- Motion and depth: `duration-paw-fast`, `duration-paw-normal`,
  `duration-paw-slow`, `shadow-paw-strong`, `shadow-paw-control`,
  `shadow-paw-panel`, `shadow-paw-floating`.

Do not add new page-local hex values for PawPal brand tones. Add or adjust the
global token first, then consume it through CSS variables or Tailwind classes.
