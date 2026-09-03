# Contact 33 Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Payload-configurable Contact 33 block that preserves the registry layout while submitting through the existing production form pipeline.

**Architecture:** A Payload block adapter resolves CMS Form and Media relationships into a client-side Contact 33 presentation component. A small contact-form contract module validates the selected Form definition and normalizes its four supported fields, while the existing `/api/forms/[slug]/submit` route remains authoritative for validation, storage, notifications, and operational workflows.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16.2.10, React 19.2.7, TypeScript 5.7.3, Tailwind CSS 4, shadcn Radix/Luma, React Hook Form, Zod, Vitest, Testing Library, Playwright

## Global Constraints

- Block slug is `contact33`; generated interface is `Contact33Block`.
- Supported form keys are exactly `name`, `email`, `subject`, and `message`.
- Only published Forms with `general` or `lead` submission intent are selectable.
- Required supported fields must use `text`, `email`, `select`, and `textarea` respectively; unsupported required fields invalidate the selection.
- Submissions must use `/api/forms/[slug]/submit` with the existing honeypot and landing-page campaign/source metadata.
- Use `regularBlockContainerClasses` and `regularBlockMobilePaddingClasses`.
- Use the regular-block eyebrow, `text-3xl font-semibold tracking-tight text-balance sm:text-4xl` heading scale, semantic tokens, and project shadcn primitives.
- Keep form controls and validation copy left-aligned even when the block introduction and submit action are centered or right-aligned.
- Mobile renders content/form before a shorter image; desktop supports left or right image placement with equal-height columns.
- Do not add a second submission endpoint, fake delay, `console.log`, arbitrary dynamic form layout, review-form support, file upload, or multistep behavior.

---

## File map

- Create `src/lib/contact33Form.ts`: supported-field contract, fallback metadata, form-definition validation, and field normalization.
- Create `src/blocks/Contact33/config.ts`: Payload editor schema and relationship validation.
- Create `src/blocks/Contact33/Component.tsx`: server-compatible adapter from Payload values to presentation props.
- Create or replace `src/components/contact33.tsx`: responsive client presentation and submission behavior.
- Create `tests/int/contact33-config.int.spec.ts`: form contract and Payload schema coverage.
- Create `tests/int/contact33-render.int.spec.tsx`: static layout, responsive class contract, accessibility, and submission interaction coverage.
- Modify `src/collections/Pages.ts`: register the block in Page layouts.
- Modify `src/blocks/renderPageBlocks.tsx`: register normal rendering.
- Modify `src/blocks/renderLivePreviewPageBlocks.tsx`: register live-preview rendering.
- Modify `tests/int/page-blocks.int.spec.ts`: assert schema order and PageContent rendering.
- Modify `src/block-thumbnails/definitions.ts`: add Contact 33 thumbnail metadata before the
  config consumes its typed slug.
- Modify `src/block-thumbnails/fixtures.tsx`: add a deterministic form and image fixture.
- Modify `tests/int/block-thumbnails.int.spec.ts`: assert Contact 33 thumbnail metadata and file.
- Modify `public/block-thumbnails/contact-33.jpg`: generated 1600×900 preview.
- Modify `package.json` and `pnpm-lock.yaml`: registry dependencies added by shadcn.
- Modify `src/payload-types.ts`: generated Contact 33 block type and Page layout union.

---

### Task 1: Define the contact form and Payload schema contract

**Files:**
- Create: `tests/int/contact33-config.int.spec.ts`
- Create: `src/lib/contact33Form.ts`
- Create: `src/blocks/Contact33/config.ts`
- Modify: `src/block-thumbnails/definitions.ts`

**Interfaces:**
- Produces: `Contact33FormLike`, `Contact33FieldDefinition`, `getContact33FieldDefinitions(form)`, and `validateContact33FormDefinition(form)`.
- Produces: `Contact33Block`, consumed by Page registration and generated Payload types.

- [ ] **Step 1: Write the failing contract and schema tests**

