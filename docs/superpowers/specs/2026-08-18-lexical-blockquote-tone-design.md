# Lexical Blockquote Tone Design

## Goal

Increase the visual emphasis of Lexical blockquotes without changing their layout or affecting other
rich-text elements.

## Design

- Apply `prose-blockquote:text-current/80` in the shared semantic rich-text preset.
- Let blockquote content and citations inherit that theme-aware foreground tone.
- Align long-form blockquotes with paragraphs and excerpts at `text-base`, `leading-7`, and
  `sm:text-lg`.
- Keep compact Q&A blockquotes on the existing dense `text-sm sm:text-base` preset.
- Keep the existing muted background, border, padding, spacing, typography, and responsive behavior.
- Apply the change to both long-form and compact Lexical consumers through the shared preset.
- Preserve the existing `/90` heading and `/80` ordinary-content hierarchy, Primary links,
  card-foreground preformatted blocks, and softer completed or struck states.

## Verification

- Add a shared rich-text contract assertion for `prose-blockquote:text-current/80`.
- Assert the long-form responsive size and leading tokens and verify they are absent from the
  compact preset.
- Run the focused rich-text and News/Event story tests.
- Run TypeScript, lint, formatting, typography detection, diff validation, and the required
  project-context update/check loop.
