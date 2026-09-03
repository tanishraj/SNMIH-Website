# Page Header Key Facts Rail

> Superseded by [Page Header Action Layout](./2026-08-14-page-header-action-layout-design.md). Key Facts data remains stored for compatibility but its rail and controls are retired.

## Goal

Replace the Split Page Header's narrow metadata card with an image-backed editorial fact rail inspired by the supplied reference. Preserve existing Key Facts content while making labels optional and values the primary statements.

## Content model

The existing `keyFacts` array remains exclusive to the Split variant and keeps its six-row maximum.

- `label` remains optional in stored data for backwards compatibility, but is hidden from the editor and no longer rendered.
- `value` remains required and becomes the primary displayed statement.
- Row numbers are generated from array order as zero-padded values: `01`, `02`, … `06`.
- A row renders when it has a non-empty value, regardless of whether its label is empty.
- Existing saved label/value pairs remain compatible without migration.

The Payload admin shows Key Facts only when the Page Header variant is Split. Editors enter only the primary statement; rows are numbered automatically.

## Editor organization

- Background Image is the first field in the Content tab because it establishes the visual context for Banner and Split variants.
- Custom breadcrumb items remain in Content because their labels and destinations are editorial content.
- Breadcrumb Display moves to Theme Settings immediately after Variant because it controls presentation rather than breadcrumb copy.
- Number Position is a Split-only Theme Settings control with Inline and Above Text options. Inline is the default for existing and new content.
- Existing stored values and automatic, custom, and hidden breadcrumb behavior remain unchanged.

## Desktop layout

The Split variant uses a responsive grid with an approximately 60/40 content-to-facts proportion.

```text
┌──────────────── page content 60% ────────────────┐ ┌──── facts rail 40% ────┐
│ breadcrumbs                                      │ │ background image         │
│ eyebrow                                          │ │ ──────────────────────── │
│ title                                            │ │ 01  primary statement     │
│ subtitle                                         │ │                         │
│ actions                                          │ │ ──────────────────────── │
└──────────────────────────────────────────────────┘ │ 02  primary value         │
                                                     │ ──────────────────────── │
                                                     └──────────────────────────┘
```

The left content remains the primary reading entry. The facts rail supports it without becoming a separate floating card.

## Facts rail appearance

- Render the existing Split `backgroundImage` absolutely behind the facts.
- Treat the image as atmospheric decoration and render it with an empty alt attribute.
- Apply the selected block background as an 85% translucent tint over the image. None maps to the existing Muted token so the rail remains visibly tinted; Subtle, Brand, Gradient: Subtle, and Gradient: Brand reuse their existing appearance classes.
- Derive foreground and ordinal colors from the same selected block surface so the rail stays readable in light and dark mode without adding tokens.
- If no image is configured, use the selected block background as the solid fallback.
- Use the theme radius through `rounded-[var(--radius)]` and clip the media/overlay to it. SNMIH remains square because its radius is zero.
- Use only subtle top, bottom, and between-row hairlines at `border-current/15`; do not add a separate framed card border.
- Pass the selected appearance background to the ordinal eyebrow treatment so its accent follows the same surface contract as every other section eyebrow.
- The main value uses the same 12px size as the shared section eyebrow without adopting the eyebrow's mono, uppercase, or tracking treatment.
- The deprecated optional label is hidden in Payload and is not rendered.

## Row structure

Use an ordered list with one list item per valid fact. Number Position controls the row composition:

- Inline uses an auto-sized ordinal column, a flexible `minmax(0, 1fr)` statement column, and a 10px horizontal gap.
- Above Text stacks the ordinal above the statement with a 10px vertical gap.

The visible zero-padded number is decorative and hidden from assistive technology; the ordered-list structure still announces the collection. Values are not clamped. Long text wraps naturally with overflow-safe behavior.

## Responsive behavior

- Below the large breakpoint, the page content and facts rail stack in DOM order.
- The facts rail becomes full width below the introduction.
- Fact rows remain one column at every viewport; they never collapse into narrow side-by-side cards.
- Use compact row padding at every breakpoint; the ordinal-to-statement relationship remains 10px in either layout.
- With one fact, the panel remains content-sized.
- With up to six facts, the Page Header grows vertically without internal scrolling or clipping.
- With no valid facts, omit the rail and let the content use the full container width.

## Theme behavior

The panel background, tint, foreground, ordinal and border treatments use the existing block appearance resolver. It must remain readable on none, subtle, brand, gradient-subtle and gradient-brand section appearances in light and dark mode. No SNMIH-specific selector or new color token is introduced.

## Testing and verification

Automated coverage must verify:

- `label` is optional and `value` remains required in Payload configuration.
- Key Facts is visible in the admin only for Split Page Headers.
- Background Image is first in Content and Breadcrumb Display is in Theme Settings after Variant.
- Number Position defaults to Inline and is visible only for Split Page Headers.
- The Split variant renders the configured background image with decorative alt text.
- The image tint and no-image fallback follow the selected block background and foreground.
- Values render when labels are absent.
- Stored legacy labels are preserved but not rendered or editable.
- Numbers are generated and zero padded.
- Empty-value rows do not render defensively.
- The rail uses a single-column ruled-list structure.
- Primary fact statements render at exactly 12px at every breakpoint.
- Inline and Above Text number positions render with a 10px gap.
- No valid facts produces a content-only Split header.
- Existing automatic/custom/hidden breadcrumb behavior remains unchanged.

Visual verification covers 375px, 768px and 1440px widths with representative short, long, labelled and unlabelled values across light and dark theme surfaces.

## Out of scope

- Additional Key Facts visual-style controls beyond Number Position.
- Changes to Minimal or Banner Page Header variants.
- New theme tokens or SNMIH-only CSS.
- Reordering facts independently from their Payload array order.
- Animation or carousel behavior.
