# Leadership Profiles Block Design

## Goal

Create a reusable, fully configurable Leadership Profiles Page block for academic, clinical, and administrative leadership. The presentation follows the supplied Academic Leadership reference while preserving this repository's section, typography, spacing, theming, thumbnail, and registration contracts.

## Block Identity

- Payload slug: `leadershipProfiles`
- Interface name: `LeadershipProfilesBlock`
- Admin label: `Leadership Profiles`
- Frontend ownership: `src/blocks/LeadershipProfiles`
- Rendering model: server-rendered React with no client state or client-only dependency

This remains separate from Team Showcase and Profile Carousel. Team Showcase owns the animated shadcnblocks Team 11 interaction, while Profile Carousel owns carousel and image-overlay presentations. Leadership Profiles is a static, information-dense directory grid.

## Payload Schema

The block uses the established Content and Theme Settings tabs.

### Content

- `eyebrow`: optional text
- `title`: required text
- `accentTitle`: optional text displayed as the heading's italic second line
- `description`: optional textarea
- `actions`: zero to two shared section actions
- `profiles`: required array with one to twenty-four rows
- `footerActions`: zero to two shared footer actions

Each profile row uses the shared Content and Theme Settings card tabs.

Profile Content fields:

- `image`: required Media upload
- `leadershipLabel`: optional short text, such as `Principal`
- `name`: required text
- `designation`: optional text
- `qualification`: optional text
- `expertise`: optional array with zero to three rows; each row contains one required `item` text field

Profile Theme Settings fields:

- `imagePosition`: required select with Center, Top, Bottom, Left, and Right; default Center
- `cardBackground`: shared Default, Primary, Secondary, Muted, and Accent semantic card surface; default Default

There are no profile links, buttons, hover navigation, action labels, destinations, or open-in-new-tab fields.

### Theme Settings

- Shared block appearance
- `contentAlignment`: Left, Center, or Right; default Left
- `headerLayout`: Split or Stacked; default Split
- `descriptionPosition`: Right Column or Under Title; default Right Column and visible only for Split
- `sideContentAlignment`: Top or Bottom; default Bottom and visible only for Split
- `columns`: 2, 3, or 4; default 3
- `size`: None, Compact, Default, or Comfortable; default Default

## Normalization and Data Flow

The server component accepts a defensive block-like type instead of trusting generated values at runtime.

For each profile:

1. Trim the required name.
2. Resolve the Media image with `getMediaImageProps`, using the name as fallback alt text and the existing generic media preset.
3. Omit the profile when either the name or resolved image is missing.
4. Trim the leadership label, designation, and qualification.
5. Trim expertise rows, omit blank items, preserve authored order, and cap the rendered list at three.
6. Normalize the image position to the five supported values and fall back to Center.
7. Pass the authored card background through `resolveCardSurface`; invalid values fall back to Default.

Return `null` when the title is empty or no valid profiles remain. Resolve section actions with the existing shared action helpers. No derived claims, credentials, expertise, or fallback leaders are invented.

## Section Header

Reuse the Academic Programmes header composition and the shared content typography classes.

Stacked layout:

- Uses the full container width with a `max-w-3xl` content measure.
- Positions the measured header left, center, or right according to `contentAlignment`.
- Keeps eyebrow, heading, description, and section actions together.

Split layout:

- Uses the existing large-screen 3:2 title-to-side-content proportion.
- Keeps the title column first in document order.
- Places the description under the title or in the side column according to `descriptionPosition`.
- Aligns the side description/actions to the top or bottom according to `sideContentAlignment`.
- Uses the selected content alignment without visually reordering the DOM.

## Profile Card Presentation

Cards are static and non-interactive. They do not use hover elevation, pointer cursors, focus rings, nested anchors, or action affordances.

Each card:

- Uses an equal-height flex column with the shared project radius and a semantic divider-colored border.
- Uses `bg-card text-card-foreground` for Default so the supplied white-card composition remains visible on every section surface.
- Uses the existing opaque semantic classes for Primary, Secondary, Muted, and Accent.
- Places a responsive `4:3` image at the top with Next.js Image and the configured object position.
- Places the optional leadership label over the image at the top-left using the existing shadcn Badge primitive and theme-safe colors.
- Renders the name in the project display typeface at the standard card-title scale.
- Renders the designation below the name using the surface link/accent color without turning it into a link.
- Renders qualification followed by zero to three expertise items as a semantic inline list with middle-dot separators. Separators appear only between present items.
- Uses compact metadata typography and natural wrapping; it does not clamp factual text.

Missing optional fields close the vertical flow naturally without empty wrappers or reserved gaps.

## Responsive Grid

- Mobile: one column for every setting.
- Tablet: at most two columns.
- Desktop: the selected two, three, or four columns.
- Card gaps follow the existing six-unit grid rhythm.
- Images retain `4:3` geometry at every breakpoint.
- Long names, designations, qualifications, and expertise items wrap within the card without overflow.

## Registration and Generated Artifacts

Register the new block explicitly in:

- Pages
- Reusable Sections
- News & Events Detail Template
- Production Page renderer
- Client-safe live-preview Page renderer

Add:

- Thumbnail definition
- Production-component thumbnail fixture using truthful illustrative labels
- Generated 1600×900 JPEG
- Generated Payload types
- Block operator guide entry
- Feature inventory update from fifty-one to fifty-two normal Page block choices
- Project-context block-system and generated inventory updates

The block must not be placed in a shared cross-environment registry that combines server-only and client-capable imports.

## Testing and Verification

Focused tests must cover:

- Slug, interface name, Content/Theme Settings tabs, required fields, array limits, image-position values, columns, and conditional header fields
- Absence of all profile link/action destination fields
- Defensive omission of profiles without a name or image
- Expertise trimming, blank-row omission, order preservation, and three-item cap
- Default and explicit semantic card backgrounds
- Non-interactive markup with no card anchor or button
- Optional-field omission without empty badge/designation/metadata containers
- Two-, three-, and four-column responsive contracts
- Split and stacked header alignment behavior
- Page/Reusable/News-detail registrations
- Production/live-preview renderer parity
- Thumbnail definition, fixture, and JPEG
- Generated Payload type coverage
- Existing card-renderer, card-theme, surface, section-eyebrow, and block-layout contracts

Run Payload type generation, focused Vitest suites, TypeScript, lint, design detection, thumbnail generation and visual inspection, project-context update/check, and final diff checks. Preserve all unrelated user changes and do not stage or commit.
