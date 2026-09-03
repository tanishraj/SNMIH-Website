# Contact 24 Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Payload-configurable Contact 24 office grid that reads canonical office information from Site Settings and renders accessible interactive maps.

**Architecture:** Site Settings owns an ordered `officeLocations` array. A client-safe normalizer produces a stable office contract, a server-only cached loader reads published or draft global state, and separate public and live-preview adapters pass those offices into a pure Contact 24 presentation component.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16.2.10, React 19.2.7, TypeScript 5.7.3, Tailwind CSS 4, shadcn Radix/Luma, Lucide, Vitest, Testing Library, Playwright

## Global Constraints

- Block slug is `contact24`; generated interface is `Contact24Block`.
- Site Settings is the canonical source for every office shown by Contact 24.
- Preserve `contactEmail`, `contactPhone`, `address`, and `googleMapEmbedUrl` for existing consumers.
- Each configured office requires region, city, address, phone, email, map embed URL, external map URL, and accessible map title.
- Map embed and external map URLs accept complete HTTPS URLs only.
- Public pages read published Site Settings; page preview receives a server-provided draft office snapshot.
- Use provider-hosted iframe embeds, not a Google Maps, Mapbox, or Leaflet client SDK.
- Use `regularBlockContainerClasses`, `regularBlockMobilePaddingClasses`, regular-block typography, semantic tokens, and project shadcn components.
- Render one card column on mobile and two columns from the medium breakpoint.
- Content alignment affects the introduction only; office contact details remain left-aligned.
- Use a real new-tab map anchor through `Button asChild`; button icons use `data-icon` and no manual size class.
- Do not add per-page office selection, automatic geocoding, custom markers, routing, or changes to the footer contact contract.

---

## File map

- Create `src/lib/siteOfficesShared.ts`: client-safe URL validation, office source/output types, and normalization.
- Create `src/lib/siteOffices.ts`: server-only cached published/draft Site Settings loaders.
- Modify `src/globals/SiteSettings.ts`: add the canonical `officeLocations` editor schema.
- Create `src/components/contact24.tsx`: responsive Contact 24 presentation using Card and Button.
- Create `src/blocks/Contact24/config.ts`: Payload block presentation schema.
- Create `src/blocks/Contact24/Presentation.tsx`: client-safe block-value adapter.
- Create `src/blocks/Contact24/Component.tsx`: public server adapter that loads published offices.
- Create `src/blocks/Contact24/PreviewComponent.tsx`: live-preview adapter that receives draft offices.
- Create `tests/int/site-offices.int.spec.ts`: Site Settings schema, URL validation, and normalization tests.
- Create `tests/int/contact24-render.int.spec.tsx`: layout, typography, links, iframe, and empty-state tests.
- Create `tests/int/contact24-data.int.spec.ts`: server-loader and block-schema tests.
- Modify `src/collections/Pages.ts`: register Contact 24.
- Modify `src/blocks/renderPageBlocks.tsx`: register public rendering.
- Modify `src/blocks/renderLivePreviewPageBlocks.tsx`: register preview rendering with an office snapshot.
- Modify `src/components/live-preview/PageLivePreview.tsx`: accept and forward draft offices.
- Modify `src/app/(frontend)/preview/page/[id]/page.tsx`: load draft offices when Contact 24 is present.
- Modify `tests/int/page-blocks.int.spec.ts`: assert Page schema and public renderer registration.
- Modify `tests/int/live-preview-renderer.int.spec.tsx`: assert snapshot-driven Contact 24 preview.
- Modify `tests/int/live-preview-import-boundary.int.spec.ts`: forbid the server office loader from the client graph.
- Modify `src/block-thumbnails/definitions.ts`: add Contact 24 thumbnail metadata.
- Modify `src/block-thumbnails/fixtures.tsx`: add deterministic Contact 24 fixture data.
- Create `public/block-thumbnail-assets/office-map.svg`: local map artwork for deterministic thumbnail capture.
- Create `public/block-thumbnails/contact-24.jpg`: generated 1600×900 thumbnail.
- Modify `tests/int/block-thumbnails.int.spec.ts`: assert Contact 24 metadata and generated file.
- Modify `src/payload-types.ts`: generated Site Settings office and Contact 24 types.

---

### Task 1: Define the Site Settings office directory contract

**Files:**
- Create: `tests/int/site-offices.int.spec.ts`
- Create: `src/lib/siteOfficesShared.ts`
- Modify: `src/globals/SiteSettings.ts`
- Modify: `src/payload-types.ts`

**Interfaces:**
- Produces: `SiteOfficeLocationSource`.
- Produces: `SiteOfficeLocation`.
- Produces: `validateHttpsUrl(value): true | string`.
- Produces: `normalizeSiteOfficeLocations(values): SiteOfficeLocation[]`.
- Produces: generated `SiteSetting['officeLocations']`.

- [ ] **Step 1: Write the failing schema and normalization tests**

