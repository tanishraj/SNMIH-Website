# Q&A Accordion Editorial Layout Parity

## Goal

Replace the Q&A Accordion's current combined layout selector with the same clear composition model used by Editorial Reasons: choose Stacked or Split first, then configure the split proportion, Q&A side, and section-content vertical alignment.

## Current Problem

The current Q&A Accordion exposes `50 / 50`, `One-Third Content / Two-Thirds Q&A`, and `Full Width` as one Layout Mode field. This mixes topology and proportion in one decision. Its split content column also uses `h-full` and a `flex-1` supporting area, so Profile, Contact Prompt, and actions stretch across the available height instead of behaving as one alignable section-content group.

The resulting editor model and frontend composition do not match the established Editorial Reasons split pattern.

## Admin Contract

### Layout Mode

Replace the current options with:

- **Stacked** (`stacked`)
- **Split** (`split`)

Default: **Split**.

### Split Proportion

Show only when Layout Mode is Split:

- **Balanced (50 / 50)** (`balanced`)
- **Section Content Focus (60 / 40)** (`sectionFocus`)
- **Q&A Focus (40 / 60)** (`qaFocus`)

Default: **Balanced**.

The first number always describes the section-content column and the second number always describes the Q&A column, regardless of which side Q&A occupies.

### Q&A Position

Retain the existing left/right choice, visible only in Split mode:

- **Left** (`left`)
- **Right** (`right`)

Default: **Right**.

### Section Content Vertical Alignment

Add a Split-only select:

- **Top** (`top`)
- **Center** (`center`)
- **Bottom** (`bottom`)

Default: **Top**.

The control aligns the complete natural-height section-content group relative to the Q&A column on large screens.

### Supporting Content

Profile and Contact Prompt remain available only in Split mode. Rename the editor-facing **Side Column** label to **Supporting Content** because these fields belong to the section-content group rather than an independent third region. Stored field names for Profile, Contact Prompt, section actions, footer actions, and Q&A items remain unchanged.

Sticky section content and an actions-at-bottom control are intentionally excluded.

## Rendering Contract

### Shared Editorial Structure

Follow Editorial Reasons for container, introduction, and section rhythm:

- use the regular block container and section-padding contracts;
- use `contentIntroClasses` for the introduction measure and rhythm;
- use `contentSectionHeadingClasses` for the heading;
- use `contentSectionDescriptionClasses` for the description;
- use `gap-10 lg:gap-16` between the section-content and Q&A regions;
- keep semantic section appearance and footer actions unchanged.

Section Content Alignment continues to move the heading, description, and section actions together. Q&A rows, Profile, and Contact Prompt remain left-aligned.

### Split Mode

Render two grid children:

1. Section content:
   - title and optional accent title;
   - description;
   - section actions;
   - optional Profile;
   - optional Contact Prompt and its actions.
2. Q&A:
   - accordion items only.

The section-content child uses natural height. Remove `h-full`, the supporting area's `flex-1`, and `justify-between`. Profile, Contact Prompt, and contact actions follow the introduction in normal document flow with deliberate shared spacing.

Map vertical alignment at the large breakpoint:

- Top → `lg:self-start`
- Center → `lg:self-center`
- Bottom → `lg:self-end`

Map proportions with Editorial Reasons-style fractional grid tracks:

| Proportion | Q&A Right | Q&A Left |
| --- | --- | --- |
| Balanced | `1fr / 1fr` | `1fr / 1fr` |
| Section Content Focus | `3fr / 2fr` | `2fr / 3fr` |
| Q&A Focus | `2fr / 3fr` | `3fr / 2fr` |

The section-content region remains first in the DOM. Q&A Position changes large-screen visual order only.

### Stacked Mode

Render section content above Q&A at full container width. Split Proportion, Q&A Position, Section Content Vertical Alignment, Profile, and Contact Prompt are hidden in Admin and ignored at runtime.

The section introduction retains the established vertical separation before Q&A. Footer Actions remain after the complete composition.

### Responsive Behavior

Split mode becomes a single column below the large breakpoint. Mobile and tablet always show section content first and Q&A second, regardless of Q&A Position. Vertical alignment has no effect below the large breakpoint.

## Stored Data and Compatibility

The schema becomes explicit:

- `layoutMode`: `stacked | split`
- `splitProportion`: `balanced | sectionFocus | qaFocus`
- `sectionVerticalAlignment`: `top | center | bottom`
- `accordionPlacement`: unchanged `left | right`

Do not add or run a database/content migration. Existing documents are not rewritten as part of this
change. The renderer normalizes legacy values without mutating stored content so older drafts,
restored versions, and serialized fixtures remain safe:

- `fullWidth` resolves to Stacked;
- `fiftyFifty` resolves to Split + Balanced;
- `oneThird` resolves to Split + Q&A Focus;
- invalid or missing new values resolve to Split + Balanced + Top.

The Admin field conditions recognize legacy split/full-width values during the compatibility window.
Newly authored and re-saved blocks use only the new schema values.

## Diagnostics

Preserve the current Q&A diagnostic attributes where their meaning remains valid. Update layout diagnostics to report normalized new values and add explicit attributes for:

- split proportion;
- section-content vertical alignment.

`data-qa-accordion-section-content="true"` continues to identify the section-content region, and `data-qa-accordion-main="true"` continues to identify Q&A.

## Verification

### Schema and compatibility

- Layout Mode exposes only Stacked and Split.
- Split Proportion, Q&A Position, vertical alignment, and Supporting Content appear only for Split.
- Defaults are Split, Balanced, Q&A Right, and Top.
- Compatibility tests cover all three legacy renderer mappings without writing stored content.
- Generated Payload types expose the new schema.

### Rendering

- Balanced, Section Content Focus, and Q&A Focus render the correct tracks with Q&A on either side.
- Top, Center, and Bottom map to the matching large-screen self-alignment class.
- The section-content group does not use `h-full`, `flex-1`, or `justify-between` to simulate alignment.
- Profile and Contact Prompt remain inside the section-content region in natural flow.
- Stacked mode places Q&A below the introduction and omits supporting content.
- DOM/mobile order remains section content before Q&A.
- shared Editorial Reasons introduction, heading, description, container, spacing, and theme semantics are present.
- Q&A interaction, compact rich text, action variants, appearance, padding, open state, and footer actions remain unchanged.

### Repository checks

- focused Q&A schema/rendering/compatibility tests;
- Page and News/Event detail block registry parity;
- production and live-preview renderer parity;
- theme and block-layout contracts;
- Payload type generation;
- TypeScript and lint;
- project-context update/check;
- the full integration suite.

## Out of Scope

- Sticky section content
- Section actions pinned to the bottom of the column
- Changes to Q&A row styling or interaction
- Changes to Profile or Contact Prompt fields
- New card surfaces or appearance options
- Changes to other blocks
