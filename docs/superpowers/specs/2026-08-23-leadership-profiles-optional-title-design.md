# Leadership Profiles Optional Title Design

## Goal

Allow editors to publish a Leadership Profiles block without a section-level title while preserving useful optional header content and clean spacing.

## Approved Behavior

- The Payload `title` field is optional.
- The block renders whenever at least one valid profile remains after runtime normalization.
- The header renders only when at least one of eyebrow, title, accent title, description, or section actions is present.
- When the primary title is absent but the accent title is present, the accent title remains the semantic `h2` content.
- When both title fields are absent, no empty `h2` is rendered.
- When all header content is absent, the header wrapper and the header-to-grid gap are omitted so the profile grid begins without artificial whitespace.
- The renderer never invents a fallback heading from profile content.

## Compatibility

Existing blocks with titles render unchanged. Profile validation, card presentation, section appearance, footer actions, and registration remain unchanged.

## Verification

Update the focused Leadership Profiles schema and rendering tests, regenerate Payload types, run TypeScript and affected integration tests, then complete the project-context update/check loop.