Create `tests/int/site-offices.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { SiteSettings } from '@/globals/SiteSettings'
import {
  normalizeSiteOfficeLocations,
  validateHttpsUrl,
} from '@/lib/siteOfficesShared'

const getNamedField = <T>(fields: unknown[], name: string) =>
  fields.find(
    (field) =>
      typeof field === 'object' && field !== null && 'name' in field && field.name === name,
  ) as T | undefined

describe('site office directory', () => {
  it('defines a complete ordered office array under Contact', () => {
    const tabs = SiteSettings.fields[0] as {
      tabs?: Array<{ fields: unknown[]; label: string }>
    }
    const contact = tabs.tabs?.find((tab) => tab.label === 'Contact')
    const offices = getNamedField<{
      admin?: { initCollapsed?: boolean }
      fields?: Array<{ name?: string; required?: boolean; type?: string }>
      name?: string
      type?: string
    }>(contact?.fields ?? [], 'officeLocations')

    expect(offices?.type).toBe('array')
    expect(offices?.admin?.initCollapsed).toBe(true)
    expect(offices?.fields?.map((field) => field.name)).toEqual([
      'region',
      'city',
      'address',
      'phone',
      'email',
      'mapEmbedUrl',
      'mapUrl',
      'mapTitle',
    ])
    expect(offices?.fields?.every((field) => field.required)).toBe(true)
  })

  it.each([
    ['https://www.google.com/maps/embed?pb=abc', true],
    ['http://maps.example.com/embed', 'Enter a complete HTTPS URL.'],
    ['javascript:alert(1)', 'Enter a complete HTTPS URL.'],
    ['/relative-map', 'Enter a complete HTTPS URL.'],
  ])('validates map URL %s', (value, expected) => {
    expect(validateHttpsUrl(value)).toBe(expected)
  })

  it('normalizes complete offices and rejects incomplete rows', () => {
    expect(
      normalizeSiteOfficeLocations([
        {
          id: 'dubai',
          region: ' Middle East ',
          city: ' Dubai ',
          address: ' DIFC, Gate Building ',
          phone: ' +971 4 555 0123 ',
          email: ' dubai@example.com ',
          mapEmbedUrl: ' https://www.google.com/maps/embed?pb=dubai ',
          mapUrl: ' https://maps.google.com/?q=Dubai ',
          mapTitle: ' Interactive map for the Dubai office ',
        },
        {
          id: 'invalid',
          region: 'Europe',
          city: 'London',
          address: '',
          phone: '+44 20 7555 0123',
          email: 'london@example.com',
          mapEmbedUrl: 'https://www.google.com/maps/embed?pb=london',
          mapUrl: 'https://maps.google.com/?q=London',
          mapTitle: 'Interactive map for the London office',
        },
      ]),
    ).toEqual([
      {
        id: 'dubai',
        region: 'Middle East',
        city: 'Dubai',
        address: 'DIFC, Gate Building',
        phone: '+971 4 555 0123',
        phoneHref: 'tel:+97145550123',
        email: 'dubai@example.com',
        mapEmbedUrl: 'https://www.google.com/maps/embed?pb=dubai',
        mapUrl: 'https://maps.google.com/?q=Dubai',
        mapTitle: 'Interactive map for the Dubai office',
      },
    ])
  })

  it('rejects non-HTTPS map values even when the remaining row is complete', () => {
    expect(
      normalizeSiteOfficeLocations([
        {
          region: 'North America',
          city: 'New York',
          address: '350 Fifth Avenue',
          phone: '+1 (212) 555-0123',
          email: 'nyc@example.com',
          mapEmbedUrl: 'javascript:alert(1)',
          mapUrl: 'https://maps.google.com/?q=New+York',
          mapTitle: 'Interactive map for the New York office',
        },
      ]),
    ).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test and confirm the missing module failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/site-offices.int.spec.ts
```

Expected: FAIL because `@/lib/siteOfficesShared` does not exist and Site Settings has no
`officeLocations` field.

- [ ] **Step 3: Implement the client-safe office contract**

Create `src/lib/siteOfficesShared.ts`:

```ts
export type SiteOfficeLocationSource = {
  address?: string | null
  city?: string | null
  email?: string | null
  id?: string | null
  mapEmbedUrl?: string | null
  mapTitle?: string | null
  mapUrl?: string | null
  phone?: string | null
  region?: string | null
}

export type SiteOfficeLocation = {
  address: string
  city: string
  email: string
  id: string
  mapEmbedUrl: string
  mapTitle: string
  mapUrl: string
  phone: string
  phoneHref: string
  region: string
}

const httpsUrlError = 'Enter a complete HTTPS URL.'

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export const validateHttpsUrl = (value: unknown): true | string => {
  if (typeof value !== 'string' || !value.trim()) {
    return true
  }

  return isHttpsUrl(value.trim()) ? true : httpsUrlError
}

const trimValue = (value: string | null | undefined) => value?.trim() ?? ''

export function normalizeSiteOfficeLocations(
  values: SiteOfficeLocationSource[] | null | undefined,
): SiteOfficeLocation[] {
  return (values ?? []).flatMap((office, index): SiteOfficeLocation[] => {
    const address = trimValue(office.address)
    const city = trimValue(office.city)
    const email = trimValue(office.email)
    const mapEmbedUrl = trimValue(office.mapEmbedUrl)
    const mapTitle = trimValue(office.mapTitle)
    const mapUrl = trimValue(office.mapUrl)
    const phone = trimValue(office.phone)
    const region = trimValue(office.region)
    const phoneTarget = phone.replace(/[^\d+]/g, '')

    if (
      !address ||
      !city ||
      !email ||
      !mapTitle ||
      !phone ||
      !phoneTarget ||
      !region ||
      !isHttpsUrl(mapEmbedUrl) ||
      !isHttpsUrl(mapUrl)
    ) {
      return []
    }

    return [
      {
        address,
        city,
        email,
        id: trimValue(office.id) || `office-${index + 1}`,
        mapEmbedUrl,
        mapTitle,
        mapUrl,
        phone,
        phoneHref: `tel:${phoneTarget}`,
        region,
      },
    ]
  })
}
```

