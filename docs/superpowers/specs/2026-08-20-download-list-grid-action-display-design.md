# Download List Grid Action Display Design

## Goal

Allow editors to convert every Boxed Card, Open Grid, and Framed Grid document action from its
labelled treatment to an accessible icon-only control without restoring per-action visual complexity.

## Authoring contract

Add one block-level `gridActionDisplay` select under Theme Settings:

- **Labelled** (`labelled`) — saved and runtime default.
- **Icon only** (`icons`).

Label the field **Grid Action Display**. Show it only when Display Mode is Boxed Card Grid, Open Grid,
or Framed Grid. Inline List remains icon-only and does not use this setting. Missing, null, or invalid
values resolve to `labelled`, preserving existing content.

Do not add separate View/Download controls, per-document appearance fields, custom icon selectors, or
new label controls.

## Presentation behavior

Labelled mode retains the current boxed-family contract:

- View/Link: underlined labelled link without an icon.
- Download: labelled button with the animated trailing ArrowDown.

Icon-only mode renders both action kinds with the existing compact icon-button treatment:

- View/Link: Eye icon.
- Download: animated ArrowDown icon.

Each icon-only anchor uses the resolved action label as its `aria-label` and native `title`. Automatic
actions therefore announce **View Document** and **Download**. Manual actions announce their required
manual label. Download anchors retain the `download` attribute; View new-tab target and rel behavior
remain unchanged. Keyboard focus, hover motion, semantic theme colors, and touch-target sizing reuse
the current Inline icon-action implementation.

## Data flow

Payload produces `gridActionDisplay?: 'labelled' | 'icons' | null`. The server component applies the
`labelled` fallback and passes the value through `DownloadListClient` to `DownloadListPresentation`.
`GridPresentation` passes the resolved display to `DocumentActions`; Inline always requests its fixed
icon-only layout independently.

No content migration is required. Generated Payload types, the block fixture, operator documentation,
feature inventory, block-system reference, and focused schema/rendering tests must reflect the field.
The existing thumbnail remains Labelled and therefore continues to demonstrate the default.

## Verification

- Schema tests cover the two options, `labelled` default, and grid-only condition.
- Rendering tests cover automatic and manual icon-only names, Eye/ArrowDown icons, animation, and
  download/new-tab semantics.
- Labelled grid and fixed Inline behavior remain covered.
- Payload types, TypeScript, ESLint, Prettier, thumbnail contracts, and project-context checks pass.
