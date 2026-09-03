# Shared Lexical Typography Design

## Objective

Create one consistent, theme-aware presentation for long-form Lexical content while preserving a
denser treatment for compact content such as accordion answers. Refine the News & Events detail
sidebar so metadata uses the project's established mono typography role.

## Scope

This change covers:

- News & Events detail body content.
- Article detail body content.
- The reusable Rich Text Page block.
- Compact Lexical content in Q&A Accordion only where shared semantic tokens can be reused without
  adopting long-form spacing.
- News & Events Story Details metadata typography.

It does not change Payload fields, enabled Lexical features, stored editor data, the News & Events
detail-template schema, card surfaces, or share-button typography.

## Shared Typography Architecture

Add a client-safe shared presentation module for Lexical class presets. It will expose:

- a long-form preset used by News & Events, Articles, and the Rich Text Page block;
- a compact preset or shared semantic foundation for Q&A Accordion answers.

The shared module must contain presentation classes only. It must not import Payload, server-only
helpers, collection queries, or route code, so production and live-preview renderers can reuse it.

Avoid styling every `.prose` instance through global CSS. Explicit presets make the intended reading
context clear and prevent article-scale spacing from leaking into accordions or other compact UI.

## Long-Form Lexical Presentation

The long-form preset will style all DOM produced by the configured `bodyEditor` features:

- Paragraphs use the theme text family, a comfortable reading line-height, and clear paragraph
  rhythm.
- H2, H3, and H4 use the theme display family, responsive token-based sizes, semibold weight,
  balanced wrapping, and progressively smaller spacing.
- Bold, italic, underline, and strikethrough remain visually distinct without overriding theme
  colors.
- Ordered and unordered lists receive consistent indentation, marker color, nested-list spacing,
  and readable item leading.
- Checklist controls align with their labels and use the semantic primary color.
- Links use the semantic primary color, underline treatment, hover feedback, visible keyboard focus,
  and safe word breaking.
- Blockquotes use the active semantic surface, divider token, readable padding, and italic/citation
  treatment without hard-coded colors.
- Inline code uses the mono family and a subtle semantic background. Code blocks use the mono family,
  card surface tokens, horizontal overflow, and readable padding.
- Horizontal rules use the semantic border token and appropriate vertical rhythm.
- Uploaded images remain responsive. Figures, image borders, and captions use the theme radius,
  border, and supporting-text semantics.
- Existing text alignment and indentation from Lexical remain supported without causing overflow.

The ordinary body size remains at least the existing `text-base` token. Reading measure remains
controlled by each consumer: the Rich Text block keeps its configured maximum width, while detail
pages keep their existing main-column layout.

## Compact Lexical Presentation

Q&A Accordion answers retain compact type sizes and reduced vertical spacing. They may reuse the
shared colors, focus states, list treatment, inline-code treatment, and overflow protections, but
must not inherit the long-form heading scale or article paragraph margins.

## News & Events Sidebar Metadata

`Story Details` and `Share This` headings retain the theme display family. Share buttons retain the
theme text/sans family.

Within Story Details:

- Author, Date/Event Date, Category, and Location labels use `font-mono`, `text-xs`, uppercase text,
  and tracked lettering.
- Their values use `font-mono`, `text-sm`, medium weight, and compact readable leading.
- Date values use tabular numerals.
- Existing semantic foreground/supporting colors, icons, spacing, surfaces, and outlines remain
  unchanged.

## Compatibility And Fallbacks

- Existing Lexical JSON requires no migration.
- Unsupported or absent nodes continue to be handled by Payload's Lexical renderer.
- Theme presets continue to resolve their own display, text, and mono families through existing font
  tokens.
- Light, dark, page, subtle, brand, and semantic card surfaces must remain readable.
- Production and live preview use the same presentation classes.

## Verification

Add focused assertions for:

- the shared long-form preset on News & Events, Articles, and Rich Text blocks;
- heading, paragraph, list, link/focus, blockquote, code, media/caption, rule, checklist, alignment,
  indentation, and overflow classes;
- the compact Q&A preset retaining compact spacing;
- mono sidebar labels and values plus tabular dates;
- no Payload or server-only imports in the shared presentation module.

Run affected integration tests, TypeScript, targeted ESLint and Prettier, the frontend design detector,
and the required project-context update/check loop.
