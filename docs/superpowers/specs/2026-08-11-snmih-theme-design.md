# SNMIH Website Theme Design

## Objective

Add SNMIH as an independent website theme preset using the exact light- and dark-mode design tokens supplied by the project owner. The preset must be selectable from Payload Theme Settings without changing any existing theme.

## Scope

The change will:

- add `snmih` to the shared website-theme registry with the label `SNMIH`
- add a dedicated `theme-snmih.css` preset
- import that preset from the global stylesheet
- update generated Payload theme typings if required by the checked-in generated types
- add focused coverage for registration, CSS import, scoped selectors, and the supplied token contract

The change will not:

- modify Default, Sunset, Blue, or Kodama
- replace the active default theme
- introduce component-specific CSS overrides
- change fonts, spacing, shadows, or interaction behavior beyond the supplied tokens
- commit or stage files

## Theme Contract

The supplied tokens are the source of truth and will be copied without visual reinterpretation.

The light token block will be scoped as:

```css
:root[data-theme-color='snmih'] {
  /* supplied light tokens */
}
```

The dark token block will be scoped as:

```css
:root[data-theme-color='snmih'].dark {
  /* supplied dark tokens */
}
```

This preserves the project's existing root-element convention and prevents SNMIH values from leaking into other themes.

The supplied `--radius: 0` value will be preserved exactly. Components that consume the shared radius tokens will therefore use square corners when SNMIH is selected. No component-level rounding exceptions will be added.

## Integration

`src/lib/themes/websiteThemes.ts` remains the single registry shared by Payload Theme Settings and frontend runtime validation. Adding `{ label: 'SNMIH', value: 'snmih' }` makes the preset selectable and valid without duplicating options elsewhere.

`src/styles/globals.css` will import the dedicated preset alongside the existing theme stylesheets. Runtime selection will continue to be expressed through `data-theme-color` on the root HTML element.

Because the project checks in Payload-generated types, the `themeColor` union will include `snmih` so the generated contract agrees with the registry.

## Validation

Focused tests will verify that:

- the registry exposes the SNMIH option
- `snmih` passes runtime theme validation
- the global stylesheet imports `theme-snmih.css`
- the stylesheet uses only SNMIH-scoped light and dark selectors
- representative and structurally important supplied tokens are present, including both primary colors and `--radius: 0`
- existing theme registrations remain available

After focused tests and lint/type checks, a production build will be run when the local environment provides the services and variables required by the application build.

## Rollback

The theme is isolated. It can be removed by deleting its stylesheet, import, registry entry, generated type member, and focused assertions. No existing preset needs to be reconstructed.