```ts
import { describe, expect, it, vi } from 'vitest'

import {
  getContact33FieldDefinitions,
  validateContact33FormDefinition,
} from '@/lib/contact33Form'

const validForm = {
  fields: [
    { label: 'Name', name: 'name', placeholder: 'Your name', required: true, type: 'text' },
    { label: 'Email', name: 'email', placeholder: 'you@example.com', required: true, type: 'email' },
    {
      label: 'Subject',
      name: 'subject',
      options: [{ label: 'Admissions', value: 'admissions' }],
      required: false,
      type: 'select',
    },
    { label: 'Message', name: 'message', required: true, type: 'textarea' },
  ],
  slug: 'contact',
  submitButtonLabel: 'Send message',
  successMessage: 'Thanks. We will be in touch.',
  title: 'Contact',
} as const

describe('contact33 form contract', () => {
  it('accepts and normalizes the four supported fields', () => {
    expect(validateContact33FormDefinition(validForm as never)).toBe(true)
    expect(getContact33FieldDefinitions(validForm as never)).toMatchObject({
      email: { label: 'Email', required: true, type: 'email' },
      message: { label: 'Message', required: true, type: 'textarea' },
      name: { label: 'Name', required: true, type: 'text' },
      subject: {
        options: [{ label: 'Admissions', value: 'admissions' }],
        required: false,
        type: 'select',
      },
    })
  })

  it.each([
    [
      { ...validForm, fields: validForm.fields.filter((field) => field.name !== 'message') },
      'Contact form must include a "message" textarea field.',
    ],
    [
      {
        ...validForm,
        fields: validForm.fields.map((field) =>
          field.name === 'email' ? { ...field, type: 'text' } : field,
        ),
      },
      'Contact form field "email" must use the Email type.',
    ],
    [
      {
        ...validForm,
        fields: validForm.fields.map((field) =>
          field.name === 'subject' ? { ...field, options: [] } : field,
        ),
      },
      'Contact form field "subject" must include at least one option.',
    ],
    [
      {
        ...validForm,
        fields: [...validForm.fields, { label: 'Company', name: 'company', required: true, type: 'text' }],
      },
      'Contact 33 cannot render required field "company".',
    ],
  ])('rejects incompatible form definitions', (form, expected) => {
    expect(validateContact33FormDefinition(form as never)).toBe(expected)
  })

  it('defines the approved Payload tabs, defaults, relationship filter, and validator', async () => {
    const { Contact33Block } = await import('@/blocks/Contact33/config')
    const tabs = Contact33Block.fields[0] as {
      tabs: Array<{ fields: Array<Record<string, unknown>>; label: string }>
      type: string
    }
    const content = tabs.tabs.find((tab) => tab.label === 'Content')
    const layout = tabs.tabs.find((tab) => tab.label === 'Layout & Theme')
    const byName = (fields: Array<Record<string, unknown>>, name: string) =>
      fields.find((field) => field.name === name)
    const form = byName(content?.fields ?? [], 'form') as {
      filterOptions?: unknown
      required?: boolean
      validate?: (value: unknown, context: unknown) => Promise<true | string>
    }

    expect(tabs.type).toBe('tabs')
    expect(tabs.tabs.map((tab) => tab.label)).toEqual(['Content', 'Layout & Theme'])
    expect(content?.fields.map((field) => field.name)).toEqual([
      'eyebrow',
      'title',
      'description',
      'image',
      'imageAlt',
      'form',
    ])
    expect(form.required).toBe(true)
    expect(form.filterOptions).toEqual({
      and: [
        { _status: { equals: 'published' } },
        { submissionIntent: { in: ['general', 'lead'] } },
      ],
    })
    expect(byName(layout?.fields ?? [], 'appearance')?.type).toBe('group')
    expect(byName(layout?.fields ?? [], 'contentAlignment')).toMatchObject({
      defaultValue: 'left',
      type: 'select',
    })
    expect(byName(layout?.fields ?? [], 'size')).toMatchObject({
      defaultValue: 'default',
      type: 'select',
    })
    expect(byName(layout?.fields ?? [], 'imagePosition')).toMatchObject({
      defaultValue: 'right',
      type: 'select',
    })

    const findByID = vi.fn().mockResolvedValue(validForm)
    await expect(
      form.validate?.('form-id', {
        req: { payload: { findByID } },
      }),
    ).resolves.toBe(true)
    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'forms', depth: 0, id: 'form-id' }),
    )
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/contact33-config.int.spec.ts`

Expected: FAIL because `@/lib/contact33Form` and `@/blocks/Contact33/config` do not exist.

- [ ] **Step 3: Implement the form contract module**

Create `src/lib/contact33Form.ts` with these exported contracts:

