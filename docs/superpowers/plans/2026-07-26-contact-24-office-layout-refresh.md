# Contact 24 Office Layout Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render every complete office in a maximum two-column Contact 24 layout with full-width single-office behavior and square, corner-accented details panels below each map.

**Architecture:** Keep the existing strict Site Settings normalizer and server data flow unchanged. Refactor only the pure Contact 24 presentation and its focused rendering tests so grid selection depends on normalized office count and each office becomes a map followed by a semantic details surface.

**Tech Stack:** TypeScript, React Server Components, Next.js 16, Payload CMS 3, Tailwind CSS 4, shadcn Button, Vitest, React DOM server rendering

## Global Constraints

- Keep the shared regular-block container, outer spacing, heading scale, font families, and theme appearance behavior.
- One office uses one full-width column at every breakpoint.
- Two or more offices use two equal columns from the medium breakpoint.
- Mobile and narrow tablet layouts always use one column.
- Region, city, address, phone, email, and the map action render below the map in that order.
- The details panel inherits the block background, uses four-sided borders and four separate offset L-shaped corner brackets, and has no border radius.
- The map wrapper adds no background.
- Maps use 16:9 on narrow mobile screens and 5:2 from the small breakpoint.
- A 16px gap separates each map from its details panel.
- The normalizer remains strict; incomplete office rows do not render.
- Do not add dependencies, global tokens, CMS fields, migrations, or map URL fallbacks.

---

## File structure

- Modify `src/components/contact24.tsx`: responsive office grid and square map/details presentation.
- Modify `src/blocks/Contact24/config.ts`: independent details alignment field.
- Modify `src/blocks/Contact24/Presentation.tsx`: pass details alignment and address-detail visibility into the presentation.
- Modify `src/payload-types.ts`: generated `detailsAlignment` and `showAddressDetails` block types.
- Modify `tests/int/contact24-render.int.spec.tsx`: count-aware grid, multi-office rendering, content order, and visual-semantic regression coverage.
- Modify `tests/int/contact24-data.int.spec.ts`: Payload details-alignment schema coverage.
- Reuse `tests/int/site-offices.int.spec.ts`: existing strict normalization and valid-sibling behavior coverage; no file change required.

### Task 1: Refactor the Contact 24 office presentation

**Files:**

- Modify: `tests/int/contact24-render.int.spec.tsx`
- Modify: `src/components/contact24.tsx`

**Interfaces:**

- Consumes: `Contact24Props`, `SiteOfficeLocation[]`, shared block spacing, `Button`, and `cn()`.
- Produces: unchanged `Contact24(props: Contact24Props)` public API.
- Produces: `CornerBorderAccents()` as an internal decorative component.

- [ ] **Step 1: Expand the office fixture for deterministic multi-office tests**

Replace the single `offices` fixture in `tests/int/contact24-render.int.spec.tsx` with a factory and
four complete offices:

```tsx
const createOffice = (
  id: string,
  city: string,
  region: string,
): SiteOfficeLocation => ({
  id,
  region,
  city,
  address: `${city} office address`,
  phone: '+971 4 555 0123',
  phoneHref: 'tel:+97145550123',
  email: `${id}@example.com`,
  mapEmbedUrl: `https://www.google.com/maps/embed?pb=${id}`,
  mapUrl: `https://maps.google.com/?q=${city}`,
  mapTitle: `Interactive map for the ${city} office`,
})

const offices = [
  createOffice('dubai', 'Dubai', 'Middle East'),
  createOffice('london', 'London', 'Europe'),
  createOffice('new-york', 'New York', 'North America'),
  createOffice('singapore', 'Singapore', 'Asia Pacific'),
]
```

Update tests that only need one office to pass `offices.slice(0, 1)`.

- [ ] **Step 2: Write failing count-aware layout and all-office rendering tests**

Add these tests to `tests/int/contact24-render.int.spec.tsx`:

```tsx
it('uses the full row for one office', () => {
  const html = renderToStaticMarkup(
    <Contact24 offices={offices.slice(0, 1)} title="Our offices" />,
  )

  expect(html).toContain('data-contact24-office-count="1"')
  expect(html).not.toContain('md:grid-cols-2')
})

