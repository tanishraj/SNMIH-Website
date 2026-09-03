# Content Highlights Layout Selector Design

## Goal

Give editors one independent layout control for Content Highlights. The selected layout must work with every card style, eyebrow placement, section surface, and header composition.

## Admin configuration

Add a required `itemsLayout` select field under Theme Settings with these choices:

- 1 Column
- 2 Columns
- 3 Columns
- 4 Columns

The default is `3 Columns`.

Hide the existing `cardLayout` and `gridColumns` fields from the admin panel. Retain both fields in the schema so existing documents remain valid and can be normalized without a database migration. Card Style and Eyebrow Placement remain separate controls.

Card Style keeps these four options:

- Open
- Left Rule
- Boxed
- Rule

Rule retains the stored value `divided` for backward compatibility. Only its editor-facing label and presentation are refined; no content migration is required.

## Rendering behavior

`itemsLayout` is authoritative when present. The renderer supports these responsive layouts:

| Selection | Mobile | Medium | Large / extra large |
| --------- | ------ | ------ | ------------------- |
| 1 Column  | 1      | 1      | 1                   |
| 2 Columns | 1      | 2      | 2                   |
| 3 Columns | 1      | 2      | 3                   |
| 4 Columns | 1      | 2      | 4                   |

The selected desktop count is honored in both Stacked and Split header compositions. Responsive breakpoints may reduce the count on smaller screens, but Split does not impose an additional two-column cap.

All layouts support Open, Left Rule, Boxed, and Rule. Open cards use 32px between rows and retain the existing 24px horizontal spacing. Left Rule and Boxed keep their current 24px grid gap.

Rule matches the approved editorial reference:

- the group has a continuous top rule;
- every card has a bottom rule, including the final card;
- cards use 32px vertical padding on small screens and 40px from the medium breakpoint;
- cards that inherit the section surface have no horizontal inset, allowing rules and content rails to align with the section container;
- cards with an explicit background retain the existing 24px/28px responsive horizontal padding;
- Inline eyebrow placement in 1 Column uses the existing 3.5rem rail on small screens and an 8rem editorial rail from the medium breakpoint;
- Inline eyebrow placement in 2–4 Columns uses the existing 3.5rem rail so content remains readable;
- Inline layouts retain the existing 1.25rem column gap;
- Stacked eyebrow placement remains stacked;
- multi-column Rule layouts stay gapless and use coordinated column separators at each active breakpoint.

Rule does not override Items Layout, Eyebrow Placement, card background, or any card-content configuration.

## Legacy compatibility

Normalize the hidden legacy values as follows:

- A stale `itemsLayout: list` value becomes `1`.
- `cardLayout: list` becomes `1`.
- `cardLayout: grid` with `gridColumns: 2` becomes `2`.
- `cardLayout: grid` with `gridColumns: 3` becomes `3`.
- Legacy Simple Grid becomes `2`.
- Legacy Editorial List becomes `1`.
- Other legacy or missing values become `3`.

No content migration is required. New values always take precedence over legacy fields.

## Component contract

Expose `itemsLayout` with the public string values `'1' | '2' | '3' | '4'`. The block adapter accepts stale `'list'` data as a compatibility input and normalizes it to `'1'`. Keep the older legacy props nullable for compatibility. Resolve the presentation once near the component boundary, then pass the normalized layout to the item-grid renderer.

The existing card content hierarchy and controls are unchanged: eyebrow, metadata, title, description, action, and card background remain independently configurable.

## Verification

Update integration coverage to verify:

- the single visible Items Layout field and hidden legacy fields;
- explicit rendering for 1–4 columns;
- responsive classes for each column count;
- exact column selection under Split headers;
- all card styles with the new layouts;
- 32px Open row spacing with unchanged horizontal spacing;
- unchanged spacing for Left Rule and Boxed;
- Rule's editor-facing label with the backward-compatible `divided` stored value;
- continuous Rule geometry for 1–4 columns;
- Rule vertical padding and inherited-surface horizontal alignment;
- wide 1-Column Inline and compact multi-column Inline eyebrow rails;
- legacy normalization precedence;
- regenerated Payload types;
- TypeScript, ESLint, and the full integration suite.

No commits are part of this task unless the user explicitly requests one.