- [ ] **Step 4: Add the office array to Site Settings**

Import the validator in `src/globals/SiteSettings.ts`:

```ts
import { validateHttpsUrl } from '@/lib/siteOfficesShared'
```

Append this field after `googleMapEmbedUrl` in the Contact tab:

```ts
{
  name: 'officeLocations',
  label: 'Office Locations',
  type: 'array',
  admin: {
    description:
      'Shared office directory used by Contact 24 blocks. Drag rows to control display order.',
    initCollapsed: true,
  },
  fields: [
    { name: 'region', type: 'text', required: true },
    { name: 'city', type: 'text', required: true },
    { name: 'address', type: 'textarea', required: true },
    { name: 'phone', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    {
      name: 'mapEmbedUrl',
      label: 'Interactive Map Embed URL',
      type: 'text',
      required: true,
      validate: validateHttpsUrl,
      admin: {
        description: 'Paste the HTTPS URL from the map provider embed code.',
      },
    },
    {
      name: 'mapUrl',
      label: 'External Map URL',
      type: 'text',
      required: true,
      validate: validateHttpsUrl,
      admin: {
        description: 'Full HTTPS destination opened by View on Map.',
      },
    },
    {
      name: 'mapTitle',
      label: 'Accessible Map Title',
      type: 'text',
      required: true,
      admin: {
        description: 'For example: Interactive map for the Dubai office.',
      },
    },
  ],
}
```

- [ ] **Step 5: Generate Payload types and run the focused test**

Run:

```bash
pnpm run generate:types
pnpm exec vitest run --config ./vitest.config.mts tests/int/site-offices.int.spec.ts
```

Expected: generated `SiteSetting` includes `officeLocations`; the focused test passes.

- [ ] **Step 6: Commit the office directory contract**

```bash
git add src/globals/SiteSettings.ts src/lib/siteOfficesShared.ts src/payload-types.ts tests/int/site-offices.int.spec.ts
git commit -m "feat: add site office directory"
```

---

### Task 2: Scaffold and adapt the Contact 24 presentation

**Files:**
- Create: `tests/int/contact24-render.int.spec.tsx`
- Create via shadcn, then replace: `src/components/contact24.tsx`
- Preserve unchanged: `src/components/ui/button.tsx`
- Preserve unchanged: `src/lib/utils.ts`

**Interfaces:**
- Consumes: `SiteOfficeLocation` from Task 1.
- Produces: `Contact24Props`.
- Produces: `Contact24(props)`.

- [ ] **Step 1: Write the failing presentation tests**

Create `tests/int/contact24-render.int.spec.tsx`:

```tsx
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Contact24 } from '@/components/contact24'
import type { SiteOfficeLocation } from '@/lib/siteOfficesShared'

const offices: SiteOfficeLocation[] = [
  {
    id: 'dubai',
    region: 'Middle East',
    city: 'Dubai',
    address: 'DIFC, Gate Building, Level 13',
    phone: '+971 4 555 0123',
    phoneHref: 'tel:+97145550123',
    email: 'dubai@example.com',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=dubai',
    mapUrl: 'https://maps.google.com/?q=Dubai',
    mapTitle: 'Interactive map for the Dubai office',
  },
]

describe('contact24 presentation', () => {
  it.each(['compact', 'default', 'comfortable'] as const)(
    'uses shared regular-block spacing for %s',
    (size) => {
      const html = renderToStaticMarkup(
        createElement(Contact24, {
          offices,
          size,
          title: 'Our offices',
        }),
      )

      expect(html).toContain(`data-contact24-size="${size}"`)
      expect(html).toContain('py-12 md:py-16')
      expect(html).toContain('mx-auto w-full max-w-screen-2xl px-4')
    },
  )

  it('renders project typography, theme Card composition, and a responsive grid', () => {
    const html = renderToStaticMarkup(
      <Contact24
        contentAlignment="center"
        description="We are here wherever you are."
        eyebrow="Locations"
        offices={offices}
        title="Our offices"
      />,
    )

    expect(html).toContain('font-mono text-xs font-semibold uppercase')
    expect(html).toContain('text-3xl font-semibold tracking-tight text-balance')
    expect(html).toContain('text-base leading-7')
    expect(html).toContain('grid-cols-1')
    expect(html).toContain('md:grid-cols-2')
    expect(html).toContain('data-slot="card"')
    expect(html).toContain('data-slot="card-header"')
    expect(html).toContain('data-slot="card-content"')
    expect(html).toContain('data-slot="card-footer"')
    expect(html).toContain('data-contact24-content-alignment="center"')
  })

  it('renders an accessible lazy map and semantic contact links', () => {
    const html = renderToStaticMarkup(
      <Contact24 offices={offices} title="Our offices" />,
    )

    expect(html).toContain('title="Interactive map for the Dubai office"')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('referrerPolicy="no-referrer-when-downgrade"')
    expect(html).toContain('href="tel:+97145550123"')
    expect(html).toContain('href="mailto:dubai@example.com"')
    expect(html).toContain('href="https://maps.google.com/?q=Dubai"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noreferrer"')
    expect(html).toContain('data-icon="inline-end"')
    expect(html).toContain('View on Map')
  })

  it('renders nothing without a title or complete office data', () => {
    expect(renderToStaticMarkup(<Contact24 offices={[]} title="Our offices" />)).toBe('')
    expect(renderToStaticMarkup(<Contact24 offices={offices} title="" />)).toBe('')
  })
})
```

