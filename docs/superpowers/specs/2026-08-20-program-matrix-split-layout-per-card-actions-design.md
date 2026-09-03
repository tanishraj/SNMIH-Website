# Program Matrix Split Layout And Per-Card Actions Design

## Goal

Extend Program Matrix with a stacked or split section composition and replace its block-wide
programme-action presentation with one optional, independently configured action per card.

The split composition places the complete section introduction beside the matrix. Editors can put
the introduction on either the left or right. Cards remain static article surfaces; only their
visible Link or Button action is interactive.

This specification supersedes the narrower action-authoring scope in
`2026-08-20-program-matrix-card-actions-design.md` for future Program Matrix changes. Historical
documents remain unchanged.

## Scope

The change is limited to Program Matrix:

- add Stacked and Split section layouts;
- add Left and Right introduction positions for Split;
- add one optional shared action inside each programme card;
- remove superseded legacy link and block-wide programme-action controls from the visible Admin;
- preserve existing saved content without a destructive migration;
- update rendering, generated types, tests, documentation, and the block thumbnail.

Section actions and footer actions remain independent and unchanged. The matrix retains its
existing semantic surfaces, icons, typography, dividers, item limits, and server-rendered behavior.

## Payload Authoring Contract

### Section layout

Program Matrix adds these Theme Settings fields:

- `headerLayout`: **Stacked** or **Split**, defaulting to `stacked`;
- `headerPosition`: **Left** or **Right**, defaulting to `left` and shown only when
  `headerLayout` is `split`.

The existing `contentAlignment` field continues to control alignment inside the introduction. It
does not determine which side of the split contains the introduction.

`stacked` remains the runtime fallback for missing or invalid legacy layout values. `left` remains
the runtime fallback for missing or invalid split-position values.

### Card action

Each `items` row adds an optional `cardAction` array with a maximum of one row using the shared
content-action field contract. Its Content tab contains:

- `label`: required when an action row exists;
- `linkType`: Page or Custom URL;
- `page`: conditional Page relationship;
- `url`: conditional custom URL;
- `openInNewTab`: optional checkbox.

Its Theme Settings tab contains:

- `mode`: Link or Button, defaulting to Link;
- `variant`: shared semantic button variant, shown only for Button;
- `showArrow`: shown only for Button.

The action array itself is optional. A card without an action row renders no action and reserves no
action space.

### Superseded controls

New content no longer exposes these item-level destination fields directly:

- `linkType`;
- `page`;
- `url`;
- `openInNewTab`.

New content also no longer exposes these block-level programme-action controls:

- `actionMode`;
- `actionVariant`;
- `itemActionLabel`.

These fields remain registered as hidden legacy fields so Payload continues to read existing saved
values. Keeping them in the schema is required for non-destructive compatibility; merely teaching
the renderer about removed keys would not guarantee that Payload returns those keys after the
schema changes.

## Action Resolution And Compatibility

For each card, the renderer resolves actions in this order:

1. Use the first valid `cardAction` row.
2. When no valid new action exists, resolve the hidden legacy item destination together with the
   hidden block-level label, mode, and button variant.
3. When neither contract produces a valid destination and non-empty label, render no action.

A new action is valid only when it has a non-empty label and a resolved Page or Custom URL
destination. Incomplete actions fail closed without empty wrappers, reserved spacing, or inert
controls.

Legacy fallbacks preserve the current behavior:

- unset or invalid legacy mode becomes Link;
- an empty legacy label becomes `Learn More`;
- Page destinations use the hierarchical Page URL helper;
- Custom URLs are trimmed;
- new-tab behavior includes safe relationship attributes.

The new action takes precedence whenever it is valid. An incomplete new action does not erase a
valid legacy action at read time. No automatic database migration or save-time rewrite is included.

## Interaction Contract

- Only the visible action is interactive.
- The card remains an `article` and is never wrapped in an anchor.
- Link mode renders the shared `ContentLink` treatment.
- Button mode renders the shared Button treatment and selected semantic variant.
- `showArrow` affects Button mode only.
- Actions stay at the bottom of cards with content above them, keeping rows visually aligned.
- Cards without actions do not gain hover, pointer, or focus affordances that imply clickability.
- Section and footer actions keep their existing independent behavior.

This avoids nested interactive elements and makes every destination explicit to keyboard, touch,
and assistive-technology users.

