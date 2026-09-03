# Complete Lexical Typography Design

## Goal

Give every supported Payload Lexical element a consistent, theme-aware frontend presentation while preserving correct document hierarchy. Rich-text headings must use the normal text family rather than the site display family.

## Editor contract

- Reserve H1 for the page or entry title rendered outside Lexical content.
- Remove H1 from every project-owned Lexical heading menu.
- Expose H2, H3, H4, H5, and H6 consistently in the Article, News & Event, Rich Text block, and Q&A editors.
- Keep defensive frontend styling for previously stored H1 nodes so legacy content remains readable.
- Retain the existing supported writing features: paragraphs, ordered and unordered lists, checklists, blockquotes, bold, italic, underline, strikethrough, inline code, links, uploads/images, horizontal rules, alignment, and indentation.
- Preserve the global Payload defaults that are not part of project-owned rich-text fields; this change should make the four known project editors explicit instead of depending on package defaults.

## Rendered DOM contract

Payload's default Lexical JSX converters produce the following relevant markup:

- headings as semantic `h1` through `h6` elements;
- paragraphs as `p`;
- unordered and ordered lists as `ul` and `ol`, with `li` children;
- checklists as list items with `role="checkbox"`, an `input[type="checkbox"]`, and a `label`;
- blockquotes as `blockquote`;
- bold and italic text as `strong` and `em`;
- underline and strikethrough as decorated `span` elements;
- inline code as `code`;
- links as `a`;
- images as `img` or responsive `picture` plus `source` and `img`;
- non-image uploads as links;
- horizontal rules as `hr`.

Shared presentation must target these semantic elements and Payload's checklist attributes/classes without requiring custom JSX converters.

## Typography system

All rich-text headings use `var(--font-text)`. The shared prose wrapper also uses `var(--font-text)`, while inline code and preformatted code retain `var(--font-mono)`. Playfair/`var(--font-display)` is not used anywhere inside rendered Lexical content.

The long-form heading scale is responsive and strictly descending:

| Heading         | Small screens | `sm` and above |
| --------------- | ------------- | -------------- |
| H1, legacy only | `text-4xl`    | `text-5xl`     |
| H2              | `text-3xl`    | `text-4xl`     |
| H3              | `text-2xl`    | `text-3xl`     |
| H4              | `text-xl`     | `text-2xl`     |
| H5              | `text-lg`     | `text-xl`      |
| H6              | `text-base`   | `text-lg`      |

All headings use semibold weight, tight tracking, balanced wrapping, and heading-specific vertical rhythm. Heading spacing decreases with heading rank while maintaining a visible separation from preceding body content.

Paragraphs remain normal text at the established readable line height. Long-form content preserves a comfortable prose measure through its existing container ownership rather than imposing a second width inside the shared preset.

## Element presentation

- Paragraphs use consistent vertical rhythm and readable leading.
- Ordered and unordered lists retain native marker semantics, sufficient indentation, nested-list spacing, and themed marker color.
- Checklists align the checkbox and label, use the primary accent color, remove duplicate bullet markers, and visibly distinguish checked items without reducing readability.
- Blockquotes use a themed border, subtle semantic surface, readable padding, and inherited text color.
- Bold, italic, underline, and strikethrough retain semantic emphasis. Underlines have a readable offset; struck text is visually secondary but remains legible.
- Links use the semantic primary color, visible underline treatment, hover feedback, word breaking, and keyboard focus indication.
- Inline code uses the mono family, a subtle semantic background, and compact padding. Preformatted content remains horizontally scrollable and does not force page overflow.
- Images and pictures are responsive, constrained to their container, and use the established radius and border tokens. Captions retain the compact secondary role when present.
- Horizontal rules use the semantic border token with spacing appropriate to long-form and compact contexts.
- Existing alignment and indentation styles remain supported without creating horizontal overflow.

## Long-form and compact presets

The existing client-safe shared module remains the only owner of Lexical presentation:

- `longFormRichTextClasses` is used by Article pages, News/Event stories, and the Rich Text block.
- `compactRichTextClasses` is used by Q&A answers.

The compact preset uses the same font roles, semantic colors, and element coverage, but applies a deliberately smaller heading scale and tighter spacing so an accordion answer cannot resemble a page title. It must still preserve visible rank differences from H2 through H6.

## Accessibility and resilience

- Semantic heading and list elements remain unchanged.
- H1 is absent from editor menus to prevent duplicate page-level H1s.
- Focus-visible link treatment remains keyboard accessible.
- Checklist inputs remain read-only representations of saved content and keep their accessible label relationship.
- Text and borders rely on semantic theme tokens for light and dark surfaces.
- Responsive typography uses existing Tailwind scale tokens rather than hardcoded pixel values.
- Legacy H1, nested lists, long links, wide code, large images, and missing media metadata must not break the content container.

## Verification

Focused tests will verify:

1. every project-owned Lexical editor explicitly enables H2 through H6 and excludes H1;
2. the shared presets use `var(--font-text)` for headings and never use `var(--font-display)`;
3. the long-form H1 through H6 scale is complete and strictly descending;
4. the compact preset has its own smaller H2 through H6 hierarchy;
5. selectors cover paragraphs, lists, checklist markup, blockquotes, emphasis, decorated spans, code, links, responsive image markup, and horizontal rules;
6. Article, News/Event, Rich Text, and Q&A consumers continue to use the correct shared preset;
7. TypeScript, targeted lint/format checks, focused integration tests, and project-context update/check pass.

## Scope boundaries

- Do not change global site heading typography outside rendered Lexical content.
- Do not add font-family, font-size, or color controls to the admin editor.
- Do not replace Payload's default JSX converters.
- Do not introduce additional font families.
- Do not redesign the News/Event detail layout, metadata cards, or sharing controls.
