# Call to Action Section Design

## Problem

The Call to Action block currently renders a nested `bg-background` panel with its own optional border. That panel overrides the selected section surface and produces a large white rectangle inside tinted sections. The description can also span too widely, reducing readability. Its admin schema lacks the standard eyebrow field and does not offer the stacked/split header compositions available in comparable section blocks.

## Content Model

The Content tab will contain:

- `eyebrow`: optional small section label;
- `title`: required primary heading;
- `accentTitle`: optional italic second heading line;
- `description`: optional supporting text;
- `actions`: up to two shared section actions;
- `footerActions`: up to two shared footer actions.

The Theme Settings tab will contain:

- shared section `appearance` background and border controls;
- `headerLayout`: `stacked`, `split`, or `actionSplit`, defaulting to `stacked`; the stored `split` value is labeled **Content Split** for backward compatibility;
- `contentAlignment`: `left`, `center`, or `right`, controlling the grouped content alignment;
- `splitContentAlignment`: `top`, `center`, or `bottom`, shown only for Content Split and defaulting to `center`;
- `actionLayout`: `inline` or `stacked`, shown only for Action Split and defaulting to `inline`;
- shared `size` section-padding options.

The existing `borderStyle` field will be removed. Previously stored values require no migration because the renderer will no longer consume the field.

## Rendering

The outer `<section>` is the only visual surface. It receives the shared appearance background, foreground, and section-border classes. The inner content will not add a background, border, radius, or boxed padding.

All layouts use the shared section eyebrow, heading, and description typography:

- The content area is constrained to a readable maximum width rather than spanning the entire container.
- The description is constrained more tightly than the heading and uses balanced wrapping.
- Alignment-aware width and margin classes place left, centered, and right content consistently.
- Actions remain directly associated with their supporting content.

### Stacked Layout

Eyebrow, title, accent title, description, and actions form one vertical group. The group respects the selected content alignment and remains compact enough to read as a single conversion prompt.

### Content Split Layout

On large screens, the eyebrow and heading occupy the lead column while the description and actions occupy a narrower supporting column. `splitContentAlignment` vertically aligns the supporting column to the top, center, or bottom of the heading column. On smaller screens the columns collapse into the same semantic DOM order: heading first, supporting content second.

The stored value remains `split`, so existing CTA records preserve their current rendering when the admin label changes to **Content Split**.

### Action Split Layout

On large screens, the eyebrow, heading, and description occupy the lead column. Actions occupy a dedicated column aligned to the right edge of the section container. The conditional `actionLayout` control determines whether the actions render inline in a row or stacked vertically.

On smaller screens, the action column moves below the complete copy group in semantic order. The normal `contentAlignment` setting controls the mobile alignment; forced right-edge positioning begins only at the large breakpoint.

Action Split requires at least one valid section action. If its configured actions are empty or invalid after shared action resolution, the renderer falls back to Stacked so it does not create an empty right column. The description remains constrained to `max-w-2xl` in every layout.

Footer actions remain outside the main CTA composition and continue using the shared footer-action renderer.

## Compatibility And Error Handling

- Existing blocks without `headerLayout` render as `stacked`.
- Existing blocks with `headerLayout: 'split'` render as Content Split without migration.
- Existing blocks without `splitContentAlignment` use `center` when switched to Content Split.
- Existing blocks without `actionLayout` use `inline` when switched to Action Split.
- Action Split without a valid section action falls back to Stacked.
- Invalid or stale layout, alignment, and size values fall back to their documented defaults.
- A missing or blank title continues to render no block; the required admin field prevents new incomplete records.
- Empty or invalid actions are filtered by the existing shared action resolver.

## Verification

Focused tests will cover:

- the standard Content and Theme Settings field contracts;
- removal of `borderStyle` from the schema and generated type;
- required title and the new eyebrow field;
- stacked, Content Split, and Action Split layout classes and semantic content order;
- top, center, and bottom Content Split alignment;
- inline and stacked Action Split action arrangements;
- right-edge desktop action positioning and normal mobile alignment;
- Action Split fallback when no valid section actions remain;
- left, center, and right content alignment;
- inherited `none`, subtle, and brand section surfaces with no nested `bg-background` panel;
- constrained description width and shared typography;
- actions, footer actions, blank-title handling, and stale-value fallbacks;
- registration in public and live-preview renderers.

Payload types and the Call to Action admin thumbnail will be regenerated after the schema and component changes. TypeScript, focused integration tests, lint, and thumbnail metadata checks must pass.

## Scope

This change does not add media, animation, new action variants, custom card surfaces, or change other blocks. It preserves the existing theme tokens and shared action behavior.
