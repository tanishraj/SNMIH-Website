# Tabs Content Active Color Design

## Objective

Make the active label in the Tabs Content block's underline variant use the same theme primary color as its underline.

## Design

In `TabsContentClient`, change only the active underline-variant text class from `text-foreground` to `text-primary`.

The result is theme-driven:

- active underline label: `text-primary`
- active underline border: `border-primary` (unchanged)
- inactive underline labels: `text-muted-foreground` (unchanged)
- inactive hover text: `text-foreground` (unchanged)
- pills and boxed variants: unchanged

This applies consistently to every website theme. When SNMIH is selected, both the active tab label and underline resolve to the SNMIH `--primary` token.

No SNMIH-only CSS override or raw color value will be introduced.

## Validation

Add focused source-level coverage confirming that the underline active state pairs `border-primary` with `text-primary` and no longer pairs it with `text-foreground`. Run the focused test, ESLint, TypeScript, formatting checks, and whitespace validation.

## Constraints

- Do not change inactive tab styling.
- Do not change pill or boxed tab styling.
- Do not change the supplied SNMIH theme tokens.
- Do not stage or commit files.
