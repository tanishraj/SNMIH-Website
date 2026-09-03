# Lexical Content Tone Design

## Goal

Use a softened semantic foreground hierarchy for the News & Events excerpt and Lexical content so
the introduction and body blend with the surrounding theme without rendering as full black or navy.

## Tone Contract

Use two closely related semantic foreground tones:

- The News & Events excerpt uses `text-current/80`.
- Lexical H1–H6 headings use `text-current/90` so they remain stronger than body copy without
  becoming full black or navy.
- Long-form paragraphs and list items use `text-current/80` alongside their existing responsive
  size and line-height roles.
- Strong text, emphasis, quotes, inline code, captions, checklist labels, and other ordinary
  non-interactive content use or inherit `text-current/80` to match the excerpt.
- Links retain semantic Primary color so their interactive affordance remains clear.
- Preformatted blocks retain their card-surface foreground for contrast against their own surface.
- Completed checklist and struck content may retain the existing softer state tone.

This tone is semantic and theme-aware; it does not introduce a fixed color value.

## Preserved Typography and Behavior

- Keep long-form paragraphs and list items at `text-base sm:text-lg` with `leading-7`.
- Keep the compact rich-text size and spacing scale unchanged.
- Keep the existing H1–H6 family, size, weight, and spacing hierarchy.
- Keep link focus styles, blockquote surfaces, code treatment, checklists, images, captions,
  horizontal rules, alignment support, and empty-paragraph suppression unchanged.
- Do not change Payload editor features, schema, generated types, or component data flow.

## Verification

- Update shared rich-text contract tests to require `/90` headings and `/80` ordinary content.
- Verify headings, strong text, emphasis, quotes, inline code, and captions no longer force an
  unsoftened foreground.
- Verify links remain semantic Primary and preformatted blocks keep card foreground.
- Keep the News & Events story test aligned with the excerpt's `/80` tone.
- Run the shared rich-text and News & Events story suites, TypeScript, lint, formatting, typography
  detection, and the project-context update/check loop.
