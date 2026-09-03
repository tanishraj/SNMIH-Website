# Event Gallery Overlay Content Design

## Goal

Give every Event Gallery overlay position the same predictable vertical content hierarchy while allowing the position setting to control only where that hierarchy sits inside the image.

## Universal Content Contract

Every `cardTextLayout` value renders one vertical stack in this order:

1. Image icon and numeric image count
2. Event date
3. Gallery title

The image-count row displays only the icon and number, such as `5`; it does not render `image` or `images`. Image count and event date each occupy their own row using the existing small, regular-weight mono metadata styling.

Every gallery title uses the theme text/sans family through `var(--font-text)`, semibold weight, and the existing responsive `text-lg` to `text-xl` scale. Titles remain clamped to two lines.

If the image count or event date is disabled or unavailable, that row is omitted and the remaining stack closes naturally without an empty gap.

## Position Behavior

The position setting changes alignment and placement without changing content order or typography:

- **Bottom Left:** stack sits at the bottom-left and aligns text left.
- **Bottom Center:** stack sits at the bottom-center and aligns every row centrally.
- **Center — Vertical & Horizontal:** stack is centered on both axes and aligns every row centrally.

The implementation uses one shared column structure with position-specific outer alignment classes. It does not duplicate the content markup for individual positions.

## Unchanged Behavior

Overlay tone, strength, direction, coverage, album ordering, rectangular quilt layout, viewer interaction, accessibility, and motion behavior remain unchanged.

## Admin Guidance

The Overlay Content Position description will explain that every option displays image count, date, and title as a vertical stack, while the selected option controls the stack's placement and alignment.

## Testing

Rendering tests will verify:

- the image-count, event-date, and title order for all three positions;
- numeric-only image-count copy alongside the existing icon;
- the text-family title treatment for all three positions;
- position-specific left or centered alignment;
- natural collapse when one or both metadata rows are disabled.
