# Testimonial Spotlight Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-class `Testimonial Spotlight` page block that presents one image, one editorial statement, supporting copy, and one person's attribution in a configurable left/right split layout without buttons.

**Architecture:** Create a dedicated Payload block rather than expanding Feature Spotlight or Quote Block. Keep the renderer server-only, compose the existing appearance, spacing, media, eyebrow, and content-style utilities, and register the block through Pages, Reusable Sections, production rendering, live preview, and the thumbnail system.

**Tech Stack:** Payload CMS 3.85, Next.js 16 App Router, React 19 Server Components, TypeScript, Tailwind CSS 4, Vitest, React DOM server rendering, Playwright-backed thumbnail generation.

## Global Constraints

- Do not create a git commit; all implementation, generated files, tests, documentation, and planning artifacts must remain uncommitted.
- The block owns exactly one person and one message.
- Rendered content order is eyebrow, title, testimonial, description, person name, and designation.
- Image placement is configurable as left or right on desktop; mobile always renders the image before content.
- Preserve shared Background, Border, Image Position, Media Fill, Section Padding, and Content Vertical Alignment controls.
- Do not expose actions, footer actions, tabs, a carousel, pagination, ratings, or switching controls.
- Do not add client-side JavaScript or a Client Component.
- Do not add block-specific font families, raw palette colors, new theme tokens, or changes to `theme-snmih.css`.
- Existing blocks and stored documents remain unchanged; no migration or compatibility alias is required.
- Use the Media record's alt text through `getMediaImageProps`.
- Use semantic `figure`, `blockquote`, and `figcaption` markup.

---

## File Map

### Create

- `src/blocks/TestimonialSpotlight/config.ts` — Payload schema, defaults, appearance controls, and thumbnail metadata.
- `src/blocks/TestimonialSpotlight/Component.tsx` — server-rendered split layout and semantic testimonial markup.
- `tests/int/testimonial-spotlight-config.int.spec.ts` — schema and collection-registration contract.
- `tests/int/testimonial-spotlight-render.int.spec.tsx` — rendering, responsive-class, semantics, safety, and renderer-registration contract.
- `public/block-thumbnails/testimonial-spotlight.jpg` — generated 1600×900 admin-picker thumbnail.

### Modify

- `src/collections/Pages.ts` — add the block to normal Page layouts.
- `src/collections/ReusableSections.ts` — add the block to reusable layouts in the same relative order.
- `src/blocks/renderPageBlocks.tsx` — route the new slug through the production error boundary.
- `src/blocks/renderLivePreviewPageBlocks.tsx` — route the same slug through live preview.
- `src/block-thumbnails/definitions.ts` — define canonical picker metadata.
- `src/block-thumbnails/fixtures.tsx` — render the production component in the thumbnail preview.
- `tests/int/block-thumbnails.int.spec.ts` — assert the new thumbnail definition.
- `tests/int/block-surface-semantics.int.spec.ts` — include the component in inherited-surface enforcement.
- `tests/int/section-eyebrow.int.spec.tsx` — include the component in shared-eyebrow enforcement.
- `src/payload-types.ts` — regenerate the `TestimonialSpotlightBlock` type and layout unions.
- `docs/guides/blocks.md` — add the operator-facing block catalog entry.
- `docs/architecture/feature-inventory.md` — update the Page block count and catalog.
- `.agents/skills/project-context/references/block-system.md` — update the maintained block-system registry description.
- `.agents/skills/project-context/references/project-inventory.json` — regenerate project knowledge after all source changes.

---

### Task 1: Add the Payload schema and collection registrations

**Files:**

