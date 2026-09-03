# Gallery Showcase Block Design

## Goal

Adapt `@shadcnblocks/gallery20` into a reusable Payload page block named **Gallery Showcase**. Preserve the source block's five-image overlapping, draggable, snap-back composition while aligning typography, actions, media, radius, spacing, appearance, responsiveness, accessibility, and thumbnail behavior with the existing site.

## Registry Source and Canonical Identity

Use the registry item installed with:

```bash
pnpm dlx shadcn@latest add @shadcnblocks/gallery20 -y
```

The registry file is a reference implementation, not the final runtime identity. Adapt it into the project's block architecture and remove the generated `gallery20` demo after the canonical implementation is complete.

Canonical Payload identity:

- slug: `galleryShowcase`;
- interface: `GalleryShowcaseBlock`;
- singular label: `Gallery Showcase`;
- plural label: `Gallery Showcases`.

No backward-compatibility alias for `gallery20` is required because this is a new block.

## Payload Configuration

Use the existing two-tab block pattern.

### Content

1. optional `eyebrow` text;
2. required `title` text;
3. optional `description` textarea;
4. zero or one shared action through `createContentActionsField({ label: 'Action', maxRows: 1 })`;
5. `images` array requiring exactly five rows.

Each image row contains:

- required upload relationship to `media` named `image`;
- required `imagePosition` select named **Background Position**, defaulting to Center, with Center, Top, Bottom, Left, and Right options in that order.

Media alternative text comes from the related Media record. Do not add duplicate title, description, rotation, offset, or link fields per image. The five-card composition is one controlled design rather than an editor-built freeform layout.

### Layout & Theme

1. standard Appearance group through `createBlockAppearanceFields({ includeTextOverride: false })`;
2. shared action mode, defaulting to Link;
3. Content Alignment with Left, Center, and Right options, defaulting to Center;
4. Size with Compact, Default, and Comfortable options, defaulting to Default.

Do not add autoplay, motion toggles, custom colors, custom radii, per-image actions, or transform controls.

## Rendering Architecture

Keep the Payload adapter and presentation wrapper server-rendered. The adapter trims content, resolves the five media relationships and their alt text, resolves the shared action, applies defaults, and omits malformed image rows. The block renders nothing unless all five images resolve successfully, preserving the balanced composition promised by the schema.

Only the image fan is a Client Component. It receives a serializable array containing each image's `src`, `alt`, optional intrinsic width and height, and background position. Framer Motion and reduced-motion logic remain inside this focused boundary; headings, description, action, appearance, and section layout do not enter the client bundle.

The generated registry demo is removed after adaptation. Reuse the existing shared Button, `ContentActions`, media resolver, appearance resolver, spacing utilities, and `cn` helper.

## Layout and Typography

Preserve Gallery 20's order:

1. five-image overlapping gallery;
2. optional eyebrow;
3. title;
4. optional description;
5. optional action.

The gallery remains horizontally centered regardless of content alignment so the fan does not collide with the container edge. Content Alignment applies to the eyebrow, title, description, and action group below it.

Use the regular block container `mx-auto w-full max-w-screen-2xl px-4`. Section spacing follows the shared all-viewport size scale: Compact `py-10`, Default `py-12`, and Comfortable `py-16`.

Use existing normalized content typography:

- eyebrow: `font-mono text-xs font-semibold uppercase tracking-[0.24em] text-current/70`;
- title: `text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl`;
- description: `text-base leading-7 text-balance text-current/70`.

The title is an `h2`. No image receives a heading element. The content stack uses a maximum readable width and the shared `ContentActions` component so link and button variants match the rest of the site.

## Image Fan Geometry

The five items always retain their source order. Use percentage-based transforms so geometry scales with card size rather than relying on Gallery 20's fixed pixel offsets:

| Index | Rotation | Horizontal offset | Vertical offset | Base layer |
| ----- | -------- | ----------------- | --------------- | ---------- |
| 1     | `-19deg` | `-120%`           | `0`             | automatic  |
| 2     | `-19deg` | `-62%`            | `2%`            | automatic  |
| 3     | `0deg`   | `0`               | `-19%`          | foreground |
| 4     | `12deg`  | `62%`             | `2%`            | automatic  |
| 5     | `12deg`  | `120%`            | `0`             | automatic  |