```ts
import type { Form } from '@/payload-types'

export type Contact33FieldName = 'email' | 'message' | 'name' | 'subject'
export type Contact33FormLike = Pick<
  Form,
  'fields' | 'slug' | 'submitButtonLabel' | 'successMessage' | 'title'
>
export type Contact33FieldDefinition = {
  label: string
  name: Contact33FieldName
  options?: Array<{ label: string; value: string }>
  placeholder?: string
  required: boolean
  type: 'email' | 'select' | 'text' | 'textarea'
}

const fallbackFields: Record<Contact33FieldName, Contact33FieldDefinition> = {
  name: {
    label: 'Name',
    name: 'name',
    placeholder: 'Your name',
    required: true,
    type: 'text',
  },
  email: {
    label: 'Email',
    name: 'email',
    placeholder: 'you@example.com',
    required: true,
    type: 'email',
  },
  subject: {
    label: 'Subject',
    name: 'subject',
    options: [{ label: 'General inquiry', value: 'general' }],
    required: false,
    type: 'select',
  },
  message: {
    label: 'Message',
    name: 'message',
    placeholder: 'How can we help?',
    required: true,
    type: 'textarea',
  },
}

const expectedTypes = {
  email: 'email',
  message: 'textarea',
  name: 'text',
  subject: 'select',
} as const

const typeLabels = {
  email: 'Email',
  select: 'Select',
  text: 'Text',
  textarea: 'Textarea',
} as const

export function validateContact33FormDefinition(
  form: Pick<Contact33FormLike, 'fields'> | null | undefined,
): true | string {
  const fields = form?.fields ?? []

  for (const [name, expectedType] of Object.entries(expectedTypes) as Array<
    [Contact33FieldName, (typeof expectedTypes)[Contact33FieldName]]
  >) {
    const field = fields.find((candidate) => candidate?.name === name)

    if (!field) {
      return `Contact form must include a "${name}" ${expectedType} field.`
    }

    if (field.type !== expectedType) {
      return `Contact form field "${name}" must use the ${typeLabels[expectedType]} type.`
    }

    if (name === 'subject' && !field.options?.length) {
      return 'Contact form field "subject" must include at least one option.'
    }
  }

  const unsupportedRequiredField = fields.find(
    (field) => field?.required && !(field.name in expectedTypes),
  )

  return unsupportedRequiredField
    ? `Contact 33 cannot render required field "${unsupportedRequiredField.name}".`
    : true
}

export function getContact33FieldDefinitions(
  form: Pick<Contact33FormLike, 'fields'> | null | undefined,
): Record<Contact33FieldName, Contact33FieldDefinition> {
  return Object.fromEntries(
    (Object.keys(fallbackFields) as Contact33FieldName[]).map((name) => {
      const fallback = fallbackFields[name]
      const field = form?.fields?.find((candidate) => candidate?.name === name)
      const options =
        field?.options?.flatMap((option) => {
          const label = option?.label?.trim()
          const value = option?.value?.trim()
          return label && value ? [{ label, value }] : []
        }) ?? []

      return [
        name,
        {
          ...fallback,
          label: field?.label?.trim() || fallback.label,
          options: name === 'subject' && options.length ? options : fallback.options,
          placeholder: field?.placeholder?.trim() || fallback.placeholder,
          required: field?.required ?? fallback.required,
        },
      ]
    }),
  ) as Record<Contact33FieldName, Contact33FieldDefinition>
}
```

- [ ] **Step 4: Implement the Payload block config**

First add this typed definition to `src/block-thumbnails/definitions.ts` immediately after Review
Submission so `getBlockThumbnailAdmin('contact33')` is valid:

```ts
defineThumbnail({
  alt: 'Contact 33 block preview',
  filename: 'contact-33.jpg',
  label: 'Contact 33',
  slug: 'contact33',
  stageAlignment: 'top',
}),
```

Then create `src/blocks/Contact33/config.ts`. Use `createBlockAppearanceFields`, three
project-style select fields, `getBlockThumbnailAdmin('contact33')`, and this exact relationship
validator:

```ts
import type { Block, RelationshipFieldSingleValidation, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { validateContact33FormDefinition } from '@/lib/contact33Form'
import type { Form } from '@/payload-types'

const validateForm: RelationshipFieldSingleValidation = async (value, { req }) => {
  if (value == null) return true

  const form =
    typeof value === 'object' && value !== null && 'fields' in value
      ? (value as Form)
      : await req.payload.findByID({
          collection: 'forms',
          depth: 0,
          id: value as string | number,
          req,
        })

  return validateContact33FormDefinition(form)
}
```

Define `contentAlignment` options `left`, `center`, `right`; `size` options `compact`, `default`,
`comfortable`; and `imagePosition` options `left`, `right`. The relationship uses:

```ts
{
  name: 'form',
  label: 'Contact Form',
  type: 'relationship',
  relationTo: 'forms',
  required: true,
  filterOptions: {
    and: [
      { _status: { equals: 'published' } },
      { submissionIntent: { in: ['general', 'lead'] } },
    ],
  },
  validate: validateForm,
  admin: {
    description:
      'Select a published general or lead form with name (Text), email (Email), subject (Select), and message (Textarea) fields.',
  },
}
```

