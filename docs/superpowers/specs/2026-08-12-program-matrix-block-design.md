# Program Matrix Block Design

## Goal

Add an independent Program Matrix page block that presents academic programmes in a seamless,
theme-aware matrix matching the supplied reference while supporting optional per-item Button or
Link Text actions.

Program Grid remains unchanged.

## Block Identity and Availability

- Admin label: **Program Matrix**
- Payload slug: `programMatrix`
- Generated interface: `ProgramMatrixBlock`
- Available in normal Pages and Reusable Sections
- Supported by production rendering and page live preview
- Included in the block-thumbnail definition and fixture catalogs
- Documented in the feature inventory

This is an additive schema change and requires no content migration.

## CMS Schema

The block uses the standard **Content** and **Layout** tabs, matching Program Grid, Icon Grid,
Bento Grid, and the majority of content blocks.

### Content

Section fields:

- `eyebrow`: optional short text
- `title`: required text
- `description`: optional textarea
- `actions`: up to two optional section actions using the shared action field

`items` is a required array with one to twenty-four rows. Each row contains:

- `icon`: optional Lucide icon name
- `title`: required text
- `metadata`: optional short text such as “4.5 Years + 1 Year Internship”
- `description`: optional textarea
- `cardBackground`: Default Card, Primary, Secondary, Muted, or Accent; defaults to Default Card
- `linkType`: None, Page, or Custom URL
- `page`: conditionally shown Page relationship
- `url`: conditionally shown custom URL
- `openInNewTab`: conditionally shown checkbox

Rows without a non-empty title are omitted defensively at render time. A valid title is sufficient
to render a row; icon, metadata, description, and action are optional.

### Layout

- Shared block appearance controls
- `actionMode`: Button or Link Text, using the shared action-mode field and applying to section
  and programme actions
- `actionVariant`: Primary, Secondary, or Outline for programme buttons; shown for Button mode
- `itemActionLabel`: shared visible label for linked programme items, defaulting to “Learn More”
- `contentAlignment`: Left or Center, defaulting to Left; applies only to the section introduction
  and section actions
- `size`: None, Compact, Default, or Comfortable using the shared regular-block spacing scale

Programme cell copy remains left-aligned for scanability regardless of section alignment.

Card backgrounds are configured independently inside each programme row because they describe an
individual cell rather than the whole matrix. Free-form color values are not accepted. The five
semantic choices keep authoring predictable and allow every installed theme and dark mode to own
the final palette.

## Action Behavior

Each programme row owns only its destination. Presentation is configured once at block level:

- **Button** renders the shared Button component with the selected variant. When a button variant
  matches its card surface (Primary on Primary or Secondary on Secondary), it receives the
  semantic inverse treatment needed to remain distinguishable.
- **Link Text** renders a text link with an Arrow Right icon. Its color follows the card surface:
  semantic primary on Default, Muted, and Accent cards, and the appropriate surface foreground on
  Primary and Secondary cards.
- Rows with Link set to None render no item action.
- Section actions remain independent of item actions.
- Page and custom links use the existing CMS link resolution rules.
- External links receive `target="_blank"` only when configured and include safe `rel` values.

Actions are visible controls inside the cell. The complete cell is not made clickable, avoiding
nested-link conflicts and preserving an explicit action affordance.

## Icon Resolution

Program Matrix accepts Lucide names in common authoring formats:

- `hospital`
- `Hospital`
- `graduation-cap`
- `GraduationCap`
- names containing spaces or underscores after trimming

A server-side resolver normalizes case and separators, then returns the Lucide component object
before rendering. This preserves the component-object rendering contract and does not send an
all-icons lookup to the browser.

Missing or invalid icon names render no icon container. They never silently substitute Star or
another misleading symbol. Icons are decorative and use `aria-hidden="true"`.

The resolver is implemented as a focused shared utility so other CMS icon consumers can adopt it
later, but updating existing Icon Grid, Bento Grid, Media Carousel, and About Section behavior is
outside this block implementation.

## Visual Design

The section uses the standard regular block container and selected block spacing.

The introduction is a restrained editorial stack:

- optional mono uppercase eyebrow using the shared `text-xs`, semibold,
  `tracking-[0.24em]` treatment
- section title inheriting the active theme's `--font-display`, using the shared
  `text-3xl sm:text-4xl`, semibold block-heading scale
- readable `text-base leading-7` supporting description in semantic secondary foreground
- optional section actions below the description

The introduction uses the same `gap-4` internal rhythm as Program Grid, Icon Grid, Bento Grid, and
Feature Matrix. The matrix begins after `gap-10 md:gap-12`, preserving clear section hierarchy
without introducing a one-off spacing scale.

The programme matrix uses:

