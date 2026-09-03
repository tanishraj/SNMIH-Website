# Fee Structure Layout and Download Controls

**Date:** 2026-08-21
**Status:** Approved design; awaiting written-spec review

## Goal

Refine Fee Structure with optional equal-width category tabs, a description-width programme/session band, consistent table-row interaction and typography, and a configurable download action and container surface.

## Scope

- Add a category-tab width control.
- Constrain the programme/session band to the section introduction measure.
- Standardize table-row hover behavior.
- Use medium standard fee-head labels and bold total rows.
- Configure the uploaded fee document as a Link or Button.
- Configure the download container with the same semantic backgrounds available to sections.

Fee values, normalization, calculations, category limits, academic-period limits, and document destinations do not change.

## Category Tab Width

Add a required `tabWidth` select under Theme Settings. It appears only when more than one fee category exists.

Options:

| Label | Value | Behavior |
| --- | --- | --- |
| Content Width | `content` | Existing intrinsic-width tabs remain in one horizontally scrollable rail. |
| Equal Full Width | `equal` | The rail occupies 100% width and every category receives an equal share. |

`content` is the saved default and runtime fallback. Equal Full Width applies on mobile, tablet, and desktop. Fee Structure supports no more than four categories; labels remain centered and use the existing shared tab typography and interaction states.

## Programme and Session Band

The programme/session definition list keeps its top and bottom borders but no longer spans the full block container. It uses the same `max-w-3xl` measure as the shared section introduction.

- Center-aligned sections place the band at `mx-auto` and center its contents.
- Left-aligned sections keep the band at the introduction's left edge.
- The band remains `w-full` up to its maximum measure, so its borders stay useful on narrow screens.

This behavior applies whether or not a description is authored; the measure follows the section introduction contract rather than calculating text width in the browser.

## Table Interaction and Typography

The header row remains visually stable and does not change on hover.

Standard rows:

- Use one consistent light-surface hover and one consistent brand-surface hover.
- Keep fee-head labels at `font-medium`.
- Keep values at normal weight.

Total rows:

- Keep their stronger resting background.
- Use a stronger hover in the same semantic color family instead of falling back to the standard hover.
- Apply `font-bold` to the row, including the total label and values.

The existing right alignment, tabular-numeral behavior, sticky fee-head column, and Brand/Gradient Brand contrast contract remain unchanged.

## Download Action

The uploaded `feeDocument` remains the fixed download destination. Editors cannot replace it with a Page or Custom URL.

Add these fields:

- `downloadLabel`: existing label field; default remains `Download Fee Structure`.
- `downloadActionMode`: Link or Button; default and runtime fallback are Button.
- `downloadButtonVariant`: the existing semantic button variants; visible only in Button mode; default and runtime fallback are Outline.

Both modes retain:

- Native anchor `download` behavior.
- The configured label.
- A Download icon.
- Keyboard focus and an accessible name.

Link mode uses the project's underlined content-link treatment while retaining the Download icon rather than the generic navigation arrow. Button mode uses the existing Button component and selected variant.

## Download Container Appearance

Add a `downloadAppearance` group under Theme Settings. It is visible only when a fee document is selected and contains the shared section background choices:

- None
- Subtle
- Brand
- Gradient Subtle
- Gradient Brand

The default and runtime fallback are None, preserving the current transparent container. The existing rounded full outline remains in every background mode.

The container resolves background and foreground through the shared block-appearance contract. Text, file icon, link, focus state, and button treatment must remain readable on light, Brand, and Gradient Brand backgrounds. No palette values are hard-coded.

## Data and Compatibility

- Existing documents without `tabWidth` render Content Width.
- Existing documents without `downloadActionMode` render a Button.
- Existing documents without `downloadButtonVariant` render Outline.
- Existing documents without `downloadAppearance` retain a transparent outlined container.
- `feeDocument` remains the only source for the rendered download URL.
- No content migration is required.

## Testing

Focused tests will verify:

- New Payload fields, defaults, conditions, and generated types.
- Content Width and Equal Full Width rail/trigger classes.
- Equal Full Width behavior at every breakpoint through unprefixed width and flex classes.
- Programme/session band width and left/center alignment.
- Stable header hover, consistent standard-row hover, and total-row hover on light and brand surfaces.
- Medium standard fee-head labels and bold total rows.
- Link and Button download modes preserve the uploaded file destination and `download` attribute.
- Button variant selection and runtime fallbacks.
- Download container backgrounds and dark-surface contrast.
- Existing normalization, registration, production rendering, live preview, and thumbnail contracts.

## Documentation and Preview

Update the Fee Structure contract in the maintained block-system reference, regenerate Payload types, refresh the Fee Structure thumbnail, and run the required project-context update/check loop.

## Out of Scope

- Custom download URLs or Page relationships
- Multiple fee-structure downloads
- Changing uploaded files through the action configuration
- Calculating totals or interpreting currencies
- Redesigning shared tab or action components