it('caps multiple offices at two desktop columns and renders every office', () => {
  const html = renderToStaticMarkup(
    <Contact24 offices={offices} title="Our offices" />,
  )

  expect(html).toContain('data-contact24-office-count="4"')
  expect(html).toContain('md:grid-cols-2')
  expect(html).not.toContain('lg:grid-cols-4')

  for (const office of offices) {
    expect(html).toContain(office.city)
    expect(html).toContain(office.mapEmbedUrl)
  }
})
```

- [ ] **Step 3: Write the failing map/details composition test**

Replace the current Card-composition assertions with:

```tsx
it('places square corner-accented details below each map', () => {
  const html = renderToStaticMarkup(
    <Contact24
      contentAlignment="center"
      description="We are here wherever you are."
      eyebrow="Locations"
      offices={offices.slice(0, 1)}
      title="Our offices"
    />,
  )

  expect(html).toContain('data-contact24-office')
  expect(html).toContain('data-contact24-map')
  expect(html).toContain('data-contact24-details')
  expect(html).toContain('data-contact24-corner-accents')
  expect(html).toContain('border border-border')
  expect(html).toContain('rounded-none')
  expect(html).toContain('gap-4')
  expect(html).toContain('sm:aspect-[5/2]')
  expect(html).not.toContain('bg-muted/40')
  expect(html).not.toContain('rounded-none bg-muted')
  expect(html).toContain('size-3 border-l border-t border-border')
  expect(html).toContain('size-3 border-r border-t border-border')
  expect(html).toContain('size-3 border-b border-l border-border')
  expect(html).toContain('size-3 border-b border-r border-border')
  expect(html).not.toContain('bg-gradient-to-t')
  expect(html.indexOf('data-contact24-map')).toBeLessThan(
    html.indexOf('data-contact24-details'),
  )
  expect(html.indexOf('Middle East')).toBeGreaterThan(
    html.indexOf('data-contact24-details'),
  )
  expect(html).toContain('data-contact24-content-alignment="center"')
})
```

- [ ] **Step 4: Run the focused tests and verify they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/contact24-render.int.spec.tsx
```

Expected: FAIL because Contact 24 still applies `md:grid-cols-2` to a single office, uses Card slots
and a map overlay, and lacks the new data attributes and corner accents.

- [ ] **Step 5: Replace the Card imports with the internal corner accent component**

In `src/components/contact24.tsx`, remove:

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
```

Add this internal component after the alignment class map:

```tsx
function CornerBorderAccents() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      data-contact24-corner-accents
    >
      <span className="absolute -left-1 -top-1 size-3 border-l border-t border-border" />
      <span className="absolute -right-1 -top-1 size-3 border-r border-t border-border" />
      <span className="absolute -bottom-1 -left-1 size-3 border-b border-l border-border" />
      <span className="absolute -bottom-1 -right-1 size-3 border-b border-r border-border" />
    </span>
  )
}
```

- [ ] **Step 6: Implement the count-aware grid**

Replace the office grid opening element with:

```tsx
<div
  className={cn(
    'grid grid-cols-1',
    offices.length > 1 && 'md:grid-cols-2',
    gridGapClasses[size],
  )}
  data-contact24-office-count={offices.length}
>
```

Keep mapping `offices` directly so the normalized Site Settings order is preserved.

- [ ] **Step 7: Implement the square map/details office composition**

Replace the current `Card` inside `offices.map()` with:

```tsx
<article className="flex min-w-0 flex-col gap-4" data-contact24-office key={office.id}>
  <div
    className="relative aspect-video w-full overflow-hidden rounded-none sm:aspect-[5/2]"
    data-contact24-map
  >
    <iframe
      allowFullScreen
      className="size-full border-0"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      src={office.mapEmbedUrl}
      title={office.mapTitle}
    />
  </div>

  <div
    className="relative flex flex-1 flex-col border border-border p-6 rounded-none sm:p-8"
    data-contact24-details
  >
    <CornerBorderAccents />

    <div className="flex flex-col gap-2">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {office.region}
      </p>
      <h3 className="text-2xl font-semibold tracking-tight">{office.city}</h3>
    </div>

    <address className="mt-6 flex flex-col gap-3 not-italic">
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
        className="flex min-w-0 items-center gap-3 break-all hover:underline"
        href={`mailto:${office.email}`}
      >
        <Mail
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
        {office.email}
      </a>
    </address>

    <div className="mt-auto pt-6">
      <Button asChild className="w-full" variant="outline">
        <a href={office.mapUrl} rel="noreferrer" target="_blank">
          View on Map
          <ExternalLink data-icon="inline-end" />
        </a>
      </Button>
    </div>
  </div>
</article>
```

- [ ] **Step 8: Run the focused Contact 24 tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/contact24-render.int.spec.tsx
```