- one semantic outer border
- the active theme radius on the outer clipping frame
- no gaps between cells
- one column below the tablet breakpoint
- two equal columns from the tablet breakpoint upward
- semantic internal dividers without doubled borders
- equal-height cells within each desktop row
- shared `p-6 md:p-8` responsive cell padding
- optional `size-5` Lucide icon whose color adapts to the selected card surface
- explicit theme-aware `font-sans`, `text-lg`, semibold programme title
- mono uppercase `text-xs`, semibold metadata using `tracking-[0.24em]`
- readable `text-sm leading-6` supporting description
- action anchored after the content without forcing empty space when absent

The icon-to-title and title-group spacing use the existing spacing scale rather than bespoke
values. The matrix layout—not oversized or alternate typography—remains the block's distinctive
visual signature.

Each programme cell independently resolves one of five semantic surfaces:

- **Default Card:** `card` and `card-foreground`
- **Primary:** `primary` and `primary-foreground`
- **Secondary:** `secondary` and `secondary-foreground`
- **Muted:** `muted` and `foreground`
- **Accent:** `accent` and `accent-foreground`

The surface resolver also supplies appropriate secondary-copy, icon, divider, Link Text, and
matching-button contrast classes. Section actions receive the same automatic contrast treatment
when the block-level appearance uses a matching colored surface. Internal dividers use
low-emphasis current-color treatment so a line remains visible without introducing a hard-coded
color when adjacent cells use different surfaces. The outer clipping frame continues to use the
shared theme radius and border token, so background variation does not turn the matrix into
detached cards.

The matrix supports any valid item count. Odd final items preserve the outer frame and correct
divider treatment without spanning two columns.

All colors use `background`, `card`, `foreground`, `muted`, `accent`, `secondary`, their semantic
foreground counterparts, `primary`, `primary-foreground`, and `border` tokens. No raw light/dark
colors, free-form CMS colors, or manual dark-mode exceptions are added.

## Responsive Behavior

- Mobile: one column with horizontal dividers and reduced cell padding
- Tablet and desktop: two columns with vertical and horizontal internal dividers
- Section heading alignment follows the configured Left or Center value at every breakpoint
- Programme content remains left-aligned
- Programme Button and Link Text actions remain intrinsic-width, align to the start of the cell,
  and wrap only when the available cell width requires it
- Long titles, metadata, and descriptions wrap naturally without fixed heights or truncation

## Rendering and Data Flow

`ProgramMatrixBlockComponent` is a server component.

It:

1. trims and validates section and item content;
2. resolves page/custom destinations through existing link helpers;
3. resolves optional icons into Lucide component objects;
4. resolves shared block appearance and spacing classes;
5. renders the editorial introduction and matrix directly.

No client state, filtering, animation, or browser APIs are required.

## Registration and Preview

Implementation registers Program Matrix in:

- `src/collections/Pages.ts`
- `src/collections/ReusableSections.ts`
- `src/blocks/renderPageBlocks.tsx`
- `src/blocks/renderLivePreviewPageBlocks.tsx`
- `src/block-thumbnails/definitions.ts`
- `src/block-thumbnails/fixtures.tsx`

The thumbnail fixture uses four medically relevant programme examples and produces a dedicated
Program Matrix preview asset through the existing thumbnail workflow.

Generated Payload types are refreshed after schema registration.

## Accessibility

- The section uses a heading hierarchy with one section `h2` and item `h3` headings.
- Decorative icons are hidden from assistive technology.
- Buttons and links retain visible focus styles from shared components and link conventions.
- Action text is descriptive and supplied by the editor.
- No interaction depends on hover.
- Matrix reading order follows DOM order from top-left to bottom-right.

## Testing

Integration coverage verifies:

- Payload slug, labels, tabs, defaults, field conditions, row limits, and required fields
- registration in Pages and Reusable Sections
- production and live-preview renderer parity
- block-thumbnail definition and fixture parity
- valid-item filtering and empty-block behavior
- flexible Lucide name normalization and invalid-icon omission
- section introduction and content alignment
- one-column mobile and two-column tablet/desktop matrix classes
- internal divider behavior for even and odd item counts
- Button, Link Text, no-link, internal-link, and external-link behavior
- semantic appearance, radius, spacing, typography, and color classes
- parity with shared section-heading, card-title, label, icon, description, and padding conventions
- every per-card semantic background and its automatic foreground, icon, divider, link, and button
  contrast treatment
- generated Payload type presence

Run focused tests, targeted ESLint, TypeScript checking, type generation, and the production build
in proportion to the schema and registration changes.

## Documentation

Update the feature inventory to include Program Matrix in the normal Page and Reusable Section
block catalogs and describe its matrix layout, icon input, and optional action modes.

## Out of Scope

- Changing or migrating Program Grid
- Filtering, search, pagination, or carousel behavior
- Programme images, badges, intake filtering, or database-backed programme collections
- Updating icon resolution in existing Icon Grid, Bento Grid, Media Carousel, or About Section
- Data migrations for existing pages
