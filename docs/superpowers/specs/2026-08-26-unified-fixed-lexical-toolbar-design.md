# Unified Fixed Lexical Toolbar Design

## Goal

Give every production Lexical field the same complete, always-visible fixed toolbar while preserving
the existing feature set, stored Lexical JSON, frontend rendering, and Admin editor styling.

## Scope

The unified editor applies to all four current rich-text field locations:

- Article `body`
- News & Events `body`
- Rich Text block `content`
- Q&A Accordion `items[].answer`

This change affects authoring presentation only. It does not remove or add formatting features,
change frontend typography, alter stored content, or require a content migration.

## Editor Architecture

`src/fields/bodyEditorConfig.ts` will expose one canonical project editor. It will retain the current
writing feature set:

- Paragraphs and H2–H6 headings, with H1 reserved for the surrounding document title
- Blockquotes and horizontal rules
- Bold, italic, underline, strikethrough, and inline code
- Ordered, unordered, and checklist lists
- Page links and Media uploads
- Alignment and indentation

The editor will always register `FixedToolbarFeature`. `InlineToolbarFeature`, the toolbar-mode
factory parameter, and the separate `bodyEditor` / `embeddedContentEditor` aliases will be removed.
Every rich-text field will import and use the canonical editor explicitly.

The Payload-level editor fallback will also use the canonical project editor so future rich-text
fields cannot silently receive a different default feature set. Explicit field assignment remains
required and covered by tests for the current production fields.

## Admin Presentation

The existing unified editor card in `src/app/(payload)/custom.scss` remains the presentation owner.
All editors will therefore receive:

- One bordered editor card
- A fixed toolbar strip at the top
- The existing 250px minimum editing area
- Existing gutter suppression, spacing, focus treatment, and Admin theme colors

The former no-fixed-toolbar selector can be removed because no project editor will use the compact
inline-toolbar presentation after this change. Nested Q&A editors remain inside their existing
collapsed array rows, but opening a row shows the same complete fixed toolbar as every other editor.

## Data and Rendering

The serialized Lexical document shape does not change. Existing Article, News/Event, Rich Text, and
Q&A content remains valid without migration. Production and live-preview renderers continue using
the existing long-form and compact frontend typography presets; toolbar presentation has no effect
on rendered HTML.

## Verification

Tests will verify that:

- The canonical editor registers the complete current feature set and `FixedToolbarFeature`.
- `InlineToolbarFeature` and the old embedded editor alias are absent.
- Article, News/Event, Rich Text block, and Q&A fields all use the canonical editor.
- A recursive schema contract identifies every current `richText` field and rejects an unapproved
  editor configuration.
- Existing rich-text presentation, Article, News/Event, Q&A, Page block, and block-catalog tests
  continue to pass.

Because this is a schema/Admin configuration change, Payload types and the Admin import map will be
regenerated and checked. Project context will be updated and verified before handoff.

## Non-goals

- Changing the available formatting features
- Restricting Q&A answer formatting
- Fixing frontend internal-link conversion
- Adding custom Lexical nodes or converters
- Changing frontend rich-text typography
- Migrating existing content
