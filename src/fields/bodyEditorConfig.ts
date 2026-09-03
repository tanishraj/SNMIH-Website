import {
  AlignFeature,
  BlockquoteFeature,
  BoldFeature,
  ChecklistFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  IndentFeature,
  InlineCodeFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  StrikethroughFeature,
  UnderlineFeature,
  UnorderedListFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'

/**
 * Every project-owned rich-text field uses one complete, always-visible toolbar.
 * H1 remains reserved for the surrounding Page or entry title.
 */
export const projectEditor = lexicalEditor({
  admin: {
    hideGutter: true,
    hideAddBlockButton: true,
    hideDraggableBlockElement: true,
    hideInsertParagraphAtEnd: true,
  },
  features: [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4', 'h5', 'h6'] }),
    BlockquoteFeature(),
    HorizontalRuleFeature(),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    InlineCodeFeature(),
    OrderedListFeature(),
    UnorderedListFeature(),
    ChecklistFeature(),
    LinkFeature({ enabledCollections: ['pages'] }),
    UploadFeature({ enabledCollections: ['media'] }),
    AlignFeature(),
    IndentFeature(),
    FixedToolbarFeature(),
  ],
})