- Create: `src/blocks/TestimonialSpotlight/config.ts`
- Create: `tests/int/testimonial-spotlight-config.int.spec.ts`
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/collections/Pages.ts`
- Modify: `src/collections/ReusableSections.ts`
- Generate: `src/payload-types.ts`

**Interfaces:**

- Consumes: `createBlockAppearanceFields(): GroupField` and `getBlockThumbnailAdmin(slug)`.
- Produces: `TestimonialSpotlightBlock: Block`, slug `testimonialSpotlight`, and generated `TestimonialSpotlightBlock` Payload type.

- [ ] **Step 1: Write the failing schema and registration test**

Create `tests/int/testimonial-spotlight-config.int.spec.ts`:

```ts
import type { Block, Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { TestimonialSpotlightBlock } from '@/blocks/TestimonialSpotlight/config'
import { Pages } from '@/collections/Pages'
import { ReusableSections } from '@/collections/ReusableSections'

const collectRegisteredBlocks = (fields: Field[]): Block[] =>
  fields.flatMap((field) => {
    if (field.type === 'blocks') return field.blocks
    if (field.type === 'tabs') {
      return field.tabs.flatMap((tab) => collectRegisteredBlocks(tab.fields))
    }
    if ('fields' in field && Array.isArray(field.fields)) {
      return collectRegisteredBlocks(field.fields)
    }
    return []
  })

const getNamedField = <T extends { name?: string }>(fields: unknown[], name: string) =>
  fields.find(
    (field): field is T =>
      typeof field === 'object' && field !== null && 'name' in field && field.name === name,
  )

describe('testimonial spotlight config', () => {
  it('uses the canonical Payload identity and two-tab editor structure', () => {
    expect(TestimonialSpotlightBlock.slug).toBe('testimonialSpotlight')
    expect(TestimonialSpotlightBlock.interfaceName).toBe('TestimonialSpotlightBlock')
    expect(TestimonialSpotlightBlock.labels).toEqual({
      singular: 'Testimonial Spotlight',
      plural: 'Testimonial Spotlights',
    })

    const tabsField = TestimonialSpotlightBlock.fields[0] as {
      tabs?: Array<{ fields: unknown[]; label: string }>
      type?: string
    }

    expect(tabsField.type).toBe('tabs')
    expect(tabsField.tabs?.map(({ label }) => label)).toEqual(['Content', 'Theme Settings'])
  })

  it('defines one required image, statement, title, and person without actions', () => {
    const tabsField = TestimonialSpotlightBlock.fields[0] as {
      tabs?: Array<{ fields: unknown[]; label: string }>
    }
    const contentFields = tabsField.tabs?.find(({ label }) => label === 'Content')?.fields ?? []

    expect(contentFields.map((field) => (field as { name?: string }).name)).toEqual([
      'image',
      'eyebrow',
      'title',
      'testimonial',
      'description',
      'personName',
      'designation',
    ])
    expect(
      getNamedField<{ relationTo?: string; required?: boolean; type?: string }>(
        contentFields,
        'image',
      ),
    ).toMatchObject({
      relationTo: 'media',
      required: true,
      type: 'upload',
    })
    for (const name of ['title', 'testimonial', 'personName']) {
      expect(getNamedField<{ required?: boolean }>(contentFields, name)?.required).toBe(true)
    }
    expect(getNamedField(contentFields, 'actions')).toBeUndefined()
    expect(getNamedField(contentFields, 'footerActions')).toBeUndefined()
  })

  it('reuses shared appearance and the complete split-layout control set', () => {
    const tabsField = TestimonialSpotlightBlock.fields[0] as {
      tabs?: Array<{ fields: unknown[]; label: string }>
    }
    const fields = tabsField.tabs?.find(({ label }) => label === 'Theme Settings')?.fields ?? []
    const expected = {
      mediaPosition: { defaultValue: 'left', values: ['left', 'right'] },
      imagePosition: {
        defaultValue: 'center',
        values: ['center', 'top', 'bottom', 'left', 'right'],
      },
      mediaFillMode: {
        defaultValue: 'contained',
        values: ['contained', 'containedFill', 'edgeToEdge'],
      },
      size: {
        defaultValue: 'default',
        values: ['none', 'compact', 'default', 'comfortable'],
      },
      contentVerticalAlignment: {
        defaultValue: 'center',
        values: ['top', 'center', 'bottom'],
      },
    }

    expect(getNamedField<{ type?: string }>(fields, 'appearance')?.type).toBe('group')
    for (const [name, contract] of Object.entries(expected)) {
      const field = getNamedField<{
        defaultValue?: string
        options?: Array<{ value: string }>
        required?: boolean
        type?: string
      }>(fields, name)
      expect(field?.type).toBe('select')
      expect(field?.required).toBe(true)
      expect(field?.defaultValue).toBe(contract.defaultValue)
      expect(field?.options?.map(({ value }) => value)).toEqual(contract.values)
    }
    expect(getNamedField(fields, 'layoutMode')).toBeUndefined()
    expect(getNamedField(fields, 'contentAlignment')).toBeUndefined()
  })

  it('registers the block for Pages and Reusable Sections', () => {
    const pageSlugs = collectRegisteredBlocks(Pages.fields).map(({ slug }) => slug)
    const reusableSlugs = collectRegisteredBlocks(ReusableSections.fields).map(({ slug }) => slug)

    expect(pageSlugs).toContain('testimonialSpotlight')
    expect(reusableSlugs).toContain('testimonialSpotlight')
    expect(pageSlugs.indexOf('testimonialSpotlight')).toBe(
      pageSlugs.indexOf('featureSpotlight') + 1,
    )
    expect(reusableSlugs.indexOf('testimonialSpotlight')).toBe(
      reusableSlugs.indexOf('featureSpotlight') + 1,
    )
  })
})
```

- [ ] **Step 2: Run the focused test and confirm the missing module failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-config.int.spec.ts
```

Expected: FAIL because `@/blocks/TestimonialSpotlight/config` does not exist.

- [ ] **Step 3: Add thumbnail metadata needed by the block config**

Insert after the Feature Spotlight definition in `src/block-thumbnails/definitions.ts`:

```ts
  defineThumbnail({
    alt: 'Testimonial Spotlight block preview',
    filename: 'testimonial-spotlight.jpg',
    label: 'Testimonial Spotlight',
    slug: 'testimonialSpotlight',
  }),
```

- [ ] **Step 4: Implement the complete block schema**

Create `src/blocks/TestimonialSpotlight/config.ts`:

```ts
import type { Block, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'

export const TestimonialSpotlightBlock: Block = {
  slug: 'testimonialSpotlight',
  interfaceName: 'TestimonialSpotlightBlock',
  admin: getBlockThumbnailAdmin('testimonialSpotlight'),
  labels: {
    singular: 'Testimonial Spotlight',
    plural: 'Testimonial Spotlights',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'eyebrow',
              type: 'text',
            },
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'testimonial',
              type: 'textarea',
              required: true,
            },
            {
              name: 'description',
              type: 'textarea',
            },
            {
              name: 'personName',
              label: 'Person Name',
              type: 'text',
              required: true,
            },
            {
              name: 'designation',
              type: 'text',
            },
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            {
              name: 'mediaPosition',
              label: 'Image Placement',
              type: 'select',
              defaultValue: 'left',
              options: [
                { label: 'Image Left', value: 'left' },
                { label: 'Image Right', value: 'right' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'imagePosition',
              label: 'Background Position',
              type: 'select',
              defaultValue: 'center',
              options: [
                { label: 'Center', value: 'center' },
                { label: 'Top', value: 'top' },
                { label: 'Bottom', value: 'bottom' },
                { label: 'Left', value: 'left' },
                { label: 'Right', value: 'right' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'mediaFillMode',
              label: 'Media Fill',
              type: 'select',
              defaultValue: 'contained',
              options: [
                { label: 'Contained', value: 'contained' },
                { label: 'Contained Fill', value: 'containedFill' },
                { label: 'Edge to Edge', value: 'edgeToEdge' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'size',
              label: 'Section Padding',
              type: 'select',
              defaultValue: 'default',
              options: [
                { label: 'None', value: 'none' },
                { label: 'Compact', value: 'compact' },
                { label: 'Default', value: 'default' },
                { label: 'Comfortable', value: 'comfortable' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'contentVerticalAlignment',
              label: 'Content Vertical Alignment',
              type: 'select',
              defaultValue: 'center',
              options: [
                { label: 'Top', value: 'top' },
                { label: 'Center', value: 'center' },
                { label: 'Bottom', value: 'bottom' },
              ],
              required: true,
            } satisfies SelectField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
```

- [ ] **Step 5: Register the block in both content collections**

Add this import beside Feature Spotlight in `src/collections/Pages.ts` and `src/collections/ReusableSections.ts`:

```ts
import { TestimonialSpotlightBlock } from '@/blocks/TestimonialSpotlight/config'
```

Add the block immediately after `FeatureSpotlightBlock` in both layout arrays:

```ts
                FeatureSpotlightBlock,
                TestimonialSpotlightBlock,
                FeatureMatrixBlock,
```

Use the existing indentation in `ReusableSections.ts` while keeping the same relative order.

- [ ] **Step 6: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: PASS; `src/payload-types.ts` contains `TestimonialSpotlightBlock`, `blockType: 'testimonialSpotlight'`, and selection types for both Page and Reusable Section layouts.

- [ ] **Step 7: Run the focused config test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-config.int.spec.ts
```

Expected: PASS.

- [ ] **Step 8: Review the task diff without committing**

Run:

```bash
git diff -- src/blocks/TestimonialSpotlight/config.ts src/block-thumbnails/definitions.ts src/collections/Pages.ts src/collections/ReusableSections.ts src/payload-types.ts tests/int/testimonial-spotlight-config.int.spec.ts
```

Expected: only the new schema, canonical thumbnail metadata, paired registrations, generated type additions, and focused test appear. Do not commit.

---

### Task 2: Implement semantic server rendering and both renderer routes

**Files:**

- Create: `src/blocks/TestimonialSpotlight/Component.tsx`
- Create: `tests/int/testimonial-spotlight-render.int.spec.tsx`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx`
- Modify: `tests/int/block-surface-semantics.int.spec.ts`
- Modify: `tests/int/section-eyebrow.int.spec.tsx`

**Interfaces:**

- Consumes: `TestimonialSpotlightBlock` generated values, `resolveBlockAppearanceClasses`, `regularBlockContainerClasses`, `regularBlockMobilePaddingClasses`, `contentSectionHeadingClasses`, `contentSectionDescriptionClasses`, `SectionEyebrow`, `getMediaImageProps`, and `cn`.
- Produces: `TestimonialSpotlightBlockComponent(props): ReactNode`, production `testimonialSpotlight` switch coverage, and live-preview `testimonialSpotlight` switch coverage.

- [ ] **Step 1: Write the failing rendering contract**

Create `tests/int/testimonial-spotlight-render.int.spec.tsx`:

```tsx
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { TestimonialSpotlightBlockComponent } from '@/blocks/TestimonialSpotlight/Component'
import { renderLivePreviewPageBlocks } from '@/blocks/renderLivePreviewPageBlocks'
import { renderPageBlocks } from '@/blocks/renderPageBlocks'

const baseProps = {
  appearance: { background: 'subtle' as const, border: 'topAndBottom' as const },
  description: 'Her leadership connects education, care, and service across the institution.',
  designation: 'Founder',
  eyebrow: 'Message from management',
  image: { alt: 'Founder standing outdoors', url: '/media/founder.jpg' } as never,
  personName: 'Shri Ravindra Kumar Singh',
  testimonial:
    'Our aim is to build an institution where education, healthcare, and service strengthen one another.',
  title: 'Leadership with a long-term purpose.',
}

describe('testimonial spotlight rendering', () => {
  it('renders the exact hierarchy with semantic testimonial attribution and no actions', () => {
    const html = renderToStaticMarkup(createElement(TestimonialSpotlightBlockComponent, baseProps))

    expect(html).toContain('data-testimonial-spotlight="true"')
    expect(html).toContain('<figure')
    expect(html).toContain('<blockquote')
    expect(html).toContain('<figcaption')
    expect(html).toContain('font-[family-name:var(--font-display)]')
    expect(html).toContain('data-section-eyebrow="true"')
    expect(html).toContain('data-section-eyebrow-surface="subtle"')
    expect(html.indexOf('Message from management')).toBeLessThan(
      html.indexOf('Leadership with a long-term purpose.'),
    )
    expect(html.indexOf('Leadership with a long-term purpose.')).toBeLessThan(
      html.indexOf('Our aim is to build'),
    )
    expect(html.indexOf('Our aim is to build')).toBeLessThan(
      html.indexOf('Her leadership connects'),
    )
    expect(html.indexOf('Her leadership connects')).toBeLessThan(
      html.indexOf('Shri Ravindra Kumar Singh'),
    )
    expect(html.indexOf('Shri Ravindra Kumar Singh')).toBeLessThan(html.indexOf('Founder'))
    expect(html).not.toContain('<button')
    expect(html).not.toContain('<a')
  })

  it('mirrors a right-side image on desktop while keeping media first in source order', () => {
    const html = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        ...baseProps,
        contentVerticalAlignment: 'top',
        imagePosition: 'right',
        mediaPosition: 'right',
      }),
    )

    expect(html).toContain('data-testimonial-spotlight-media-position="right"')
    expect(html).toContain('data-testimonial-spotlight-image-position="right"')
    expect(html).toContain('data-testimonial-spotlight-content-vertical-alignment="top"')
    expect(html).toContain('md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]')
    expect(html).toContain('md:order-2')
    expect(html).toContain('object-[right_center]')
    expect(html.indexOf('<img')).toBeLessThan(html.indexOf('<h2'))
  })

  it.each(['containedFill', 'edgeToEdge'] as const)(
    'supports the %s fill contract with mobile and desktop padding',
    (mediaFillMode) => {
      const html = renderToStaticMarkup(
        createElement(TestimonialSpotlightBlockComponent, {
          ...baseProps,
          mediaFillMode,
          size: 'comfortable',
        }),
      )

      expect(html).toContain(`data-testimonial-spotlight-media-fill="${mediaFillMode}"`)
      expect(html).toContain(`data-testimonial-spotlight-media-frame="${mediaFillMode}"`)
      expect(html).toContain('py-20 md:py-0')
      expect(html).toContain('md:py-16')
      expect(html).toContain('object-cover')
      if (mediaFillMode === 'edgeToEdge') {
        expect(html).toContain('px-4 pt-8 md:px-8 md:py-16 lg:px-12')
      } else {
        expect(html).toContain('pt-8 md:px-8 md:py-16 lg:px-12')
      }
    },
  )

  it('omits optional fields cleanly and fails safely when required content is unresolved', () => {
    const minimal = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        image: baseProps.image,
        personName: baseProps.personName,
        testimonial: baseProps.testimonial,
        title: baseProps.title,
      }),
    )
    const missingMedia = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        personName: baseProps.personName,
        testimonial: baseProps.testimonial,
        title: baseProps.title,
      }),
    )

    expect(minimal).not.toContain('<p></p>')
    expect(missingMedia).toBe('')
  })

  it('renders through production and live-preview block pipelines', () => {
    const block = { ...baseProps, blockType: 'testimonialSpotlight' } as never
    const production = renderToStaticMarkup(renderPageBlocks([block]))
    const preview = renderToStaticMarkup(
      renderLivePreviewPageBlocks([block], {} as never, {} as never, [], []),
    )

    expect(production).toContain('data-page-block-stack="true"')
    expect(production).toContain('data-testimonial-spotlight="true"')
    expect(preview).toContain('data-page-block-stack="true"')
    expect(preview).toContain('data-testimonial-spotlight="true"')
  })
})
```

- [ ] **Step 2: Run the render test and confirm the missing component failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-render.int.spec.tsx
```

Expected: FAIL because `@/blocks/TestimonialSpotlight/Component` does not exist.

- [ ] **Step 3: Implement the server component**

Create `src/blocks/TestimonialSpotlight/Component.tsx`:

```tsx
import Image from 'next/image'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
import {
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { getMediaImageProps } from '@/lib/media'
import { cn } from '@/lib/utils'

type TestimonialSpotlightBlockLike = {
  appearance?: BlockAppearance | null
  contentVerticalAlignment?: 'bottom' | 'center' | 'top' | null
  description?: string | null
  designation?: string | null
  eyebrow?: string | null
  image?: unknown
  imagePosition?: 'bottom' | 'center' | 'left' | 'right' | 'top' | null
  mediaFillMode?: 'contained' | 'containedFill' | 'edgeToEdge' | null
  mediaPosition?: 'left' | 'right' | null
  personName?: string | null
  size?: 'comfortable' | 'compact' | 'default' | 'none' | null
  testimonial?: string | null
  title?: string | null
}

const orderClasses = {
  left: { content: 'md:order-2', media: 'md:order-1' },
  right: { content: 'md:order-1', media: 'md:order-2' },
} as const

const gridTemplateClasses = {
  left: 'md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]',
  right: 'md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]',
} as const

const objectPositionClasses = {
  bottom: 'object-[center_bottom]',
  center: 'object-[center_center]',
  left: 'object-[left_center]',
  right: 'object-[right_center]',
  top: 'object-[center_top]',
} as const

const contentVerticalAlignmentClasses = {
  bottom: 'justify-end',
  center: 'justify-center',
  top: 'justify-start',
} as const

const mediaMinHeightClasses = {
  none: 'md:min-h-[24rem]',
  compact: 'md:min-h-[24rem]',
  default: 'md:min-h-[30rem]',
  comfortable: 'md:min-h-[36rem]',
} as const

export function TestimonialSpotlightBlockComponent({
  appearance,
  contentVerticalAlignment = 'center',
  description,
  designation,
  eyebrow,
  image,
  imagePosition = 'center',
  mediaFillMode = 'contained',
  mediaPosition = 'left',
  personName,
  size = 'default',
  testimonial,
  title,
}: TestimonialSpotlightBlockLike) {
  const resolvedTitle = title?.trim()
  const resolvedTestimonial = testimonial?.trim()
  const resolvedPersonName = personName?.trim()
  const resolvedDescription = description?.trim()
  const resolvedDesignation = designation?.trim()
  const resolvedEyebrow = eyebrow?.trim()
  const resolvedImagePosition = imagePosition ?? 'center'
  const resolvedMediaFillMode = mediaFillMode ?? 'contained'
  const resolvedMediaPosition = mediaPosition ?? 'left'
  const resolvedSize = size ?? 'default'
  const resolvedVerticalAlignment = contentVerticalAlignment ?? 'center'
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const media = getMediaImageProps({
    media: image as never,
    preset: 'generic',
    fallbackAlt: resolvedTitle,
  })

  if (!media || !resolvedTitle || !resolvedTestimonial || !resolvedPersonName) return null

  const isFilled = resolvedMediaFillMode !== 'contained'
  const order = orderClasses[resolvedMediaPosition]
  const mediaFrame = (
    <div
      className={cn(
        order.media,
        'relative aspect-4/3 overflow-hidden md:h-full md:aspect-auto',
        mediaMinHeightClasses[resolvedSize],
      )}
      data-testimonial-spotlight-media-frame={resolvedMediaFillMode}
    >
      <Image
        fill
        alt={media.alt}
        className={cn('object-cover', objectPositionClasses[resolvedImagePosition])}
        sizes="(max-width: 767px) 100vw, 40vw"
        src={media.src}
      />
    </div>
  )

  const content = (
    <div className="flex w-full max-w-3xl flex-col gap-5 text-left">
      {resolvedEyebrow ? (
        <SectionEyebrow surface={appearanceClasses.background}>{resolvedEyebrow}</SectionEyebrow>
      ) : null}
      <h2 className={contentSectionHeadingClasses}>{resolvedTitle}</h2>
      <figure className="flex flex-col gap-5">
        <blockquote className="font-[family-name:var(--font-display)] text-xl leading-snug font-medium text-pretty text-current sm:text-2xl lg:text-[1.75rem]">
          {resolvedTestimonial}
        </blockquote>
        {resolvedDescription ? (
          <p className={contentSectionDescriptionClasses}>{resolvedDescription}</p>
        ) : null}
        <figcaption className="flex flex-col gap-1 font-sans">
          <span className="text-sm font-semibold text-current">{resolvedPersonName}</span>
          {resolvedDesignation ? (
            <span className="text-sm leading-5 text-current/65">{resolvedDesignation}</span>
          ) : null}
        </figcaption>
      </figure>
    </div>
  )

  const splitLayout = (
    <div
      className={cn(
        'grid items-stretch gap-8',
        gridTemplateClasses[resolvedMediaPosition],
        isFilled ? 'md:gap-0' : 'md:gap-12 lg:gap-16',
      )}
    >
      {mediaFrame}
      <div
        className={cn(
          order.content,
          'flex min-h-full flex-col',
          contentVerticalAlignmentClasses[resolvedVerticalAlignment],
          isFilled &&
            (resolvedMediaFillMode === 'edgeToEdge'
              ? 'px-4 pt-8 md:px-8 md:py-16 lg:px-12'
              : 'pt-8 md:px-8 md:py-16 lg:px-12'),
        )}
      >
        {content}
      </div>
    </div>
  )

  return (
    <section
      className={cn(
        isFilled && regularBlockMobilePaddingClasses[resolvedSize],
        isFilled && 'md:py-0',
        appearanceClasses.className,
      )}
      data-testimonial-spotlight="true"
      data-testimonial-spotlight-background={appearanceClasses.background}
      data-testimonial-spotlight-content-vertical-alignment={resolvedVerticalAlignment}
      data-testimonial-spotlight-image-position={resolvedImagePosition}
      data-testimonial-spotlight-media-fill={resolvedMediaFillMode}
      data-testimonial-spotlight-media-position={resolvedMediaPosition}
      data-testimonial-spotlight-size={resolvedSize}
    >
      {resolvedMediaFillMode === 'edgeToEdge' ? (
        splitLayout
      ) : (
        <div
          className={cn(
            regularBlockContainerClasses,
            !isFilled && regularBlockMobilePaddingClasses[resolvedSize],
          )}
        >
          {splitLayout}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Register production and live-preview rendering**

Add this import beside Feature Spotlight in both renderer files:

```tsx
import { TestimonialSpotlightBlockComponent } from './TestimonialSpotlight/Component'
```

Add this production case immediately after `featureSpotlight` in `src/blocks/renderPageBlocks.tsx`:

```tsx
    case 'testimonialSpotlight':
      return wrap(<TestimonialSpotlightBlockComponent {...block} />)
```

Add this live-preview case in the same relative location in `src/blocks/renderLivePreviewPageBlocks.tsx`:

```tsx
    case 'testimonialSpotlight':
      return <TestimonialSpotlightBlockComponent key={key} {...block} />
```

- [ ] **Step 5: Extend the shared surface and eyebrow contract lists**

Add the new component after Feature Spotlight in `inheritedSurfaceFiles` inside `tests/int/block-surface-semantics.int.spec.ts`:

```ts
  'src/blocks/TestimonialSpotlight/Component.tsx',
```

Add the same path after Feature Spotlight in `regularSectionEyebrowFiles` inside `tests/int/section-eyebrow.int.spec.tsx`:

```ts
  'src/blocks/TestimonialSpotlight/Component.tsx',
```

- [ ] **Step 6: Run focused rendering and theme contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-render.int.spec.tsx tests/int/block-surface-semantics.int.spec.ts tests/int/section-eyebrow.int.spec.tsx
```

Expected: PASS. The rendered markup contains the image before the heading in source order, uses only `md:*` reversal classes, inherits semantic surface text, and consumes `SectionEyebrow`.

- [ ] **Step 7: Review the task diff without committing**

Run:

```bash
git diff -- src/blocks/TestimonialSpotlight/Component.tsx src/blocks/renderPageBlocks.tsx src/blocks/renderLivePreviewPageBlocks.tsx tests/int/testimonial-spotlight-render.int.spec.tsx tests/int/block-surface-semantics.int.spec.ts tests/int/section-eyebrow.int.spec.tsx
```

Expected: one server component, equal renderer coverage, and focused contract changes. No button/action imports and no `'use client'` directive should appear. Do not commit.

---

### Task 3: Complete the block-thumbnail workflow

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Generate: `public/block-thumbnails/testimonial-spotlight.jpg`

**Interfaces:**

- Consumes: `TestimonialSpotlightBlockComponent` and existing `portrait` fixture asset.
- Produces: `blockThumbnailFixtures.testimonialSpotlight` and a 1600×900 JPEG matching the metadata from Task 1.

- [ ] **Step 1: Add the failing thumbnail metadata assertion**

Add after the Feature Spotlight assertion in `tests/int/block-thumbnails.int.spec.ts`:

```ts
expect(getBlockThumbnailDefinition('testimonialSpotlight')).toMatchObject({
  alt: 'Testimonial Spotlight block preview',
  filename: 'testimonial-spotlight.jpg',
  label: 'Testimonial Spotlight',
  slug: 'testimonialSpotlight',
})
```

- [ ] **Step 2: Run the thumbnail contract and confirm fixture/asset coverage fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts
```

Expected: FAIL because the registered slug has no fixture and no generated JPEG yet.

- [ ] **Step 3: Add the representative production-component fixture**

Add this import beside Feature Spotlight in `src/block-thumbnails/fixtures.tsx`:

```tsx
import { TestimonialSpotlightBlockComponent } from '@/blocks/TestimonialSpotlight/Component'
```

Add this fixture immediately after `featureSpotlight`:

```tsx
  testimonialSpotlight: (
    <TestimonialSpotlightBlockComponent
      appearance={{ background: 'none', border: 'topAndBottom' }}
      description="A long-term commitment to education, healthcare, and service guides every institutional decision."
      designation="Founder"
      eyebrow="Message from management"
      image={{ alt: 'Institutional leader portrait', url: portrait }}
      mediaFillMode="containedFill"
      mediaPosition="left"
      personName="Shri Ravindra Kumar Singh"
      size="compact"
      testimonial="Our aim is to build an institution where education, healthcare, and service strengthen one another."
      title="Leadership with a long-term purpose."
    />
  ),
```

- [ ] **Step 4: Generate only the new thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=testimonialSpotlight pnpm generate:block-thumbnails
```

Expected: PASS with `✓ testimonialSpotlight -> public/block-thumbnails/testimonial-spotlight.jpg` and a 1600×900 JPEG.

- [ ] **Step 5: Run the complete thumbnail contract**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts
```

Expected: PASS, including definition uniqueness, fixture coverage, file existence, dimensions, format, and config metadata.

- [ ] **Step 6: Review the generated thumbnail without committing**

Open `public/block-thumbnails/testimonial-spotlight.jpg` and confirm the image occupies the left column, the hierarchy remains legible at picker scale, no buttons appear, and the section is not vertically clipped. Keep the generated image uncommitted.

---

### Task 4: Update operator documentation and project knowledge

**Files:**

- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Generate: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: the final registered schema, both renderers, generated types, fixture, and thumbnail asset.
- Produces: an operator catalog entry and current generated project knowledge that recognizes `testimonialSpotlight` on every required surface.

- [ ] **Step 1: Update the operator block catalog**

Insert after Feature Spotlight in `docs/guides/blocks.md`:

```md
| Testimonial Spotlight | One image-led leadership message | One person per block; configurable image side, crop, fill, appearance, spacing, and vertical alignment; no actions |
```

- [ ] **Step 2: Update the architecture inventory count and catalog**

In `docs/architecture/feature-inventory.md`, change `Normal Pages register 49 choices` to `Normal Pages register 50 choices` and insert `Testimonial Spotlight` immediately after `Feature Spotlight` in the same sentence.

- [ ] **Step 3: Update the maintained block-system registry**

In `.agents/skills/project-context/references/block-system.md`, change `registers 49 blocks` to `registers 50 blocks` and insert `` `testimonialSpotlight` `` immediately after `` `featureSpotlight` `` in the ordered slug list.

- [ ] **Step 4: Regenerate project inventory**

Run:

```bash
pnpm project-context:update
```

Expected: PASS and `.agents/skills/project-context/references/project-inventory.json` records the new config, component, slug, interface, Page registration, Reusable Section registration, both renderers, fixture, generated thumbnail, generated type, and focused tests.

- [ ] **Step 5: Check project-context consistency**

Run:

```bash
pnpm project-context:check
```

Expected: PASS. A knowledge-graph staleness warning may be reported separately if it only reflects the unchanged git commit hash; no registration or inventory error is acceptable.

- [ ] **Step 6: Review documentation and generated knowledge without committing**

Run:

```bash
git diff -- docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json
```

Expected: the catalog count is 50, ordering matches both collection registries, and generated facts include `testimonialSpotlight`. Do not commit.

---

### Task 5: Run final generation, quality, and visual checks

**Files:**

- Verify all files listed in the File Map.
- Modify only formatting or defects directly attributable to this block.

**Interfaces:**

- Consumes: the complete Testimonial Spotlight implementation.
- Produces: a verified, uncommitted working tree ready for user review.

- [ ] **Step 1: Format the touched text and source files**

Run:

```bash
pnpm exec prettier --write src/blocks/TestimonialSpotlight/config.ts src/blocks/TestimonialSpotlight/Component.tsx src/blocks/renderPageBlocks.tsx src/blocks/renderLivePreviewPageBlocks.tsx src/block-thumbnails/definitions.ts src/block-thumbnails/fixtures.tsx src/collections/Pages.ts src/collections/ReusableSections.ts tests/int/testimonial-spotlight-config.int.spec.ts tests/int/testimonial-spotlight-render.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-surface-semantics.int.spec.ts tests/int/section-eyebrow.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md docs/superpowers/specs/2026-08-17-testimonial-spotlight-block-design.md docs/superpowers/plans/2026-08-17-testimonial-spotlight-block.md
```

Expected: PASS and only formatting changes within the named files.

- [ ] **Step 2: Refresh required Payload outputs**

Run:

```bash
pnpm generate:types
pnpm generate:importmap
```

Expected: both commands PASS. `src/payload-types.ts` remains current; the import map is unchanged unless Payload requires a deterministic regeneration.

- [ ] **Step 3: Run focused integration contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-config.int.spec.ts tests/int/testimonial-spotlight-render.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/block-surface-semantics.int.spec.ts tests/int/section-eyebrow.int.spec.tsx
```

Expected: PASS with no failed tests.

- [ ] **Step 4: Run TypeScript and targeted ESLint**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/TestimonialSpotlight/config.ts src/blocks/TestimonialSpotlight/Component.tsx src/blocks/renderPageBlocks.tsx src/blocks/renderLivePreviewPageBlocks.tsx src/block-thumbnails/definitions.ts src/block-thumbnails/fixtures.tsx src/collections/Pages.ts src/collections/ReusableSections.ts tests/int/testimonial-spotlight-config.int.spec.ts tests/int/testimonial-spotlight-render.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-surface-semantics.int.spec.ts tests/int/section-eyebrow.int.spec.tsx
```

Expected: both commands PASS with no errors.

- [ ] **Step 5: Re-run project knowledge checks after final generation**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: PASS and no stale project inventory.

- [ ] **Step 6: Inspect the rendered preview at project breakpoints**

Run a local development server and open `/block-thumbnail-previews/testimonialSpotlight`. Verify the fixture at 1440×900, 834×1112, and 390×844:

- 1440: approximately 40/60 split, image left, content vertically balanced, no buttons.
- 834: two columns remain readable without text or media overflow.
- 390: image appears first at 4/3, content follows, and no horizontal overflow occurs.
- All sizes: eyebrow, title, statement, description, name, and designation use the existing project font families and hierarchy.

Expected: the visual result follows the approved screenshot-inspired composition and remains readable at all three Page live-preview breakpoints.

- [ ] **Step 7: Perform final diff and whitespace checks**

Run:

```bash
git diff --check
git status --short
```

Expected: `git diff --check` returns no output. `git status --short` lists the intended uncommitted source, tests, generated type, thumbnail, docs, project-context inventory, specification, and plan only. Do not stage or commit any file.
