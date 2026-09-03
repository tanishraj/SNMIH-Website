# Website Theme Registry Design

## Goal

Refactor the website-only theme system so new shadcn-compatible themes can be added in a controlled, repeatable way while remaining editable through the existing Payload `Theme Settings` global.

The outcome should be:

- one source of truth for website theme definitions
- one Payload admin control for selecting the active website theme
- one runtime validation path for applying the selected theme on the frontend
- a stable contract for adding future theme token files

## Approved Direction

- scope is website only, not Payload admin theming
- theme selection remains in the existing Payload `theme-settings` global
- use an explicit code registry, not filesystem auto-discovery
- keep the current CSS-variable theme model
- make future shadcn-based themes pluggable through one registry entry plus one CSS file

## Current Problems

### Duplicated theme definitions

Theme names are currently hardcoded in multiple places:

- `src/globals/ThemeSettings.ts`
- `src/app/(frontend)/layout.tsx`

This creates drift risk and makes each new theme a multi-file edit.

### Runtime validation is local and brittle

The frontend layout defines its own allowed theme set. That duplicates what Payload already exposes in the admin UI.

### Theme extensibility is implicit, not designed

The project already uses CSS custom properties for themes, but there is no formal module that defines:

- which themes exist
- what label each theme should show in Payload
- which theme keys are valid at runtime

### Legacy compatibility logic is embedded in runtime

`layout.tsx` currently contains `amber -> sera` mapping logic. That kind of migration compatibility should be minimized and isolated.

## In Scope

- central website theme registry module
- deriving Payload theme select options from that registry
- deriving frontend runtime validation from that registry
- documenting the contract for new website themes
- light/dark compatibility within each theme file
- small cleanup of theme fallback logic where it directly affects extensibility

## Out of Scope

- theming the Payload admin UI
- replacing the CSS-variable theme model
- redesigning the theme settings UI
- auto-discovering themes from the filesystem
- changing block schemas as part of this refactor
- redesigning existing themes beyond what is required for consistent registry behavior

## Proposed Architecture

### Central registry

Add a module:

- `src/lib/themes/websiteThemes.ts`

It will export:

- a typed list of website themes
- `websiteThemeOptions` for Payload select fields
- `websiteThemeValues` for validation and utility use
- `isWebsiteTheme(value)` runtime guard
- `defaultWebsiteTheme` constant

Each theme entry should contain:

- `value`: stable persisted key, e.g. `default`, `blue`, `sera`
- `label`: admin-facing label

No file path metadata is required in the first pass because CSS imports remain centralized in `src/styles/globals.css`.

### Payload integration

`src/globals/ThemeSettings.ts` should stop hardcoding select options and instead import `websiteThemeOptions`.

This keeps the admin panel aligned with the registry automatically.

### Frontend integration

`src/app/(frontend)/layout.tsx` should stop hardcoding `validThemeColors` and instead validate with the shared registry helper.

The layout should:

- read the saved theme value from Payload
- normalize only if a temporary compatibility alias still needs to be supported
- fall back to `defaultWebsiteTheme` when invalid
- continue applying `data-theme-color` to the root html element

### Theme CSS contract

Theme CSS files remain under:

- `src/styles/themes/`

Each theme file must provide a complete semantic token set for:

- light mode
- dark mode

Expected tokens include:

- `--background`
- `--foreground`
- `--card`
- `--card-foreground`
- `--popover`
- `--popover-foreground`
- `--primary`
- `--primary-foreground`
- `--secondary`
- `--secondary-foreground`
- `--muted`
- `--muted-foreground`
- `--accent`
- `--accent-foreground`
- `--border`
- `--input`
- `--ring`
- `--sidebar-*`
- `--radius`

This contract keeps components theme-portable as long as they use semantic Tailwind classes instead of fixed colors.

## Data Flow

1. Editor selects a theme in Payload `Theme Settings`
2. Payload stores the theme key
3. Frontend layout reads `theme-settings`
4. Layout validates the theme key through `isWebsiteTheme`
5. Layout applies `data-theme-color="<theme>"`
6. Imported theme CSS selectors activate the correct token set
7. Website components respond through semantic token-based classes

## Migration and Compatibility

### Existing content

Existing saved theme values for:

- `default`
- `blue`
- `sera`

must remain valid.

### Legacy alias

If `amber` exists only as historical compatibility, keep the alias mapping only if real stored data still depends on it. Otherwise remove it as part of cleanup.

The preferred state is no compatibility alias in the steady-state runtime path.

## Implementation Notes

### Files to change

- `src/lib/themes/websiteThemes.ts` (new)
- `src/globals/ThemeSettings.ts`
- `src/app/(frontend)/layout.tsx`

Optional follow-up:

- add a short comment in the registry file documenting how to add a new website theme

### Adding a new theme after this refactor

The intended workflow becomes:

1. create `src/styles/themes/theme-<name>.css`
2. import that file in `src/styles/globals.css`
3. add one entry in `src/lib/themes/websiteThemes.ts`

No additional edits should be needed in Payload schema or frontend validation.

## Testing Expectations

Verification should cover:

- Theme Settings select still renders valid options
- frontend layout applies only valid website theme keys
- invalid stored values fall back to the default theme safely
- existing themes still work in light and dark modes
- touched files pass lint and type checks

## Success Criteria

The refactor is complete when:

- theme definitions live in one shared registry
- Payload admin options are generated from that registry
- frontend runtime validation uses that same registry
- adding a new website theme requires only one CSS file import and one registry entry
- the website theme system remains isolated from Payload admin styling

## Risks

### Risk: saved historical values do not match new registry keys

Mitigation:

- keep a narrow compatibility alias only where real data requires it
- otherwise remove compatibility logic during cleanup

### Risk: components still contain fixed visual styles

Mitigation:

- keep this refactor focused on theme plumbing
- treat remaining component-level visual drift as a separate normalization pass unless it blocks theme correctness
