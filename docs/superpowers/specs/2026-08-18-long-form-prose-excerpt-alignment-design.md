# Long-Form Prose and Excerpt Alignment Design

## Goal

Align ordinary long-form Lexical copy with the established News & Events excerpt typography so the
introduction and article body read as one coherent text system.

## Scope

Update the shared `longFormRichTextClasses` contract used by News & Events detail pages, Article
pages, and Rich Text blocks. Do not create a News & Events-only override.

The News & Events excerpt remains unchanged:

```text
text-base leading-7 text-current/70 sm:text-lg
```

## Shared Body Typography

Long-form paragraphs and list text will use the same responsive body role as the excerpt:

- `text-base` below the `sm` breakpoint.
- `text-lg` from the `sm` breakpoint upward.
- `leading-7` at all supported widths.
- `text-current/70` for the supporting-copy tone.

Paragraph and list rhythm remains controlled by the existing long-form spacing rules. Empty Lexical
paragraphs remain hidden.

## Preserved Hierarchy

- Headings keep their current H1–H6 scale, text-family token, semibold weight, full current color,
  and spacing hierarchy.
- Strong text remains semibold and full current color.
- Links retain the semantic Primary color and focus styles.
- Blockquotes, code, preformatted blocks, checklists, images, captions, and horizontal rules keep
  their specialized presentation.
- The compact rich-text variant remains unchanged.

## Verification

- Update the shared rich-text presentation contract tests first.
- Verify paragraphs and list items carry the responsive size, `leading-7`, and supporting-copy tone.
- Verify headings and strong text retain full current color.
- Verify the News & Events excerpt class remains unchanged.
- Run the rich-text and News & Events story integration suites, TypeScript, lint, formatting,
  typography detection, and the project-context update/check loop.