Expected: all Contact 24 rendering tests PASS.

- [ ] **Step 9: Run the complete focused Contact 24 and Site Settings test set**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/contact24-render.int.spec.tsx \
  tests/int/contact24-data.int.spec.ts \
  tests/int/site-offices.int.spec.ts
```

Expected: all tests PASS, including strict incomplete-row filtering.

- [ ] **Step 10: Run focused lint**

Run:

```bash
pnpm exec eslint src/components/contact24.tsx tests/int/contact24-render.int.spec.tsx
```

Expected: PASS with no errors.

- [ ] **Step 11: Review the live Contact 24 preview**

Open:

```text
http://127.0.0.1:3000/block-thumbnail-previews/contact24
```

Expected:

- one fixture office spans the preview width
- its map appears above the details panel
- the transparent panel has square corners, four borders, and four offset L-shaped brackets
- region and city appear below the map
- no map gradient overlay remains

- [ ] **Step 12: Commit the implementation**

```bash
git add src/components/contact24.tsx tests/int/contact24-render.int.spec.tsx
git commit -m "feat: refine contact 24 office layout"
```

Expected: one focused implementation commit with no unrelated files.

### Task 2: Add independent details alignment and a compact map action

**Files:**

- Modify: `tests/int/contact24-data.int.spec.ts`
- Modify: `tests/int/contact24-render.int.spec.tsx`
- Modify: `src/blocks/Contact24/config.ts`
- Modify: `src/blocks/Contact24/Presentation.tsx`
- Modify: `src/components/contact24.tsx`
- Modify: `src/payload-types.ts`

**Interfaces:**

- Produces: `Contact24DetailsAlignment = 'center' | 'left' | 'right'`.
- Extends: `Contact24Props.detailsAlignment?: Contact24DetailsAlignment`.
- Extends: `Contact24BlockLike.detailsAlignment?: Contact24DetailsAlignment | null`.
- Preserves: strict `normalizeSiteOfficeLocations()` behavior.

- [ ] **Step 1: Write the failing Payload block schema test**

Extend the Layout & Theme assertions in `tests/int/contact24-data.int.spec.ts`:

```tsx
expect(byName(layout?.fields ?? [], 'detailsAlignment')).toMatchObject({
  defaultValue: 'left',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
  required: true,
  type: 'select',
})
```

- [ ] **Step 2: Write the failing centered-details and compact-button test**

Add to `tests/int/contact24-render.int.spec.tsx`:

```tsx
it('centers office details independently and keeps the map action compact', () => {
  const html = renderToStaticMarkup(
    <Contact24
      contentAlignment="left"
      detailsAlignment="center"
      offices={offices.slice(0, 1)}
      title="Our offices"
    />,
  )
  const buttonClass = html.match(/data-slot="button"[^>]*class="([^"]+)"/)?.[1]

  expect(html).toContain('data-contact24-content-alignment="left"')
  expect(html).toContain('data-contact24-details-alignment="center"')
  expect(html).toContain('items-center text-center')
  expect(html).toContain('self-center')
  expect(html).toContain('data-size="sm"')
  expect(buttonClass).not.toContain('w-full')
})
```

- [ ] **Step 3: Run the focused tests and verify they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/contact24-render.int.spec.tsx \
  tests/int/contact24-data.int.spec.ts
```

Expected: FAIL because the block schema, presentation props, alignment data attribute, and compact
button do not exist.

- [ ] **Step 4: Add the Payload details alignment field**

In `src/blocks/Contact24/config.ts`, add:

```tsx
const detailsAlignmentField = {
  name: 'detailsAlignment',
  label: 'Details Alignment',
  type: 'select',
  defaultValue: 'left',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
  required: true,
} satisfies SelectField
```

Add `detailsAlignmentField` after `contentAlignmentField` in the Layout & Theme tab.

- [ ] **Step 5: Pass details alignment through the presentation adapter**

In `src/blocks/Contact24/Presentation.tsx`, import `Contact24DetailsAlignment`, add:

```tsx
detailsAlignment?: Contact24DetailsAlignment | null
```

to `Contact24BlockLike`, destructure `detailsAlignment = 'left'`, and pass:

```tsx
detailsAlignment={detailsAlignment ?? 'left'}
```

to `Contact24`.

- [ ] **Step 6: Implement details alignment classes**

In `src/components/contact24.tsx`, add:

```tsx
export type Contact24DetailsAlignment = 'center' | 'left' | 'right'
```