- [ ] **Step 2: Run the test and confirm the component is missing**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/contact24-render.int.spec.tsx
```

Expected: FAIL because `@/components/contact24` does not exist.

- [ ] **Step 3: Re-run the registry dry run and protect the local Button**

Run:

```bash
pnpm exec shadcn add @shadcnblocks/contact24 --dry-run
pnpm exec shadcn add @shadcnblocks/contact24 --diff src/components/ui/button.tsx
```

Expected: one new `src/components/contact24.tsx`, identical `src/lib/utils.ts`, and a proposed
Button overwrite that changes the project `rounded-md` control radius to `rounded-4xl`.

- [ ] **Step 4: Add the registry item without overwriting shared UI**

Run:

```bash
pnpm exec shadcn add @shadcnblocks/contact24
```

At the Button overwrite prompt, answer `No`. Confirm with `git diff -- src/components/ui/button.tsx`
that the local Button remains unchanged.

- [ ] **Step 5: Replace the registry component with the approved presentation**

Replace `src/components/contact24.tsx` with:

```tsx
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { SiteOfficeLocation } from '@/lib/siteOfficesShared'
import { cn } from '@/lib/utils'

export type Contact24Size = 'comfortable' | 'compact' | 'default'
export type Contact24Alignment = 'center' | 'left' | 'right'

export type Contact24Props = {
  appearance?: BlockAppearance | null
  className?: string
  contentAlignment?: Contact24Alignment
  description?: string | null
  eyebrow?: string | null
  offices: SiteOfficeLocation[]
  size?: Contact24Size
  title: string
}

const headerGapClasses = {
  compact: 'gap-3',
  default: 'gap-4',
  comfortable: 'gap-5',
} as const

const sectionGapClasses = {
  compact: 'gap-8',
  default: 'gap-10',
  comfortable: 'gap-12',
} as const

const gridGapClasses = {
  compact: 'gap-4',
  default: 'gap-6',
  comfortable: 'gap-8',
} as const

const alignmentClasses = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
} as const

