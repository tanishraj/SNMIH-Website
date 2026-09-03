# Lexical Rhythm and Story Metadata Design

## Goal

Reduce the visual weight of long-form subheadings, preserve smooth spacing between every supported Lexical element, and clarify the typography roles inside the News/Event Story Details card.

## Long-form heading hierarchy

H1 remains unavailable in project-owned editors and retains its defensive legacy style. H2–H6 use `var(--font-text)`, semibold weight, tight tracking, and the following smaller responsive scale:

| Heading | Small screens | `sm` and above | Top / bottom rhythm |
| ------- | ------------- | -------------- | ------------------- |
| H2      | `text-2xl`    | `text-3xl`     | `mt-10` / `mb-3`    |
| H3      | `text-xl`     | `text-2xl`     | `mt-8` / `mb-3`     |
| H4      | `text-lg`     | `text-xl`      | `mt-7` / `mb-2`     |
| H5      | `text-base`   | `text-lg`      | `mt-6` / `mb-2`     |
| H6      | `text-sm`     | `text-base`    | `mt-5` / `mb-2`     |

The scale remains strictly descending and no heading uses Playfair or `var(--font-display)`.

## Long-form vertical rhythm

- Remove the top margin from the first rendered child and the bottom margin from the last rendered child.
- Paragraphs use `my-4` with the established readable `leading-8`.
- Ordered and unordered lists use `my-5`; list items use `my-1.5` and retain `leading-7`.
- Nested lists use a compact `my-2` rhythm so indentation does not create large vertical gaps.
- Blockquotes, code blocks, and figures use `my-6`.
- Horizontal rules use `my-8` to remain a clear section boundary.
- Existing link, checklist, alignment, indentation, and overflow behavior remains unchanged.

The compact Q&A preset keeps its dense body rhythm but receives a smaller descending heading scale:

| Heading | Compact size |
| ------- | ------------ |
| H2      | `text-xl`    |
| H3      | `text-lg`    |
| H4      | `text-base`  |
| H5      | `text-sm`    |
| H6      | `text-xs`    |

Compact headings use progressively reduced top spacing and a consistent small bottom gap.

## Empty Lexical paragraphs

Payload renders an empty paragraph as:

```html
<p><br /></p>
```

The shared semantic preset hides only paragraphs whose sole element child is a `br`, using a scoped `p:has(> br:only-child)` selector. Paragraphs containing text, links, formatting spans, images, or multiple breaks remain visible. Because this rule belongs to the shared preset, it applies consistently to Article, News/Event, Rich Text block, and Q&A output.

## Story Details typography

- Labels remain IBM Plex Mono through `font-mono`, uppercase, `text-xs`, and tracked, but move from semibold to regular weight.
- Values use `var(--font-text)` rather than mono, at `text-sm`, `leading-5`, and medium weight.
- Author, date, category, and location values share the same typography.
- Date values retain `tabular-nums`; other values do not receive numeric styling.
- Card headings, icons, surfaces, spacing, data, and layout remain unchanged.

## Verification

Focused tests will verify the exact H2–H6 scales and spacing tokens, the scoped empty-paragraph selector, compact hierarchy, regular mono labels, text-family values, and date-only tabular numerals. The existing News/Event story, Q&A, Rich Text, and detail-template suites must remain green, followed by TypeScript, lint, formatting, typography detection, and project-context update/check.

## Scope boundaries

- Do not change the page-level title or overlay title scale.
- Do not re-enable H1 in any editor.
- Do not change the Story Details data model or card layout.
- Do not add new fonts, colors, or hardcoded pixel sizes.
- Do not change the user-selected `30rem` desktop sidebar width.