## Layout And Responsive Behavior

### Stacked

Stacked preserves the current composition:

1. section introduction;
2. matrix;
3. footer actions.

The introduction retains its current readable maximum width and Left or Center content alignment.

### Split

At the large breakpoint, Split uses a 40/60 editorial grid:

- the introduction occupies the smaller two-fifths column;
- the matrix occupies the larger three-fifths column;
- a deliberate large gap separates the two content groups;
- Left places the introduction before the matrix;
- Right places the matrix on the left and the introduction on the right.

The matrix keeps its existing seamless frame, one column below the medium breakpoint, and two equal
columns from the medium breakpoint upward, including inside the larger Split column. Long titles
and descriptions wrap naturally; no card content is truncated. The introduction aligns to the top
of the matrix and must not become sticky.

Below the large breakpoint, both Split positions collapse to the same semantic order:

1. introduction;
2. matrix;
3. footer actions.

The introduction remains first in document and focus order for both desktop positions. Right
position changes only the desktop visual column placement; section actions therefore remain before
card actions in keyboard order, matching the section's semantic hierarchy.

## Rendering Structure

`ProgramMatrixBlockComponent` remains a server component. Its implementation separates three
responsibilities:

1. normalize layout and alignment values;
2. resolve new and legacy card actions into one internal action shape;
3. render the introduction, matrix, and footer through the selected composition.

The resolved per-card action shape contains:

- `href`;
- `label`;
- `mode`;
- `openInNewTab`;
- `showArrow`;
- `variant`.

The existing card-surface resolver continues to own foreground, supporting copy, divider, icon,
link, and button contrast. The feature adds no hard-coded SNMIH colors or manual dark-mode
exceptions.

## Error And Edge-Case Behavior

- Missing section title or no valid programme items keeps the current empty-block behavior.
- Missing or invalid icons remain omitted without a fallback icon.
- Invalid `headerLayout` falls back to Stacked.
- Invalid `headerPosition` falls back to Left.
- Invalid action modes fall back to Link.
- Invalid button variants fall back to the shared Default variant.
- Missing destinations or labels produce no action.
- One, odd, or even item counts retain correct outer and internal dividers.
- Long action labels wrap without stretching the entire card into a click target.

## Accessibility

- The introduction remains before the matrix in semantic reading order.
- Each card remains an `article` with its existing `h3` title.
- Only actual anchors or buttons receive focus.
- Shared controls retain visible focus treatment and accessible link names.
- New-tab anchors retain safe `rel` values.
- No interaction depends on hover.
- Decorative icons remain hidden from assistive technology.

## Preview And Documentation

Update the Program Matrix fixture to demonstrate:

- Split with the introduction on the left;
- at least one Link action;
- at least one Button action;
- at least one card without an action.

Regenerate the Program Matrix thumbnail after the renderer and fixture change.

Update the maintained block guide and feature inventory to describe Split positioning and optional
per-card Link or Button actions. Update project-context narrative only where the generated update
or final impact review shows the Program Matrix behavior is documented there.

## Testing

Focused schema and rendering tests must cover:

- `headerLayout` options, default, and invalid-value fallback;
- conditional `headerPosition`, its options, default, and invalid-value fallback;
- Stacked rendering;
- Split Left and Split Right desktop placement;
- introduction-first compact and semantic order;
- optional `cardAction` with a maximum of one row;
- independent Link and Button actions across cards;
- Button variants and arrow behavior;
- internal Page and Custom URL resolution;
- new-tab safety;
- incomplete new actions;
- no-action cards without empty wrappers;
- non-clickable card surfaces;
- new-action precedence over legacy fields;
- legacy destination, label, mode, and variant fallback;
- semantic card-surface contrast;
- generated Payload types;
- production/live-preview registration parity;
- updated fixture and thumbnail catalogs.

After implementation, run type generation, the focused Program Matrix and shared action tests,
registration/live-preview/thumbnail/theme contracts, targeted lint and type checking, the Program
Matrix thumbnail generator, and the required project-context update/check loop.

## Out Of Scope

- Whole-card links or click handlers;
- more than one action per card;
- a database migration that rewrites legacy actions;
- changes to Program Grid or Academic Programmes;
- matrix filtering, search, pagination, or client-side state;
- sticky split introductions;
- new color tokens or SNMIH-specific component styling.