Add `detailsAlignment?: Contact24DetailsAlignment` to `Contact24Props`, default it to `left`, and
define:

```tsx
const detailsAlignmentClasses = {
  left: {
    content: 'items-start text-left',
    action: 'self-start',
  },
  center: {
    content: 'items-center text-center',
    action: 'self-center',
  },
  right: {
    content: 'items-end text-right',
    action: 'self-end',
  },
} as const
```

- [ ] **Step 7: Apply alignment and compact Button sizing**

Add `data-contact24-details-alignment={detailsAlignment}` to the details panel.

Apply `detailsAlignmentClasses[detailsAlignment].content` with `cn()` to the region/city wrapper
and the `address` element. Keep every address row content-width with `max-w-full`.

Replace the action wrapper and Button with:

```tsx
<div className={cn('mt-auto pt-6', detailsAlignmentClasses[detailsAlignment].action)}>
  <Button asChild size="sm" variant="outline">
    <a href={office.mapUrl} rel="noreferrer" target="_blank">
      View on Map
      <ExternalLink data-icon="inline-end" />
    </a>
  </Button>
</div>
```

- [ ] **Step 8: Generate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: `Contact24Block` and `Contact24BlockSelect` include `detailsAlignment`.

- [ ] **Step 9: Run focused verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/contact24-render.int.spec.tsx \
  tests/int/contact24-data.int.spec.ts \
  tests/int/site-offices.int.spec.ts
pnpm exec eslint \
  src/components/contact24.tsx \
  src/blocks/Contact24/config.ts \
  src/blocks/Contact24/Presentation.tsx \
  tests/int/contact24-render.int.spec.tsx \
  tests/int/contact24-data.int.spec.ts
```

Expected: all focused tests and lint PASS.

- [ ] **Step 10: Review live preview and commit**

Open:

```text
http://localhost:3000/block-thumbnail-previews/contact24
```

Expected: default left alignment remains backward compatible. A page block configured for Center
centers its office content while its header alignment remains independent. The small map action
uses content width.

Commit:

```bash
git add \
  src/blocks/Contact24/config.ts \
  src/blocks/Contact24/Presentation.tsx \
  src/components/contact24.tsx \
  src/payload-types.ts \
  tests/int/contact24-data.int.spec.ts \
  tests/int/contact24-render.int.spec.tsx
git commit -m "feat: align contact 24 office details"
```

### Task 3: Add location-details visibility control

**Files:**

- Modify: `tests/int/contact24-data.int.spec.ts`
- Modify: `tests/int/contact24-render.int.spec.tsx`
- Modify: `src/blocks/Contact24/config.ts`
- Modify: `src/blocks/Contact24/Presentation.tsx`
- Modify: `src/components/contact24.tsx`
- Modify: `src/payload-types.ts`

**Interfaces:**

- Preserves stored Payload key: `Contact24BlockLike.showAddressDetails?: boolean | null`.
- Produces presentation prop: `Contact24Props.showLocationDetails?: boolean`.
- Default: the full location-details panel remains visible when the field is absent or `null`.
- Hides: bordered details panel, corner brackets, region, city, address, telephone, email, and map
  action.
- Preserves: interactive map.

- [ ] **Step 1: Write the failing Payload schema test**

Extend the Layout & Theme assertions in `tests/int/contact24-data.int.spec.ts`:

```tsx
expect(byName(layout?.fields ?? [], 'showAddressDetails')).toMatchObject({
  defaultValue: true,
  label: 'Show Location Details',
  type: 'checkbox',
})
```

- [ ] **Step 2: Write the failing visibility test**

Add to `tests/int/contact24-render.int.spec.tsx`:

```tsx
it('can hide the entire location-details panel and retain the interactive map', () => {
  const office = offices[0]!
  const html = renderToStaticMarkup(
    <Contact24
      offices={[office]}
      showLocationDetails={false}
      title="Our offices"
    />,
  )

  expect(html).toContain('data-contact24-location-details="hidden"')
  expect(html).toContain(office.mapEmbedUrl)
  expect(html).not.toContain('data-contact24-details')
  expect(html).not.toContain('data-contact24-corner-accents')
  expect(html).not.toContain(office.region)
  expect(html).not.toContain(office.address)
  expect(html).not.toContain(`href="${office.phoneHref}"`)
  expect(html).not.toContain(`href="mailto:${office.email}"`)
  expect(html).not.toContain(`href="${office.mapUrl}"`)
  expect(html).not.toContain('View on Map')
})
```

- [ ] **Step 3: Run the focused tests and verify they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/contact24-render.int.spec.tsx \
  tests/int/contact24-data.int.spec.ts
```