Card and fan heights follow block Size:

| Size        | Mobile card | `sm` card | `lg` card | Responsive fan height  |
| ----------- | ----------- | --------- | --------- | ---------------------- |
| Compact     | `size-16`   | `size-36` | `size-40` | `h-28 sm:h-48 lg:h-52` |
| Default     | `size-20`   | `size-40` | `size-44` | `h-32 sm:h-52 lg:h-60` |
| Comfortable | `size-24`   | `size-44` | `size-48` | `h-36 sm:h-60 lg:h-64` |

The reduced base sizes apply only below the `sm` breakpoint. They preserve distinct Compact, Default, and Comfortable choices while keeping all five transformed cards within narrow mobile viewports. Tablet and desktop card sizes, fan heights, percentage transforms, and motion behavior remain unchanged.

The outer container uses horizontal clipping so transformed cards never create page-level horizontal scrolling. Images fill their cards with `object-cover`, use the configured object-position mapping, disable native image dragging, and clip through the theme's standard `rounded-md` radius. Use semantic shadows without raw colors.

## Motion and Interaction

Retain the source interaction:

- the complete fan enters upward with a spring;
- cards animate outward from the center into their resting transforms;
- each card is draggable and uses `dragSnapToOrigin`;
- pointer hover straightens the card, lifts it, scales it modestly, and places it above siblings;
- cards use `cursor-grab active:cursor-grabbing`, and the underlying image element remains non-draggable.

Use stable module-level transform definitions rather than rebuilding configuration during render. Keys come from stable media identifiers or URLs, not array index alone.

Respect `prefers-reduced-motion` through Framer Motion's reduced-motion API. Under reduced motion, cards render directly at their final transforms without entrance, lift, rotation reset, or scale animation. Content remains complete and dragging must not block ordinary vertical page scrolling outside the card surface.

## Theme and Appearance

Resolve section background, foreground, and border through the existing block appearance utilities. Do not introduce raw light/dark colors or manual dark-mode overrides. The gallery cards use `rounded-md`; actions use the shared Button implementation and its existing variants, hover behavior, and radius.

The block supports every configured theme, system/light/dark color mode, and Appearance background without changing image treatment or motion geometry.

## Registration and Thumbnail

Register Gallery Showcase in:

- the Pages layout block list;
- the page-block renderer;
- generated Payload types;
- block-thumbnail definitions;
- the deterministic real-render thumbnail fixture.

The thumbnail uses five existing local assets, resolved through the production block, with the gallery positioned inside the 1600×900 stage. The thumbnail must not depend on registry-hosted images, network access, random transforms, or Payload database data.

## Testing and Verification

Focused coverage verifies:

- canonical slug, interface, labels, tab order, field defaults, exact five-row image requirement, and one-action limit;
- media resolution, malformed-row handling, alt text, intrinsic dimensions, and every background-position mapping;
- semantic appearance, normalized typography, content alignment, one shared action, and compact/default/comfortable sizing;
- exact five-card percentage transforms, stable keys, theme radius, object-cover behavior, and native image-drag prevention;
- the server wrapper does not import Framer Motion and only the image fan is client-side;
- reduced-motion output avoids entrance and hover transforms while retaining all five images;
- registration in Pages and the page-block renderer;
- deterministic thumbnail definition and fixture coverage;
- responsive rendering does not introduce horizontal page overflow.

Run Payload type generation, focused Vitest tests, Prettier, ESLint, the block-thumbnail generator, and `git diff --check`. Keep every file unstaged and uncommitted.

## Non-Goals

- Variable image counts.
- Editor-configurable rotations, offsets, or layers.
- Per-image captions, links, or actions.
- Lightbox or modal behavior.
- Autoplay or automatic reshuffling.
- Replacing shared Button, appearance, action, spacing, or media utilities.