- [ ] **Step 5: Run the focused test**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/contact33-config.int.spec.ts`

Expected: PASS.

- [ ] **Step 6: Commit the contract**

```bash
git add tests/int/contact33-config.int.spec.ts src/lib/contact33Form.ts src/blocks/Contact33/config.ts src/block-thumbnails/definitions.ts
git commit -m "feat: define contact 33 contract"
```

---

### Task 2: Scaffold and adapt the Contact 33 presentation

**Files:**
- Create or replace: `src/components/contact33.tsx`
- Create: `src/blocks/Contact33/Component.tsx`
- Create: `tests/int/contact33-render.int.spec.tsx`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: `Contact33FormLike` and `getContact33FieldDefinitions(form)` from Task 1.
- Produces: `Contact33(props)` presentation component.
- Produces: `Contact33BlockComponent(props)` Payload adapter.

- [ ] **Step 1: Add the requested registry block**

Run: `pnpm exec shadcn add @shadcnblocks/contact33`

Expected: the CLI creates `src/components/contact33.tsx` and adds `@hookform/resolvers`,
`react-hook-form`, and `zod` plus their lockfile entries. Decline overwrite if the CLI proposes
replacing existing shared UI primitives.

- [ ] **Step 2: Write failing layout and adapter tests**

Create `tests/int/contact33-render.int.spec.tsx`:

```tsx
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Contact33BlockComponent } from '@/blocks/Contact33/Component'

