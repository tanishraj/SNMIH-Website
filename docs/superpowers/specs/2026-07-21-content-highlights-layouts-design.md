# Content Highlights Layout and Split Controls

## Goal

Extend the existing Content Highlights block with Simple Grid and Numbered Steps presentations while making split composition and content alignment independent layout controls.

## Layout presentations

The `layout` field offers four item presentations:

- `editorialRow`, labeled **Editorial Row**
- `highlightsGrid`, labeled **Highlights Grid**
- `simpleGrid`, labeled **Simple Grid**
- `numberedSteps`, labeled **Numbered Steps**

The former `splitHighlights` value is removed because split composition is controlled independently.

### Simple Grid

Simple Grid presents concise requirements, services, qualifications, or similar content without cards or item separators.

- One column on mobile.
- Two columns from the medium breakpoint upward when split is disabled.
- Each item uses the shared Content Highlights item typography.
- Optional metadata appears above the title.
- Optional item destinations retain the existing linked-title interaction.

### Numbered Steps

Numbered Steps presents ordered processes in bordered cards.

- Step numbers are generated from array order and formatted as `01`, `02`, and so on.
- One column on mobile.
- Two columns from the medium breakpoint.
- Up to four columns from the large breakpoint when split is disabled.
- Five or six items wrap naturally.
- Cards use the project radius and `border-current/20`, deriving border contrast from the
  resolved block foreground so borders remain visible on every configured background and mode.
- Each card contains the generated number, optional metadata, title, and optional description.
- Optional item destinations retain the existing linked-title interaction.

## Split composition

Add an `enableSplitLayout` checkbox under Layout & Theme. It defaults to `false` and applies to every item presentation.

When enabled:

- The introduction occupies the left column and items occupy the right column on large screens.
- The introduction appears above the items on smaller screens.
- The item area uses no more than two columns because it occupies the narrower side of the split.
- Editorial Row places its section actions inside the introduction column.
- The chosen item presentation remains visually intact apart from its responsive column constraint.

When disabled:

- The introduction appears above the full-width item area.
- Editorial Row retains its defining desktop behavior: introduction on the left and section actions independently placed on the far right.

## Conditional alignment controls

Payload exposes two conditional fields with distinct stored names.

### Non-split alignment

When `enableSplitLayout` is false, show `contentAlignment`, labeled **Content Alignment**, with:

- `left`, default
- `center`
- `right`

This horizontally aligns the eyebrow, title, description, and section actions. Item content remains left-aligned for readability. Editorial Row is the exception: its introduction follows the selected alignment, while its desktop action slot remains on the far right.

### Split alignment

When `enableSplitLayout` is true, show `splitContentAlignment`, labeled **Content Vertical Alignment**, with:

- `top`, default
- `center`
- `bottom`

This vertically aligns the introduction column relative to the items column. It does not alter item alignment.

Only the relevant alignment field is visible in Payload at a time.

## Shared content and configuration

All layouts reuse the current block fields:

- Eyebrow
- Title
- Description
- Optional section actions
- One to six items
- Item metadata
- Item title
- Item description
- Optional item destination
- Appearance settings
- Action mode
- Size

The block slug remains `contentHighlights`.

## Existing data conversion

Existing blocks with `layout: 'splitHighlights'` must be converted before the legacy value is removed:

```ts
{
  layout: 'highlightsGrid',
  enableSplitLayout: true,
  splitContentAlignment: 'top',
}
```

The conversion is idempotent and updates Content Highlights blocks in current Page documents and stored Page draft/version data. All other block data remains unchanged. After verifying the conversion, remove the obsolete value from the Payload schema, public component type, renderer, and generated Payload types.

No runtime compatibility branch for `splitHighlights` remains after conversion.

## Styling and responsiveness

- All modes use the shared regular-block outer spacing: `py-12 md:py-16`.
- All modes remain constrained to the shared website container.
- Typography matches existing regular content blocks.
- Light and dark modes derive colors from the existing block appearance and semantic theme tokens.
- Numbered-card borders use the resolved foreground color at 20% opacity in both stacked and
  split composition; they do not use the page-level `border-border` token.
- Compact, Default, and Comfortable control internal section gaps only.
- Item grids stack to one column on mobile.
- Split composition activates only at the large breakpoint.

## Component responsibilities

- `ContentHighlightsBlockComponent` normalizes CMS values, resolves links and actions, and passes split and alignment controls to the presentation component.
- `ContentHighlights` chooses split or stacked composition, applies introduction alignment, and delegates item rendering.
- The shared item renderer selects the existing, simple, or numbered item presentation.
- Layout-specific grid maps independently resolve full-width and split column contracts.
- Payload field conditions control which alignment select is visible.

## Validation and fallback behavior

- A non-empty block title and at least one usable item remain required for rendering.
- Invalid or missing item destinations render non-interactive content through the existing normalization behavior.
- Missing descriptions or metadata reserve no empty space.
- A null or unknown layout falls back to `highlightsGrid`.
- Missing split and alignment values resolve to non-split, left horizontal alignment, and top vertical alignment.

## Testing

Integration tests verify:

- Payload exposes four layout presentations and no `splitHighlights` option.
- The split checkbox defaults off.
- Horizontal and vertical alignment fields have the approved values, defaults, and complementary admin conditions.
- Simple Grid and Numbered Steps retain their approved responsive presentation contracts.
- Every layout works in split and non-split composition.
- Numbered cards retain visible `border-current/20` borders on colored backgrounds in both
  split and non-split composition.
- Split item grids use no more than two columns.
- Horizontal alignment affects the introduction but not item text.
- Vertical alignment applies top, center, and bottom positioning to the split introduction.
- Editorial Row retains its non-split action slot and moves actions into the introduction when split.
- Mobile split composition stacks introduction above items.
- Theme appearance, shared spacing, metadata, item links, and section actions remain functional.
- Data conversion changes only legacy Content Highlights blocks and is safe to run more than once.

## Out of scope

- Manually editable step numbers.
- User-selectable left/right split placement.
- Alignment controls for individual item text.
- Layout-specific content fields.
- A separate Requirements or Process block.
- Retaining `splitHighlights` as a hidden runtime compatibility value after data conversion.