export function Contact24({
  appearance,
  className,
  contentAlignment = 'left',
  description,
  eyebrow,
  offices,
  size = 'default',
  title,
}: Contact24Props) {
  const resolvedTitle = title.trim()
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)

  if (!resolvedTitle || offices.length === 0) {
    return null
  }

  return (
    <section
      className={cn(
        regularBlockMobilePaddingClasses[size],
        appearanceClasses.className,
        className,
      )}
      data-contact24-background={appearance?.background ?? 'none'}
      data-contact24-size={size}
    >
      <div className={regularBlockContainerClasses}>
        <div className={cn('flex flex-col', sectionGapClasses[size])}>
          <header
            className={cn(
              'flex max-w-3xl flex-col',
              headerGapClasses[size],
              alignmentClasses[contentAlignment],
              contentAlignment === 'center' && 'mx-auto',
              contentAlignment === 'right' && 'ml-auto',
            )}
            data-contact24-content-alignment={contentAlignment}
          >
            {eyebrow ? (
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-current/70">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {resolvedTitle}
            </h2>
            {description ? (
              <p className="text-base leading-7 text-current/70">{description}</p>
            ) : null}
          </header>

          <div className={cn('grid grid-cols-1 md:grid-cols-2', gridGapClasses[size])}>
            {offices.map((office) => (
              <Card className="gap-0 py-0" key={office.id}>
                <div className="relative aspect-video overflow-hidden">
                  <iframe
                    allowFullScreen
                    className="size-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={office.mapEmbedUrl}
                    title={office.mapTitle}
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent"
                  />
                  <CardHeader className="pointer-events-none absolute inset-x-0 bottom-0">
                    <CardDescription className="font-mono text-xs font-semibold uppercase tracking-[0.18em]">
                      {office.region}
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tracking-tight">
                      {office.city}
                    </CardTitle>
                  </CardHeader>
                </div>

                <CardContent className="flex flex-1 flex-col pt-(--card-spacing)">
                  <address className="flex flex-col gap-3 not-italic">
                    <div className="flex items-start gap-3">
                      <MapPin
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      />
                      <span>{office.address}</span>
                    </div>
                    <a className="flex items-center gap-3 hover:underline" href={office.phoneHref}>
                      <Phone
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                      {office.phone}
                    </a>
                    <a
                      className="flex items-center gap-3 hover:underline"
                      href={`mailto:${office.email}`}
                    >
                      <Mail
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                      {office.email}
                    </a>
                  </address>
                </CardContent>

                <CardFooter className="pb-(--card-spacing)">
                  <Button asChild className="w-full" variant="outline">
                    <a href={office.mapUrl} rel="noreferrer" target="_blank">
                      View on Map
                      <ExternalLink data-icon="inline-end" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Run the presentation tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/contact24-render.int.spec.tsx
```

Expected: PASS. If React serializes `referrerPolicy` as lowercase in this version, change only that
assertion to the exact rendered attribute name while retaining the component prop.

- [ ] **Step 7: Commit the adapted presentation**

```bash
git add src/components/contact24.tsx tests/int/contact24-render.int.spec.tsx
git commit -m "feat: add contact 24 presentation"
```

---

### Task 3: Add the Payload block and published office data path

**Files:**
- Create: `tests/int/contact24-data.int.spec.ts`
- Create: `src/lib/siteOffices.ts`
- Create: `src/blocks/Contact24/config.ts`
- Create: `src/blocks/Contact24/Presentation.tsx`
- Create: `src/blocks/Contact24/Component.tsx`
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/collections/Pages.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `src/payload-types.ts`

**Interfaces:**
- Consumes: `normalizeSiteOfficeLocations` and `Contact24`.
- Produces: `getPublishedSiteOfficeLocations()` and `getDraftSiteOfficeLocations()`.
- Produces: `Contact24BlockPresentation`.
- Produces: async `Contact24BlockComponent`.
- Produces: `Contact24Block`.

- [ ] **Step 1: Write failing loader and block-schema tests**

Create `tests/int/contact24-data.int.spec.ts`:

```ts
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findGlobal: vi.fn(),
  getPayload: vi.fn(),
}))

vi.mock('@payload-config', () => ({ default: Promise.resolve({}) }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))

import { Contact24Block } from '@/blocks/Contact24/config'
import { Contact24BlockComponent } from '@/blocks/Contact24/Component'
import {
  getDraftSiteOfficeLocations,
  getPublishedSiteOfficeLocations,
} from '@/lib/siteOffices'

const office = {
  id: 'dubai',
  region: 'Middle East',
  city: 'Dubai',
  address: 'DIFC',
  phone: '+971 4 555 0123',
  email: 'dubai@example.com',
  mapEmbedUrl: 'https://www.google.com/maps/embed?pb=dubai',
  mapUrl: 'https://maps.google.com/?q=Dubai',
  mapTitle: 'Interactive map for the Dubai office',
}

beforeEach(() => {
  mocks.findGlobal.mockReset()
  mocks.getPayload.mockReset()
  mocks.getPayload.mockResolvedValue({ findGlobal: mocks.findGlobal })
  mocks.findGlobal.mockResolvedValue({ officeLocations: [office] })
})

describe('contact24 data path', () => {
  it('loads and normalizes published and draft Site Settings independently', async () => {
    await expect(getPublishedSiteOfficeLocations()).resolves.toMatchObject([
      { city: 'Dubai', phoneHref: 'tel:+97145550123' },
    ])
    await expect(getDraftSiteOfficeLocations()).resolves.toMatchObject([
      { city: 'Dubai', phoneHref: 'tel:+97145550123' },
    ])

    expect(mocks.findGlobal).toHaveBeenCalledWith({
      depth: 0,
      draft: false,
      slug: 'site-settings',
    })
    expect(mocks.findGlobal).toHaveBeenCalledWith({
      depth: 0,
      draft: true,
      slug: 'site-settings',
    })
  })

  it('joins published Site Settings data with public block presentation', async () => {
    const html = renderToStaticMarkup(
      await Contact24BlockComponent({
        description: 'Regional support',
        eyebrow: 'Locations',
        title: 'Global offices',
      }),
    )

    expect(html).toContain('Global offices')
    expect(html).toContain('Dubai')
    expect(html).toContain('data-contact24-background="none"')
  })

  it('defines the approved Payload content and layout fields', () => {
    const tabs = Contact24Block.fields[0] as {
      tabs?: Array<{ fields: Array<Record<string, unknown>>; label: string }>
      type?: string
    }
    const content = tabs.tabs?.find((tab) => tab.label === 'Content')
    const layout = tabs.tabs?.find((tab) => tab.label === 'Layout & Theme')
    const byName = (fields: Array<Record<string, unknown>>, name: string) =>
      fields.find((field) => field.name === name)

    expect(tabs.type).toBe('tabs')
    expect(content?.fields.map((field) => field.name)).toEqual([
      'eyebrow',
      'title',
      'description',
    ])
    expect(byName(content?.fields ?? [], 'title')?.required).toBe(true)
    expect(byName(layout?.fields ?? [], 'appearance')?.type).toBe('group')
    expect(byName(layout?.fields ?? [], 'contentAlignment')).toMatchObject({
      defaultValue: 'left',
      type: 'select',
    })
    expect(byName(layout?.fields ?? [], 'size')).toMatchObject({
      defaultValue: 'default',
      type: 'select',
    })
  })
})
```

- [ ] **Step 2: Run the test and confirm the missing block/loader failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/contact24-data.int.spec.ts
```

Expected: FAIL because the Contact 24 block and server office loader do not exist.

- [ ] **Step 3: Implement the cached server-only office loader**

Create `src/lib/siteOffices.ts`:

```ts
import 'server-only'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import {
  normalizeSiteOfficeLocations,
  type SiteOfficeLocation,
} from '@/lib/siteOfficesShared'

const loadSiteOfficeLocations = cache(async (draft: boolean): Promise<SiteOfficeLocation[]> => {
  const payload = await getPayload({ config: configPromise })
  const settings = await payload.findGlobal({
    depth: 0,
    draft,
    slug: 'site-settings',
  })

  return normalizeSiteOfficeLocations(settings.officeLocations)
})

export const getPublishedSiteOfficeLocations = () => loadSiteOfficeLocations(false)
export const getDraftSiteOfficeLocations = () => loadSiteOfficeLocations(true)
```

- [ ] **Step 4: Add thumbnail metadata before the typed block config**

Add this definition after Contact 33 in `src/block-thumbnails/definitions.ts`:

```ts
defineThumbnail({
  alt: 'Contact 24 block preview',
  filename: 'contact-24.jpg',
  label: 'Contact 24',
  slug: 'contact24',
  stageAlignment: 'top',
}),
```

- [ ] **Step 5: Implement the Payload block schema**

Create `src/blocks/Contact24/config.ts`:

```ts
import type { Block, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'

const contentAlignmentField = {
  name: 'contentAlignment',
  label: 'Content Alignment',
  type: 'select',
  defaultValue: 'left',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
  required: true,
} satisfies SelectField

const sizeField = {
  name: 'size',
  label: 'Size',
  type: 'select',
  defaultValue: 'default',
  options: [
    { label: 'Compact', value: 'compact' },
    { label: 'Default', value: 'default' },
    { label: 'Comfortable', value: 'comfortable' },
  ],
  required: true,
} satisfies SelectField

export const Contact24Block: Block = {
  slug: 'contact24',
  interfaceName: 'Contact24Block',
  admin: getBlockThumbnailAdmin('contact24'),
  labels: {
    singular: 'Contact 24',
    plural: 'Contact 24 Blocks',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'eyebrow', type: 'text' },
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'textarea' },
          ],
        },
        {
          label: 'Layout & Theme',
          fields: [
            createBlockAppearanceFields({ includeTextOverride: false }),
            contentAlignmentField,
            sizeField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
```

- [ ] **Step 6: Implement the pure and public adapters**

Create `src/blocks/Contact24/Presentation.tsx`:

```tsx
import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import { Contact24 } from '@/components/contact24'
import type { SiteOfficeLocation } from '@/lib/siteOfficesShared'

export type Contact24BlockLike = {
  appearance?: BlockAppearance | null
  contentAlignment?: 'center' | 'left' | 'right' | null
  description?: string | null
  eyebrow?: string | null
  size?: 'comfortable' | 'compact' | 'default' | null
  title?: string | null
}

export function Contact24BlockPresentation({
  appearance,
  contentAlignment = 'left',
  description,
  eyebrow,
  offices,
  size = 'default',
  title,
}: Contact24BlockLike & { offices: SiteOfficeLocation[] }) {
  const resolvedTitle = title?.trim()

  if (!resolvedTitle) {
    return null
  }

  return (
    <Contact24
      appearance={appearance}
      contentAlignment={contentAlignment ?? 'left'}
      description={description?.trim()}
      eyebrow={eyebrow?.trim()}
      offices={offices}
      size={size ?? 'default'}
      title={resolvedTitle}
    />
  )
}
```

Create `src/blocks/Contact24/Component.tsx`:

```tsx
import {
  Contact24BlockPresentation,
  type Contact24BlockLike,
} from '@/blocks/Contact24/Presentation'
import { getPublishedSiteOfficeLocations } from '@/lib/siteOffices'

export async function Contact24BlockComponent(props: Contact24BlockLike) {
  const offices = await getPublishedSiteOfficeLocations()

  return <Contact24BlockPresentation {...props} offices={offices} />
}
```

- [ ] **Step 7: Register the block on public pages**

In `src/collections/Pages.ts`, import `Contact24Block` and place it immediately after
`Contact33Block` in the Page layout block array.

In `src/blocks/renderPageBlocks.tsx`, import `Contact24BlockComponent` and add:

```tsx
case 'contact24':
  return (
    <Contact24BlockComponent
      key={block.id ?? `${block.blockType}-${index}`}
      {...block}
    />
  )
```

Update the expected Page block slug list in `tests/int/page-blocks.int.spec.ts` by inserting
`contact24` immediately after `contact33`. Add this source registration test:

```ts
it('registers contact24 in public page rendering', () => {
  const source = readFileSync('src/blocks/renderPageBlocks.tsx', 'utf8')

  expect(source).toContain(
    "import { Contact24BlockComponent } from './Contact24/Component'",
  )
  expect(source).toContain("case 'contact24':")
})
```

- [ ] **Step 8: Generate types and run the focused contract tests**

Run:

```bash
pnpm run generate:types
pnpm exec vitest run --config ./vitest.config.mts tests/int/site-offices.int.spec.ts tests/int/contact24-data.int.spec.ts tests/int/contact24-render.int.spec.tsx tests/int/page-blocks.int.spec.ts
```

Expected: PASS and generated `Page['layout']` includes `Contact24Block`.

- [ ] **Step 9: Commit the public data path**

```bash
git add src/block-thumbnails/definitions.ts src/blocks/Contact24 src/blocks/renderPageBlocks.tsx src/collections/Pages.ts src/lib/siteOffices.ts src/payload-types.ts tests/int/contact24-data.int.spec.ts tests/int/page-blocks.int.spec.ts
git commit -m "feat: register contact 24 block"
```

---

### Task 4: Add draft Site Settings to live preview

**Files:**
- Create: `src/blocks/Contact24/PreviewComponent.tsx`
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx`
- Modify: `src/components/live-preview/PageLivePreview.tsx`
- Modify: `src/app/(frontend)/preview/page/[id]/page.tsx`
- Modify: `tests/int/live-preview-renderer.int.spec.tsx`
- Modify: `tests/int/live-preview-import-boundary.int.spec.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`

**Interfaces:**
- Consumes: `SiteOfficeLocation[]` and `getDraftSiteOfficeLocations()`.
- Produces: `Contact24PreviewBlockComponent`.
- Changes: `renderLivePreviewPageBlocks` accepts `officeLocations` as its fourth argument.
- Changes: `PageLivePreview` requires an `officeLocations` prop.

- [ ] **Step 1: Write the failing snapshot-preview test**

Append this test in `tests/int/live-preview-renderer.int.spec.tsx`, using the existing review and
news snapshots:

```tsx
it('renders contact24 from the server-provided draft office snapshot', () => {
  const offices = [
    {
      id: 'draft-office',
      region: 'Middle East',
      city: 'Draft Dubai',
      address: 'DIFC',
      phone: '+971 4 555 0123',
      phoneHref: 'tel:+97145550123',
      email: 'dubai@example.com',
      mapEmbedUrl: 'https://www.google.com/maps/embed?pb=draft',
      mapUrl: 'https://maps.google.com/?q=Dubai',
      mapTitle: 'Interactive map for the draft Dubai office',
    },
  ]
  const layout = [
    { blockType: 'contact24', title: 'Global offices' },
  ] as unknown as NonNullable<Page['layout']>
  const html = renderToStaticMarkup(
    renderLivePreviewPageBlocks(
      layout,
      {
        feedPagesBySize: {},
        ratingDistribution: { average: 0, count: 0, counts: [0, 0, 0, 0, 0] },
      },
      EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT,
      offices,
    ),
  )

  expect(html).toContain('Global offices')
  expect(html).toContain('Draft Dubai')
  expect(html).toContain('data-contact24-size="default"')
})
```

Also update the existing `renderLivePreviewPageBlocks` call in that file to pass `[]` as the
fourth argument.

- [ ] **Step 2: Run the preview test and confirm the signature/case failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/live-preview-renderer.int.spec.tsx
```

Expected: FAIL because the renderer has no office snapshot parameter or Contact 24 case.

- [ ] **Step 3: Implement the client-safe preview adapter**

Create `src/blocks/Contact24/PreviewComponent.tsx`:

```tsx
import {
  Contact24BlockPresentation,
  type Contact24BlockLike,
} from '@/blocks/Contact24/Presentation'
import type { SiteOfficeLocation } from '@/lib/siteOfficesShared'

export function Contact24PreviewBlockComponent({
  officeLocations,
  ...props
}: Contact24BlockLike & { officeLocations: SiteOfficeLocation[] }) {
  return <Contact24BlockPresentation {...props} offices={officeLocations} />
}
```

- [ ] **Step 4: Pass the snapshot through the client renderer**

In `src/blocks/renderLivePreviewPageBlocks.tsx`:

```ts
import type { SiteOfficeLocation } from '@/lib/siteOfficesShared'
import { Contact24PreviewBlockComponent } from './Contact24/PreviewComponent'
```

Add `officeLocations: SiteOfficeLocation[]` as the fourth function parameter and add:

```tsx
case 'contact24':
  return (
    <Contact24PreviewBlockComponent
      key={key}
      officeLocations={officeLocations}
      {...block}
    />
  )
```

In `src/components/live-preview/PageLivePreview.tsx`, add
`officeLocations: SiteOfficeLocation[]` to `Props`, import the type, destructure the prop, and pass
it as the fourth `renderLivePreviewPageBlocks` argument.

- [ ] **Step 5: Load draft office data in the authenticated preview route**

Import `getDraftSiteOfficeLocations` in
`src/app/(frontend)/preview/page/[id]/page.tsx`. Replace the existing snapshot load with:

```ts
const hasContact24 = page.layout?.some((block) => block.blockType === 'contact24') ?? false
const [reviewSnapshot, newsEventsSnapshot, officeLocations] = await Promise.all([
  loadReviewPreviewSnapshot(page.layout),
  loadNewsEventsPreviewSnapshot(page.layout),
  hasContact24 ? getDraftSiteOfficeLocations() : Promise.resolve([]),
])
```

Pass `officeLocations={officeLocations}` to `PageLivePreview`.

- [ ] **Step 6: Strengthen the client import boundary and registration tests**

Add `src/lib/siteOffices.ts` to the forbidden `serverPath` array in
`tests/int/live-preview-import-boundary.int.spec.ts`.

Replace the old Contact 33-only preview source assertion in `tests/int/page-blocks.int.spec.ts`
with an additional Contact 24 assertion:

```ts
expect(source).toContain(
  "import { Contact24PreviewBlockComponent } from './Contact24/PreviewComponent'",
)
expect(source).toContain("case 'contact24':")
```

- [ ] **Step 7: Run preview and boundary tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts tests/int/page-blocks.int.spec.ts
```

Expected: PASS; `src/lib/siteOffices.ts` is unreachable from `PageLivePreview`.

- [ ] **Step 8: Commit live preview**

```bash
git add 'src/app/(frontend)/preview/page/[id]/page.tsx' src/blocks/Contact24/PreviewComponent.tsx src/blocks/renderLivePreviewPageBlocks.tsx src/components/live-preview/PageLivePreview.tsx tests/int/live-preview-import-boundary.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/page-blocks.int.spec.ts
git commit -m "feat: preview contact 24 offices"
```

---

### Task 5: Add the deterministic thumbnail and verify the feature

**Files:**
- Create: `public/block-thumbnail-assets/office-map.svg`
- Create: `public/block-thumbnails/contact-24.jpg`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Verify: every Contact 24 and Site Settings file from Tasks 1–4

**Interfaces:**
- Consumes: `Contact24` and `SiteOfficeLocation`.
- Produces: `blockThumbnailFixtures.contact24`.
- Produces: exact 1600×900 `contact-24.jpg`.

- [ ] **Step 1: Add a failing thumbnail metadata assertion**

In `tests/int/block-thumbnails.int.spec.ts`:

- insert `contact24` next to `contact33` in the expected registered-slug list
- add:

```ts
expect(getBlockThumbnailDefinition('contact24')).toMatchObject({
  alt: 'Contact 24 block preview',
  filename: 'contact-24.jpg',
  label: 'Contact 24',
  slug: 'contact24',
  stageAlignment: 'top',
})
```

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: FAIL because the fixture and JPEG are missing.

- [ ] **Step 2: Create local map artwork for the thumbnail**

Create `public/block-thumbnail-assets/office-map.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="#e7e5e4"/>
  <g fill="none" stroke="#fafaf9" stroke-width="18">
    <path d="M-40 120 260 260 520 80 1000 300"/>
    <path d="M80-40 300 180 250 580"/>
    <path d="M620-40 590 190 780 580"/>
    <path d="M-40 420 260 340 520 460 1000 390"/>
  </g>
  <g fill="none" stroke="#a8a29e" stroke-width="4">
    <path d="M0 210 290 90 520 260 960 120"/>
    <path d="M120 0 470 540"/>
    <path d="M760 0 540 540"/>
  </g>
  <circle cx="535" cy="270" r="30" fill="#171717"/>
  <circle cx="535" cy="270" r="10" fill="#fafafa"/>
</svg>
```

Add `/block-thumbnail-assets/office-map.svg` to `blockThumbnailAssetPaths` in
`src/block-thumbnails/fixtures.tsx` and destructure it as `officeMap`.

- [ ] **Step 3: Add a deterministic Contact 24 fixture**

Import `Contact24` and `SiteOfficeLocation` in `src/block-thumbnails/fixtures.tsx`. Define:

```ts
const contact24OfficeFixtures: SiteOfficeLocation[] = [
  {
    id: 'new-york',
    region: 'North America',
    city: 'New York',
    address: '350 Fifth Avenue, New York, NY 10118',
    phone: '+1 (212) 555-0123',
    phoneHref: 'tel:+12125550123',
    email: 'nyc@northstar.example',
    mapEmbedUrl: officeMap,
    mapUrl: 'https://maps.google.com/?q=New+York',
    mapTitle: 'Interactive map for the New York office',
  },
  {
    id: 'dubai',
    region: 'Middle East',
    city: 'Dubai',
    address: 'DIFC, Gate Building, Level 13, Dubai, UAE',
    phone: '+971 4 555 0123',
    phoneHref: 'tel:+97145550123',
    email: 'dubai@northstar.example',
    mapEmbedUrl: officeMap,
    mapUrl: 'https://maps.google.com/?q=Dubai',
    mapTitle: 'Interactive map for the Dubai office',
  },
]
```

Add this fixture next to Contact 33:

```tsx
contact24: (
  <Contact24
    appearance={{ background: 'muted', border: 'topAndBottom' }}
    description="Regional teams provide local support wherever your work takes you."
    eyebrow="Global presence"
    offices={contact24OfficeFixtures}
    size="compact"
    title="Our offices"
  />
),
```

- [ ] **Step 4: Run fixture coverage, then generate the Contact 24 JPEG**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnail-fixtures.int.spec.ts
BLOCK_THUMBNAIL_SLUG=contact24 pnpm run generate:block-thumbnails
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts
```

Expected: fixture coverage passes; the generator writes
`public/block-thumbnails/contact-24.jpg`; metadata test reports JPEG, 1600×900.

- [ ] **Step 5: Run all focused Contact 24 tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/site-offices.int.spec.ts tests/int/contact24-render.int.spec.tsx tests/int/contact24-data.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Run focused lint and generated-type verification**

Run:

```bash
pnpm run generate:types
pnpm exec eslint src/globals/SiteSettings.ts src/lib/siteOfficesShared.ts src/lib/siteOffices.ts src/components/contact24.tsx src/blocks/Contact24 src/blocks/renderPageBlocks.tsx src/blocks/renderLivePreviewPageBlocks.tsx src/components/live-preview/PageLivePreview.tsx 'src/app/(frontend)/preview/page/[id]/page.tsx' tests/int/site-offices.int.spec.ts tests/int/contact24-render.int.spec.tsx tests/int/contact24-data.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx
git diff --check
```

Expected: focused lint passes and `git diff --check` emits no output.

- [ ] **Step 7: Check full-project baselines without changing unrelated code**

Run:

```bash
pnpm run lint
pnpm run build
```

Expected baseline: full lint may still report the pre-existing
`src/blocks/StatsStrip/AnimatedMetricValue.tsx` set-state-in-effect errors; build may still report
the pre-existing `src/blocks/TeamShowcase/Component.tsx` boolean/null type error. Confirm neither
command reports a new Contact 24 or Site Settings failure.

- [ ] **Step 8: Commit the thumbnail and final generated types**

```bash
git add public/block-thumbnail-assets/office-map.svg public/block-thumbnails/contact-24.jpg src/block-thumbnails/fixtures.tsx src/payload-types.ts tests/int/block-thumbnails.int.spec.ts
git commit -m "feat: add contact 24 thumbnail"
```

- [ ] **Step 9: Confirm the final worktree and commit sequence**

Run:

```bash
git status --short
git log -5 --oneline
```

Expected: clean worktree and these feature commits in order:

```text
feat: add contact 24 thumbnail
feat: preview contact 24 offices
feat: register contact 24 block
feat: add contact 24 presentation
feat: add site office directory
```
