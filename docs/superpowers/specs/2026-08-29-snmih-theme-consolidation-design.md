# SNMIH Theme Consolidation Design

**Date:** 2026-08-29

## Objective

Reduce the website theme system to the two approved SNMIH palettes while preserving existing stored values and avoiding a content migration.

## Supported themes

The shared website theme registry will expose only:

| Stored value | Admin label | Purpose                      |
| ------------ | ----------- | ---------------------------- |
| `default`    | SNMIH-Green | Default and fallback palette |
| `snmih`      | SNMIH-Blue  | Alternate blue SNMIH palette |

The stored identifiers remain unchanged. This keeps existing documents, global settings, previews, and runtime attributes compatible while changing only the editor-facing names.

## Removed themes

The `sunset`, `blue`, and `kodama` presets will be removed from:

- the shared theme registry and Payload Appearance select;
- global CSS imports and the corresponding theme stylesheet files;
- generated Payload union types;
- active theme contract tests and maintained documentation.

Historical design specifications and implementation plans remain unchanged because they document work as it existed at that time.

## Runtime fallback

Only `default` and `snmih` are valid runtime theme values. A stale, retired, or otherwise invalid stored value resolves to `default`, which now represents SNMIH-Green.

The obsolete `amber` to `sera` compatibility conversion will be removed. It cannot produce a valid theme after consolidation and the common registry guard already provides the required fallback.

No database migration or automatic data rewrite is included. If an existing deployment has a retired value saved in Appearance, the public site remains usable through the SNMIH-Green fallback; saving Appearance again requires choosing one of the two supported values.

## CSS and visual behavior

The token contents of `theme-default.css` and `theme-snmih.css` remain unchanged. Therefore:

- SNMIH-Green keeps the current Default light and dark palettes;
- SNMIH-Blue keeps the current SNMIH light and dark palettes;
- semantic colors, radius behavior, block surfaces, and component contrast remain unchanged;
- unused theme CSS no longer ships in the global stylesheet.

## Payload and generated types

The Appearance global continues to consume `websiteThemeOptions` from the shared registry. Type generation updates `ThemeSettings.themeColor` to:

```ts
'default' | 'snmih'
```

No custom Admin component is needed.

## Verification

Verification will cover:

1. The registry exposes exactly the two stable stored values with the new labels.
2. Removed values fail the runtime theme guard and fall back to `default`.
3. Global CSS imports only the retained theme files.
4. Both retained themes retain isolated light and dark token blocks.
5. Both retained palettes continue passing semantic contrast and Calendar accent checks.
6. The Appearance field uses the shared two-option registry.
7. Generated types, formatting, TypeScript, linting, focused integration tests, and the project-context update/check loop pass.

## Out of scope

- Renaming stored values to `snmih-green` or `snmih-blue`.
- Migrating existing database records.
- Changing either retained palette's color tokens.
- Reworking the light/dark/system color-scheme control.