const form = {
  fields: [
    { label: 'Full name', name: 'name', placeholder: 'Jane Doe', required: true, type: 'text' },
    { label: 'Work email', name: 'email', placeholder: 'jane@example.com', required: true, type: 'email' },
    {
      label: 'Topic',
      name: 'subject',
      options: [
        { label: 'Admissions', value: 'admissions' },
        { label: 'Partnerships', value: 'partnerships' },
      ],
      required: false,
      type: 'select',
    },
    { label: 'Your message', name: 'message', placeholder: 'Tell us more', required: true, type: 'textarea' },
  ],
  slug: 'contact',
  submitButtonLabel: 'Send inquiry',
  successMessage: 'Thanks. We will reply soon.',
  title: 'Contact',
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('contact33 block', () => {
  it.each(['compact', 'default', 'comfortable'] as const)(
    'uses shared outer spacing for %s size',
    (size) => {
      const html = renderToStaticMarkup(
        createElement(Contact33BlockComponent, {
          form,
          image: { alt: 'Campus team', height: 900, url: '/contact.jpg', width: 1200 },
          imageAlt: 'An advisor welcoming a visitor',
          size,
          title: 'Start a conversation',
        } as never),
      )

      expect(html).toContain(`data-contact33-size="${size}"`)
      expect(html).toContain('py-12 md:py-16')
      expect(html).toContain('mx-auto w-full max-w-screen-2xl px-4')
    },
  )

  it('uses project typography, editor copy, media alt, and form metadata', () => {
    const html = renderToStaticMarkup(
      createElement(Contact33BlockComponent, {
        contentAlignment: 'center',
        description: 'Our advisors are ready to help.',
        eyebrow: 'Contact',
        form,
        image: { alt: 'Ignored media alt', height: 900, url: '/contact.jpg', width: 1200 },
        imageAlt: 'An advisor welcoming a visitor',
        title: 'Start a conversation',
      } as never),
    )

    expect(html).toContain('font-mono text-xs font-semibold uppercase')
    expect(html).toContain('text-3xl font-semibold tracking-tight text-balance')
    expect(html).toContain('text-base leading-7')
    expect(html).toContain('Full name')
    expect(html).toContain('Work email')
    expect(html).toContain('Topic')
    expect(html).toContain('Admissions')
    expect(html).toContain('Your message')
    expect(html).toContain('Send inquiry')
    expect(html).toContain('alt="An advisor welcoming a visitor"')
    expect(html).toContain('data-contact33-content-alignment="center"')
    expect(html).toContain('items-center text-center')
  })

  it('keeps the form first on mobile and reverses only desktop placement', () => {
    const left = renderToStaticMarkup(
      createElement(Contact33BlockComponent, {
        form,
        image: { alt: 'Contact', url: '/contact.jpg' },
        imageAlt: 'Contact team',
        imagePosition: 'left',
        title: 'Contact us',
      } as never),
    )
    const right = renderToStaticMarkup(
      createElement(Contact33BlockComponent, {
        form,
        image: { alt: 'Contact', url: '/contact.jpg' },
        imageAlt: 'Contact team',
        imagePosition: 'right',
        title: 'Contact us',
      } as never),
    )

    expect(left).toContain('data-contact33-image-position="left"')
    expect(left).toContain('lg:order-first')
    expect(right).toContain('data-contact33-image-position="right"')
    expect(right).not.toContain('lg:order-first')
    expect(left).toContain('min-h-72')
    expect(left).toContain('lg:min-h-[42rem]')
  })

  it('renders an unavailable message for an unpopulated form relationship', () => {
    const html = renderToStaticMarkup(
      createElement(Contact33BlockComponent, {
        form: 'form-id',
        image: { alt: 'Contact', url: '/contact.jpg' },
        imageAlt: 'Contact team',
        title: 'Contact us',
      } as never),
    )

    expect(html).toContain('This contact form is currently unavailable.')
    expect(html).not.toContain('<form')
  })
})
```

- [ ] **Step 3: Run the render test to verify it fails**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/contact33-render.int.spec.tsx`

Expected: FAIL because the Payload adapter does not exist and registry defaults do not satisfy the
project contracts.

- [ ] **Step 4: Replace the registry defaults with the project presentation**

Rewrite `src/components/contact33.tsx` as a client component using the installed React Hook Form,
Zod resolver, Lucide `LoaderCircle`, and existing shadcn `Button`, `Field`, `Input`, `Select`, and
`Textarea` components.

Export these exact public types:

```ts
export type Contact33Image = {
  alt: string
  height?: number
  src: string
  width?: number
}

export type Contact33Props = {
  appearance?: BlockAppearance | null
  className?: string
  contentAlignment?: 'center' | 'left' | 'right'
  description?: string | null
  eyebrow?: string | null
  form?: Contact33FormLike | null
  image: Contact33Image
  imagePosition?: 'left' | 'right'
  size?: 'comfortable' | 'compact' | 'default'
  title: string
}
```

Use these exact structure contracts:

```tsx
<section
  className={cn(regularBlockMobilePaddingClasses[size], appearanceClasses.className, className)}
  data-contact33-background={appearance?.background ?? 'none'}
  data-contact33-size={size}
>
  <div className={regularBlockContainerClasses}>
    <div
      className={cn('grid items-stretch lg:grid-cols-2', sectionGapClasses[size])}
      data-contact33-image-position={imagePosition}
    >
      <div className="flex min-w-0 flex-col">
        <div
          className={cn('flex flex-col', headingGapClasses[size], alignmentClasses[contentAlignment])}
          data-contact33-content-alignment={contentAlignment}
        >
          {/* optional eyebrow, required h2, optional description */}
        </div>
        {/* available form or unavailable message */}
      </div>
      <div
        className={cn(
          'relative min-h-72 overflow-hidden rounded-[calc(var(--radius)*2)] lg:min-h-[42rem]',
          imagePosition === 'left' && 'lg:order-first',
        )}
      >
        <Image alt={image.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" src={image.src} />
      </div>
    </div>
  </div>
</section>
```

Set `sectionGapClasses` to `gap-8 lg:gap-12`, `gap-10 lg:gap-14`, and
`gap-12 lg:gap-16`; set heading/form gaps to progressively larger project gap utilities. Use
`text-current` and `text-current/70` for appearance-safe copy. Keep the form controls left-aligned
and place the submit button with `self-start`, `self-center`, or `self-end`.

Build a Zod schema from `getContact33FieldDefinitions(form)` so optional fields accept an empty
string and required fields produce `${label} is required.`. Render `subject` through the
Radix-based Select and map every field error through `FieldError`.

- [ ] **Step 5: Implement the Payload adapter**

Create `src/blocks/Contact33/Component.tsx`:

```tsx
import { Contact33 } from '@/components/contact33'
import { getMediaImageProps } from '@/lib/media'
import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import type { Contact33FormLike } from '@/lib/contact33Form'
import type { Media } from '@/payload-types'

type Contact33BlockLike = {
  appearance?: BlockAppearance | null
  contentAlignment?: 'center' | 'left' | 'right' | null
  description?: string | null
  eyebrow?: string | null
  form?: Contact33FormLike | number | string | null
  image?: Media | number | string | null
  imageAlt?: string | null
  imagePosition?: 'left' | 'right' | null
  size?: 'comfortable' | 'compact' | 'default' | null
  title?: string | null
}

export function Contact33BlockComponent(props: Contact33BlockLike) {
  const title = props.title?.trim()
  const imageAlt = props.imageAlt?.trim()
  const image = getMediaImageProps({
    fallbackAlt: imageAlt || title,
    media: props.image,
    preset: 'generic',
  })
  const form =
    props.form && typeof props.form === 'object' ? (props.form as Contact33FormLike) : null

  if (!title || !image || !imageAlt) return null

  return (
    <Contact33
      appearance={props.appearance}
      contentAlignment={props.contentAlignment ?? 'left'}
      description={props.description?.trim()}
      eyebrow={props.eyebrow?.trim()}
      form={form}
      image={{ ...image, alt: imageAlt }}
      imagePosition={props.imagePosition ?? 'right'}
      size={props.size ?? 'default'}
      title={title}
    />
  )
}
```

- [ ] **Step 6: Run focused tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/contact33-config.int.spec.ts tests/int/contact33-render.int.spec.tsx`

Expected: PASS.

- [ ] **Step 7: Commit the presentation**

```bash
git add package.json pnpm-lock.yaml src/components/contact33.tsx src/blocks/Contact33/Component.tsx tests/int/contact33-render.int.spec.tsx
git commit -m "feat: add contact 33 form"
```

---

### Task 3: Wire production submission behavior

**Files:**
- Modify: `src/components/contact33.tsx`
- Modify: `tests/int/contact33-render.int.spec.tsx`

**Interfaces:**
- Consumes: existing `FORM_HONEYPOT_FIELD_NAME` and `/api/forms/[slug]/submit` response contract.
- Produces: client submit, field error, pending, success, reset, and metadata behavior.

- [ ] **Step 1: Add failing interaction tests**

Append tests using Testing Library `render`, `screen`, `fireEvent`, and `waitFor`:

```tsx
it('submits values and attribution metadata through the existing endpoint', async () => {
  window.history.replaceState({}, '', '/contact?utm_source=newsletter&utm_campaign=summer')
  const fetchMock = vi.fn().mockResolvedValue({
    json: vi.fn().mockResolvedValue({ message: 'Thanks. We will reply soon.' }),
    ok: true,
  })
  vi.stubGlobal('fetch', fetchMock)

  render(
    <Contact33BlockComponent
      form={form as never}
      image={{ alt: 'Contact', url: '/contact.jpg' } as never}
      imageAlt="Contact team"
      title="Contact us"
    />,
  )

  fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Jane Doe' } })
  fireEvent.change(screen.getByLabelText(/Work email/), {
    target: { value: 'jane@example.com' },
  })
  fireEvent.change(screen.getByLabelText(/Your message/), {
    target: { value: 'I would like to learn more.' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Send inquiry' }))

  await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/forms/contact/submit',
    expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"name":"Jane Doe"'),
    }),
  )
  const request = JSON.parse(fetchMock.mock.calls[0][1].body)
  expect(request).toEqual({
    metadata: {
      campaign: 'summer',
      landingPage: '/contact?utm_source=newsletter&utm_campaign=summer',
      source: 'newsletter',
    },
    values: {
      email: 'jane@example.com',
      message: 'I would like to learn more.',
      name: 'Jane Doe',
      subject: '',
      website: '',
    },
  })
  expect(await screen.findByRole('status')).toHaveTextContent('Thanks. We will reply soon.')
  expect(screen.getByLabelText(/Full name/)).toHaveValue('')
})

it('maps endpoint errors to fields and restores the submit action', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        errors: { email: 'Work email must be a valid email address.' },
        message: 'Please correct the highlighted fields and try again.',
      }),
      ok: false,
    }),
  )

  render(
    <Contact33BlockComponent
      form={form as never}
      image={{ alt: 'Contact', url: '/contact.jpg' } as never}
      imageAlt="Contact team"
      title="Contact us"
    />,
  )
  fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Jane' } })
  fireEvent.change(screen.getByLabelText(/Work email/), { target: { value: 'jane@example.com' } })
  fireEvent.change(screen.getByLabelText(/Your message/), { target: { value: 'Hello' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send inquiry' }))

  expect(await screen.findByText('Work email must be a valid email address.')).toBeVisible()
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Please correct the highlighted fields and try again.',
  )
  expect(screen.getByRole('button', { name: 'Send inquiry' })).toBeEnabled()
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/contact33-render.int.spec.tsx`

Expected: FAIL because the adapted presentation does not yet submit to the endpoint or expose
status/error regions.

- [ ] **Step 3: Implement submission and accessible status**

In `src/components/contact33.tsx`, submit the React Hook Form values with:

```ts
const response = await fetch(`/api/forms/${form.slug.trim()}/submit`, {
  body: JSON.stringify({
    metadata: getSubmissionMetadata(),
    values: {
      ...values,
      [FORM_HONEYPOT_FIELD_NAME]: '',
    },
  }),
  headers: { 'Content-Type': 'application/json' },
  method: 'POST',
})
const payload = (await response.json()) as {
  errors?: Record<string, string>
  message?: string
}

if (!response.ok) {
  Object.entries(payload.errors ?? {}).forEach(([name, message]) => {
    if (name === 'name' || name === 'email' || name === 'subject' || name === 'message') {
      formApi.setError(name, { message, type: 'server' })
    }
  })
  setMessage(payload.message || 'Please correct the highlighted fields and try again.')
  setMessageTone('destructive')
  return
}

formApi.reset()
setMessage(payload.message || form.successMessage?.trim() || 'Thanks. Your message was received.')
setMessageTone('default')
```

Copy the attribution algorithm from Review Submission exactly: UTM source first, referrer hostname
fallback, plus UTM campaign and current path/query. Render the honeypot input with
`suppressHydrationWarning`, `tabIndex={-1}`, `aria-hidden="true"`, and `readOnly`. Render success
copy with `role="status"` and errors with `role="alert"`. Use:

```tsx
<LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" />
```

Do not add icon size or margin utilities; the Button primitive supplies both.

- [ ] **Step 4: Run the interaction tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/contact33-render.int.spec.tsx`

Expected: PASS.

- [ ] **Step 5: Commit submission behavior**

```bash
git add src/components/contact33.tsx tests/int/contact33-render.int.spec.tsx
git commit -m "feat: submit contact inquiries"
```

---

### Task 4: Register Contact 33 in the page pipeline

**Files:**
- Modify: `src/collections/Pages.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx`
- Modify: `tests/int/page-blocks.int.spec.ts`

**Interfaces:**
- Consumes: `Contact33Block` and `Contact33BlockComponent`.
- Produces: editor availability, normal PageContent rendering, and live-preview rendering.

- [ ] **Step 1: Add failing registration and render assertions**

In `tests/int/page-blocks.int.spec.ts`, insert `contact33` after `reviewSubmission` in the expected
Page block slug list and add:

```ts
it('renders a contact33 page block through PageContent', () => {
  const result = PageContent({
    page: {
      id: 'page-contact-1',
      layout: [
        {
          appearance: { background: 'muted', border: 'topAndBottom', textColor: 'auto' },
          blockType: 'contact33',
          contentAlignment: 'left',
          description: 'Our advisors are ready to help.',
          eyebrow: 'Contact',
          form: {
            fields: [
              { label: 'Name', name: 'name', required: true, type: 'text' },
              { label: 'Email', name: 'email', required: true, type: 'email' },
              {
                label: 'Subject',
                name: 'subject',
                options: [{ label: 'General', value: 'general' }],
                required: false,
                type: 'select',
              },
              { label: 'Message', name: 'message', required: true, type: 'textarea' },
            ],
            slug: 'contact',
            submitButtonLabel: 'Send',
            successMessage: 'Thanks.',
            title: 'Contact',
          },
          image: { alt: 'Advisor', height: 900, url: '/contact.jpg', width: 1200 },
          imageAlt: 'An advisor speaking with a visitor',
          imagePosition: 'right',
          size: 'default',
          title: 'Start a conversation',
        },
      ],
      slug: 'contact',
      title: 'Contact',
    } as never,
  })
  const html = renderToStaticMarkup(result)

  expect(html).toContain('data-page-block-stack="true"')
  expect(html).toContain('data-contact33-image-position="right"')
  expect(html).toContain('data-contact33-background="muted"')
  expect(html).toContain('Start a conversation')
  expect(html).toContain('border-y border-border')
})
```

Add this source-level assertion after importing `readFileSync` from `node:fs`:

```ts
it('registers contact33 in live preview rendering', () => {
  const source = readFileSync(
    new URL('../../src/blocks/renderLivePreviewPageBlocks.tsx', import.meta.url),
    'utf8',
  )

  expect(source).toContain("import { Contact33BlockComponent } from './Contact33/Component'")
  expect(source).toContain("case 'contact33':")
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts`

Expected: FAIL because `contact33` is absent from the Page schema and renderer switches.

- [ ] **Step 3: Register the block**

In `src/collections/Pages.ts`, import `Contact33Block` and place it immediately after
`ReviewSubmissionBlock` in the Page `layout.blocks` list.

In both page renderers, import `Contact33BlockComponent` and add:

```tsx
case 'contact33':
  return <Contact33BlockComponent key={key} {...block} />
```

Use the existing expanded key expression in `renderPageBlocks.tsx` and its existing `key` variable
in `renderLivePreviewPageBlocks.tsx`.

- [ ] **Step 4: Run page and contact tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/contact33-config.int.spec.ts tests/int/contact33-render.int.spec.tsx`

Expected: PASS.

- [ ] **Step 5: Commit page registration**

```bash
git add src/collections/Pages.ts src/blocks/renderPageBlocks.tsx src/blocks/renderLivePreviewPageBlocks.tsx tests/int/page-blocks.int.spec.ts
git commit -m "feat: register contact 33 block"
```

---

### Task 5: Add the Contact 33 thumbnail

**Files:**
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Create: `public/block-thumbnails/contact-33.jpg`

**Interfaces:**
- Consumes: `Contact33BlockComponent`, local `editorialLandscape` asset, and the existing thumbnail generator.
- Produces: `contact33` as a valid `BlockThumbnailSlug` and a deterministic 1600×900 JPEG.

- [ ] **Step 1: Add failing thumbnail metadata assertions**

Update `tests/int/block-thumbnails.int.spec.ts` so expected definition slugs include `contact33` and
add:

```ts
expect(getBlockThumbnailDefinition('contact33')).toMatchObject({
  alt: 'Contact 33 block preview',
  filename: 'contact-33.jpg',
  label: 'Contact 33',
  slug: 'contact33',
  stageAlignment: 'top',
})
```

- [ ] **Step 2: Run thumbnail tests to verify failure**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts`

Expected: FAIL because the definition, fixture, and generated image are missing.

- [ ] **Step 3: Add the fixture**

In `fixtures.tsx`, import `Contact33BlockComponent`, add a `contactFormFixture` with the four
supported fields, and add:

```tsx
contact33: (
  <Contact33BlockComponent
    appearance={{ background: 'muted', border: 'topAndBottom' }}
    description="Tell us what you need and our team will help you find the right next step."
    eyebrow="Contact"
    form={contactFormFixture}
    image={{ alt: 'Modern learning environment', url: editorialLandscape }}
    imageAlt="A welcoming modern learning environment"
    imagePosition="right"
    size="compact"
    title="Start a conversation."
  />
),
```

- [ ] **Step 4: Run metadata and fixture tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnail-fixtures.int.spec.ts`

Expected: PASS. The full thumbnail metadata test still reports the JPEG missing.

- [ ] **Step 5: Generate only Contact 33**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=contact33 pnpm run generate:block-thumbnails
```

Expected: `✓ contact33 -> public/block-thumbnails/contact-33.jpg`.

- [ ] **Step 6: Verify generated output**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: PASS, including JPEG format and 1600×900 dimension assertions.

- [ ] **Step 7: Commit thumbnail support**

```bash
git add src/block-thumbnails/fixtures.tsx tests/int/block-thumbnails.int.spec.ts public/block-thumbnails/contact-33.jpg
git commit -m "feat: add contact 33 thumbnail"
```

---

### Task 6: Generate types and complete verification

**Files:**
- Modify: `src/payload-types.ts`
- Review: all Contact 33 files and generated shadcn dependency changes.

**Interfaces:**
- Produces: generated `Contact33Block` type and Page layout union member.

- [ ] **Step 1: Generate Payload types**

Run: `pnpm run generate:types`

Expected: `src/payload-types.ts` contains `export interface Contact33Block` and
`blockType: 'contact33'`, with no manual edits.

- [ ] **Step 2: Run focused tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/contact33-config.int.spec.ts \
  tests/int/contact33-render.int.spec.tsx \
  tests/int/page-blocks.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/block-thumbnail-fixtures.int.spec.ts \
  tests/int/forms-submission.int.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Run lint**

Run: `pnpm run lint`

Expected: exit 0. If unrelated existing violations appear, record their exact paths separately;
fix every violation in Contact 33 files.

- [ ] **Step 4: Run the production build**

Run: `pnpm run build`

Expected: exit 0 with Payload schema generation, TypeScript, and Next.js build succeeding.

- [ ] **Step 5: Review the generated registry adaptation**

Run:

```bash
rg -n "console\\.log|setTimeout|https://deifkwefumgah|py-32|className=\"container\"|text-green" \
  src/components/contact33.tsx src/blocks/Contact33
git diff --check
git status --short
```

Expected: the search returns no matches; `git diff --check` exits 0; status contains only intended
Contact 33 and generated type changes.

- [ ] **Step 6: Commit generated types**

```bash
git add src/payload-types.ts
git commit -m "chore: generate contact block types"
```

- [ ] **Step 7: Report verification**

Report the created block slug, Payload form contract, page and live-preview registration,
thumbnail path, generated types, and exact test/lint/build outcomes. Include any unrelated
pre-existing failures without describing the feature as fully verified when a required check did
not pass.
