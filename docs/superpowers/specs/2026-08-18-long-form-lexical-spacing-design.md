# Long-form Lexical Spacing Design

## Goal

Make long-form Lexical content feel slightly denser while preserving its established typography,
hierarchy, readability, and shared behavior.

## Scope

The change applies only to `longFormRichTextClasses`, which is shared by Article details, News/Event
details, and Rich Text blocks. It does not change surrounding block spacing, featured media, excerpts,
sidebars, metadata, or the compact Q&A preset.

## Spacing contract

- Reduce H2–H6 top and bottom margins by one Tailwind spacing step.
- Reduce paragraph margins from `my-4` to `my-3`.
- Reduce list margins from `my-5` to `my-4`.
- Reduce list-item margins from `my-1.5` to `my-1`.
- Reduce nested-list margins from `my-2` to `my-1.5`.
- Reduce blockquote, code-block, and figure margins from `my-6` to `my-5`.
- Reduce horizontal-rule margins from `my-8` to `my-6`.

The heading margin sequence becomes:

| Heading | Top margin | Bottom margin |
| ------- | ---------- | ------------- |
| H2      | `mt-9`     | `mb-2.5`      |
| H3      | `mt-7`     | `mb-2.5`      |
| H4      | `mt-6`     | `mb-1.5`      |
| H5      | `mt-5`     | `mb-1.5`      |
| H6      | `mt-4`     | `mb-1.5`      |

## Preserved behavior

- Heading sizes, font families, font weights, tracking, and line heights remain unchanged.
- H2 remains 24px on small screens and uses the shared 28px editorial token from `sm` upward.
- Empty `<p><br></p>` suppression remains unchanged.
- First-child and last-child boundary normalization remains unchanged.
- All spacing continues to use Tailwind tokens; no component-level pixel values are introduced.

## Verification

Update the shared rich-text presentation contract test with the tighter spacing values. Run the
focused rich-text consumers, TypeScript, lint, formatting, UI-quality detection, and the required
project-context update/check loop.
