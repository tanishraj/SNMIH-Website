# Content Highlights Rule Card Inset

## Goal

Keep Content Highlights copy visibly separated from every Rule card boundary, including the vertical dividers in responsive multi-column layouts.

## Problem

Rule cards currently apply vertical padding but apply horizontal padding only when a card has an explicit background. In the two-column grid, cards 02 and 04 begin directly against their left divider. First-column cards also begin flush with the outer grid edge, so the Rule treatment does not provide a consistent content inset.

## Design

Every Rule card receives the existing standard card inset:

```text
px-6 md:px-7
```

The inset belongs to the shared `divided` card treatment, not to responsive column selectors. This gives every card balanced left and right breathing room while keeping the rule itself on the card edge.

The change applies consistently to:

- one-, two-, three-, and four-column item layouts;
- Stacked and Split header compositions;
- Rows Only and Full Grid rule-divider modes;
- inherited and explicit card surfaces.

Individual Items remains unchanged because its separate `leftRule` treatment already uses `p-6 md:p-7`. Open and Boxed treatments also remain unchanged.

## Compatibility

No Payload fields, saved values, generated types, block registration, or renderer boundaries change. Existing documents receive the spacing correction automatically through the shared presentation component.

## Verification

- Add a render contract proving every Rule card includes `px-6 md:px-7`.
- Cover a Split header with a two-column Full Grid configuration and at least four items.
- Preserve continuous horizontal rules and responsive vertical divider classes.
- Run the focused Content Highlights integration suite, TypeScript, and the project-context update/check loop.