Expected: FAIL because the Payload label still refers to address details and the component still
renders the panel when the location-details presentation prop is false.

- [ ] **Step 4: Add the Payload visibility field**

In `src/blocks/Contact24/config.ts`, add this field after `detailsAlignmentField`:

```tsx
const showAddressDetailsField = {
  name: 'showAddressDetails',
  label: 'Show Location Details',
  type: 'checkbox',
  defaultValue: true,
} satisfies CheckboxField
```

Import `CheckboxField` from `payload` and add `showAddressDetailsField` after
`detailsAlignmentField` in Layout & Theme.

- [ ] **Step 5: Pass visibility through the presentation adapter**

In `src/blocks/Contact24/Presentation.tsx`, add:

```tsx
showAddressDetails?: boolean | null
```

to `Contact24BlockLike`, destructure `showAddressDetails = true`, and map the stable stored field to
the clearer presentation prop:

```tsx
showLocationDetails={showAddressDetails ?? true}
```

to `Contact24`.

- [ ] **Step 6: Conditionally render the complete details panel**

In `src/components/contact24.tsx`, add `showLocationDetails?: boolean` to `Contact24Props` and
default it to `true`.

Add this data attribute to the office article:

```tsx
data-contact24-location-details={showLocationDetails ? 'visible' : 'hidden'}
```

Wrap the existing complete details panel:

```tsx
{showLocationDetails ? (
  <div
    className="relative flex flex-1 flex-col rounded-none border border-border p-6 sm:p-8"
    data-contact24-details
    data-contact24-details-alignment={detailsAlignment}
  >
    <CornerBorderAccents />

    <div
      className={cn(
        'flex flex-col gap-2',
        detailsAlignmentClasses[detailsAlignment].content,
      )}
    >
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {office.region}
      </p>
      <h3 className="text-2xl font-semibold tracking-tight">{office.city}</h3>
    </div>

    <address
      className={cn(
        'mt-6 flex w-full flex-col gap-3 not-italic',
        detailsAlignmentClasses[detailsAlignment].content,
      )}
    >
      <div className="flex max-w-full min-w-0 items-start gap-3">
        <MapPin
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        />
        <span>{office.address}</span>
      </div>
      <a
        className="flex max-w-full min-w-0 items-center gap-3 hover:underline"
        href={office.phoneHref}
      >
        <Phone
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
        {office.phone}
      </a>
      <a
        className="flex max-w-full min-w-0 items-center gap-3 break-all hover:underline"
        href={`mailto:${office.email}`}
      >
        <Mail
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
        {office.email}
      </a>
    </address>

    <div
      className={cn(
        'mt-auto pt-6',
        detailsAlignmentClasses[detailsAlignment].action,
      )}
    >
      <Button asChild size="sm" variant="outline">
        <a href={office.mapUrl} rel="noreferrer" target="_blank">
          View on Map
          <ExternalLink data-icon="inline-end" />
        </a>
      </Button>
    </div>
  </div>
) : null}
```

The office article retains `gap-4`; CSS gap does not add space when the map is its only child.

- [ ] **Step 7: Confirm the stored Payload type remains compatible**

Run:

```bash
pnpm generate:types
```

Expected: `Contact24Block` and `Contact24BlockSelect` continue to include the stored
`showAddressDetails` key. No content migration is required.

- [ ] **Step 8: Run focused verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/contact24-render.int.spec.tsx \
  tests/int/contact24-data.int.spec.ts \
  tests/int/site-offices.int.spec.ts
pnpm exec eslint \
  src/components/contact24.tsx \
  src/blocks/Contact24/config.ts \
  src/blocks/Contact24/Presentation.tsx \
  tests/int/contact24-render.int.spec.tsx \
  tests/int/contact24-data.int.spec.ts
```

Expected: all focused tests and lint PASS. The hidden state contains one iframe per office and no
details panel markup.

- [ ] **Step 9: Commit**

```bash
git add \
  src/blocks/Contact24/config.ts \
  src/blocks/Contact24/Presentation.tsx \
  src/components/contact24.tsx \
  src/payload-types.ts \
  tests/int/contact24-data.int.spec.ts \
  tests/int/contact24-render.int.spec.tsx
git commit -m "fix: hide contact 24 location details"
```
