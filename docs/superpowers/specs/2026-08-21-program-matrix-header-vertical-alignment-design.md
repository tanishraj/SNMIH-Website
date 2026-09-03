# Program Matrix Header Vertical Alignment Design

## Goal

Allow editors to vertically position the Program Matrix introduction at the top, center, or bottom
of its column when the block uses the Split section-header layout.

## Scope

This change extends the existing Program Matrix split layout with one presentation control. It does
not change the matrix cards, card actions, horizontal header position, content alignment, section
actions, footer actions, or compact stacking order.

## Payload Authoring Contract

Add one select field to Program Matrix Theme Settings:

- Name: `headerVerticalAlignment`
- Label: **Section Header Vertical Alignment**
- Options: **Top**, **Center**, and **Bottom**
- Stored values: `top`, `center`, and `bottom`
- Default: `top`
- Required: yes
- Visibility: shown only when `headerLayout` is `split`

The field belongs beside `headerPosition` because both controls describe the introduction column in
Split layout. The existing `headerPosition` condition can be reused conceptually, while each field
retains its own explicit Payload configuration.

## Rendering Contract

The renderer accepts `headerVerticalAlignment` and normalizes missing or invalid runtime values to
`top`.

In Split layout at the large breakpoint, apply alignment only to the introduction wrapper:

- `top` uses large-screen start alignment;
- `center` uses large-screen center alignment;
- `bottom` uses large-screen end alignment.

The matrix wrapper is not vertically repositioned. The outer split grid retains its existing 40/60
columns, gap, left/right placement, and start-aligned row behavior.

The introduction remains before the matrix in JSX and focus order. Right-side placement continues
to use visual grid positioning only.

## Responsive Behavior

The alignment setting takes effect only when both conditions are true:

1. `headerLayout` resolves to `split`;
2. the viewport is at the existing large breakpoint or wider.

Below the large breakpoint, Split continues to collapse into the normal introduction-then-matrix
stack. Stacked layout ignores the saved vertical-alignment value at every breakpoint. This prevents
center or bottom alignment from creating artificial space in normal document flow.

## Compatibility And Error Handling

Existing documents have no `headerVerticalAlignment` value and therefore render as Top, matching the
current split presentation. No data migration or save-time rewrite is required.

Invalid runtime values resolve to Top. A valid saved Center or Bottom value remains inert while the
block uses Stacked layout and becomes active again if the editor later switches back to Split.

## Admin And Accessibility

The conditional field removes irrelevant controls from Stacked authoring without deleting their
stored values. Vertical alignment changes presentation only; semantic hierarchy, reading order,
keyboard order, action targets, and accessible names remain unchanged.

## Preview And Documentation

Update the Program Matrix thumbnail fixture to use Center so the picker preview demonstrates the new
capability. Regenerate and visually inspect the 1600×900 Program Matrix JPEG for balanced alignment,
legible copy, intact dividers, and unclipped actions.

Update the block guide, feature inventory, and project-context block-system reference to state that
Split introductions support top, center, or bottom vertical positioning.

## Testing

Focused Program Matrix tests must cover:

- the field's options, required state, default, and Split-only Admin condition;
- Top as the default and invalid-value fallback;
- large-screen start, center, and end alignment classes in Split layout;
- absence of vertical-alignment classes in Stacked layout;
- unchanged introduction-before-matrix document order;
- generated Payload type coverage;
- updated fixture and documentation catalogs.

Run the focused Program Matrix suite, neighboring Page block/live-preview/thumbnail/theme contracts,
targeted lint and TypeScript validation, Payload type and import-map generation, the Program Matrix
thumbnail generator, and the project-context update/check loop.

## Out Of Scope

- vertical alignment for Stacked or compact layouts;
- moving or resizing the matrix column;
- changing horizontal text alignment;
- changing card content or actions;
- adding per-breakpoint alignment controls;
- migrating existing documents.
