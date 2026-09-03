# Contact 33 Block

## Goal

Add the Shadcn Blocks Contact 33 composition as a reusable Payload page block. Preserve its
two-column contact-form and image layout while integrating it with the project's existing form
submission pipeline, block appearance controls, responsive spacing, typography, media handling,
live preview, and thumbnail system.

## Selected approach

The block uses a selected published Payload Form rather than a presentation-only callback or a
second submission implementation.

The selected form supplies the field labels, placeholders, required states, subject options,
submit-button label, and success message. Submissions use the existing
`/api/forms/[slug]/submit` endpoint, which already provides server validation, normalization,
honeypot handling, rate limiting, submission storage, notifications, event emission, and work
queue integration.

The visual contract remains intentionally fixed to four fields:

- `name`
- `email`
- `subject`
- `message`

This keeps the Contact 33 layout stable and understandable. The selected form may mark fields
optional or required, and the `subject` field may define its own select options. Unsupported form
fields are not rendered by this block.

## Payload configuration

Create a block with:

- slug: `contact33`
- interface: `Contact33Block`
- singular label: `Contact 33`
- plural label: `Contact 33 Blocks`

The Content tab contains:

- optional eyebrow
- required title
- optional description
- required image upload related to Media
- required image alt text
- required relationship to Forms

The form relationship is limited to published `general` and `lead` submission intents.
Review-intent forms remain exclusive to the Review Submission block.

The Layout & Theme tab contains:

- shared block appearance fields
- content alignment: left, center, or right
- size: compact, default, or comfortable
- image position: left or right

Defaults are left-aligned content, default size, and image on the right, matching the registry
component.

## Form contract and fallback behavior

The block resolves the selected form only when Payload has populated the relationship. When no
usable form record or slug is available, the form area displays a concise unavailable message
instead of rendering a nonfunctional form.

Field metadata is resolved by machine name:

- `name` renders as a text input
- `email` renders as an email input
- `subject` renders as a select when options exist
- `message` renders as a textarea

The relationship field explains this contract to editors. Validation rejects a selected form
when a required key is missing, a supported key uses the wrong field type, the subject select has
no options, or an unsupported field is required. Optional unsupported fields may exist but are
ignored by Contact 33.

Each field has a sensible Contact 33 fallback label and placeholder so the live preview and
thumbnail remain useful. Required state still comes from the selected form. The form's submit
button and success message also have safe copy fallbacks.

The endpoint remains authoritative for validation. The client supplies native required and email
constraints, maps returned field errors to the corresponding controls, and renders endpoint-level
errors accessibly.

## Submission behavior

The client submits to `/api/forms/[slug]/submit` with:

- the four visible values
- the existing honeypot field
- landing page, campaign, and source metadata using the established project behavior

While submitting, the button is disabled and shows an inline Lucide loader with accessible
pending copy. On success, the form resets and the returned success message is displayed. On
failure, field-level and form-level messages remain visible until the user edits or resubmits.

No `console.log`, simulated delay, or fake success state from the registry source remains.

## Visual design and alignment

The block retains Contact 33's two-column composition:

- content and form occupy one column
- a tall rounded image occupies the other column
- the image and form align to equal-height desktop tracks
- image position can be reversed by editors
- mobile stacks the content/form before the image

The image remains visible on mobile in a shorter aspect-ratio presentation rather than
disappearing. Payload Media is rendered through the project's media utilities and Next.js image
behavior.

Project conventions replace registry defaults:

- shared `regularBlockContainerClasses`
- shared `regularBlockMobilePaddingClasses`
- `max-w-screen-2xl` container behavior
- eyebrow typography matching other regular blocks
- `text-3xl font-semibold tracking-tight text-balance sm:text-4xl` heading scale
- base body copy with a seven-unit line height and muted foreground
- semantic theme tokens instead of hardcoded green success colors
- project radius, border, field, input, select, textarea, and button primitives
- flex and grid gaps rather than margin-driven vertical spacing

Compact, Default, and Comfortable use the shared outer vertical rhythm. Their distinction is
expressed through internal column, heading, and form gaps so this block remains aligned with
neighboring regular blocks.

Content alignment affects the eyebrow, title, description, and form action alignment. Form labels,
inputs, validation messages, and entered text remain left-aligned for readability.

## Component responsibilities

- The Payload block config declares editor-facing content, form, media, appearance, alignment,
  size, and image-position fields.
- The block adapter normalizes Payload values, resolves the selected Form and Media records, and
  maps them to the presentation component.
- The Contact 33 presentation component owns responsive layout and form interaction.
- Shared form and metadata behavior should be extracted only when it reduces real duplication
  with Review Submission without changing that block's existing behavior.
- The existing form submission route remains unchanged unless tests reveal a genuine contract
  gap.

## Registration and preview

Register Contact 33 in:

- the Page layout block list
- the normal page block renderer
- the live-preview page block renderer
- block thumbnail definitions
- block thumbnail fixtures

Add a representative thumbnail fixture with a non-network media asset and a populated form
record. Generate the corresponding thumbnail through the existing script.

## Accessibility

- Every control has an associated label.
- Required controls communicate required and invalid states.
- Field errors are connected through the existing Field primitives.
- Submission status is announced using an appropriate live region.
- The image uses the required editor-provided alternative text.
- The loading icon is decorative, while pending button text communicates state.
- Keyboard and focus behavior comes from the project's Radix-based shadcn primitives.

## Verification

Focused tests cover:

- Payload field tabs, defaults, options, form-intent filter, and thumbnail registration
- rendering with the four supported form field names
- form metadata, required states, and subject options
- missing or unpopulated form fallback
- image-left and image-right responsive composition
- shared spacing, typography, appearance, and content-alignment contracts
- normal rendering and live-preview rendering registration
- successful submissions, endpoint errors, pending state, and reset behavior where practical
- thumbnail fixture availability

After implementation:

- generate Payload types
- generate the block thumbnail
- run focused integration tests
- run lint and TypeScript/build verification in proportion to any unrelated existing failures

## Out of scope

- Arbitrary dynamic form layouts
- Review-intent form submission
- A new form storage or email system
- Contact information cards, maps, office hours, or social links
- File uploads
- Multi-step forms
- Changes to the Review Submission visual design
