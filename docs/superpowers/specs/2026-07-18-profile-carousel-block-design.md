# Profile Carousel Block Design

## Goal

Add `@shadcnblocks/gallery27` as a reusable Payload page block named **Profile Carousel**. Preserve the source block's profile-card carousel behavior while aligning its content model, typography, actions, appearance, spacing, responsiveness, media handling, and thumbnail with the existing website blocks.

## Source and Integration Strategy

The implementation starts from the registry block installed with `pnpm dlx shadcn@latest add @shadcnblocks/gallery27`. The generated source is treated as a layout reference and adapted into the project's canonical block structure rather than exposed as a hardcoded `Gallery27` demo.

The registry item also requests the shadcn Carousel primitive and attempts to replace the existing Button component with a differently rounded version. The implementation must preserve the project's current themed `src/components/ui/button.tsx`, add only the missing Carousel primitive and dependency, and use the existing button variants and radius behavior for navigation and content actions.

The finished implementation uses only the canonical `ProfileCarousel` and `profileCarousel` names. It does not retain a runtime `Gallery27` component, hardcoded team members, remote demonstration images, or source-specific typography such as `font-calSans`.

## Payload Schema

Create a page block with slug `profileCarousel`, interface name `ProfileCarouselBlock`, singular label `Profile Carousel`, and plural label `Profile Carousels`. Its fields use the standard Content and Layout & Theme tabs.

### Content

- `eyebrow`: optional text.
- `title`: required text.
- `description`: optional textarea.
- `actions`: the shared content-actions field limited to a maximum of one optional action.
- `profiles`: an array with `minRows: 1` and `maxRows: 12`. Each row contains:
  - `image`: required upload related to `media`;
  - `name`: required text;
  - `role`: optional text;
  - `imagePosition`: required Background Position select with Center, Top, Bottom, Left, and Right options, defaulting to Center.

The shared content-actions field helper should accept an optional maximum-row setting while preserving its current maximum of two for every existing caller. Profile Carousel passes a maximum of one.

The media document supplies image alternative text through the existing media helper. The profile name is the fallback alternative text when the media record does not provide one.

### Layout & Theme

- standard block appearance fields for semantic background, text, and border behavior;
- `actionMode`: the shared Link or Button selector, defaulting to Link;
- `contentAlignment`: Left, Center, or Right, defaulting to Left;
- `size`: Compact, Default, or Comfortable, defaulting to Default.
- `cardVariant`: Text Below Image or Image Overlay, defaulting to Text Below Image.
- `overlayAlignment`: Left, Center, or Right, defaulting to Left and shown only for Image Overlay.

Button actions retain the shared Primary, Secondary, and Outline variants. Link actions use the website's existing content-link treatment. The block does not introduce raw color, radius, font, or hover controls.

## Rendering and Styling

The section uses the existing block appearance resolver, regular block mobile padding classes, `ContentActions`, CMS link resolver, media resolver, and `cn`. Its outer content is constrained with `mx-auto w-full max-w-screen-2xl px-4`, matching the other regular page blocks.

The introductory content appears once above the profiles in this order: optional eyebrow, title, description, and optional action. Alignment applies to the complete introductory stack and its action. The eyebrow uses the shared mono uppercase regular-block treatment. The title uses the normalized regular-block heading scale rather than Gallery 27's oversized display typography. The description uses the shared regular content size and line height.

The exact regular-block typography contract is `text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl` for the title and `text-base leading-7 text-balance text-current/70` for the description. These inherited semantic colors keep both elements aligned with the selected block appearance in light and dark themes.

Profile cards use one shared renderer in both static-grid and carousel modes:

- images use `object-cover`, the configured background position, and the theme's standard `rounded-md` radius;
- names render as bold supporting text rather than heading elements;
- roles render as smaller muted text;
- profile names and roles use a tight 2px vertical gap while the image-to-text spacing remains unchanged;
- the source block's subtle image lift on hover is retained for pointer-capable devices and does not change document layout;
- all images have the same size-aware height so card rows remain visually consistent.

Text Below Image preserves the existing card structure. Image Overlay places the name and role along the bottom of the image inside its rounded clipping frame. A theme-aware gradient rises from `background` to transparent, and semantic `foreground` text remains readable in light and dark themes. Overlay Alignment controls the horizontal alignment of the complete text group at the block level so every profile uses Left, Center, or Right consistently.

Both variants use the same responsive media-frame height scale. The fixed, clipped wrapper owns the height while the image uses `block h-full w-full object-cover`; this avoids relying on replaced-element intrinsic sizing in iOS Safari. Phone heights are intentionally shorter, then increase at `sm` and retain the approved tablet/desktop heights at `md`:

| Size        | Media-frame height          |
| ----------- | --------------------------- |
| Compact     | `h-64 sm:h-72 md:h-80`      |
| Default     | `h-72 sm:h-80 md:h-96`      |
| Comfortable | `h-80 sm:h-96 md:h-[28rem]` |

Background-position mappings match Feature Spotlight and Feature Matrix: Center is `object-[center_center]`, Top is `object-[center_top]`, Bottom is `object-[center_bottom]`, Left is `object-[left_center]`, and Right is `object-[right_center]`. Missing values resolve to Center.

## Static Grid and Carousel Behavior

The profile count determines the interaction mode:

- one through four profiles render as a static responsive grid with no carousel initialization, dragging, looping, or navigation controls;
- five through twelve profiles render as the shadcn Carousel with Embla `align: start` and `loop: true`;
- both modes show one card per row on mobile, two columns or slides on medium screens, and four columns or slides on large screens;
- static and carousel tracks use a balanced 20px gutter (`gap-5` / matching carousel padding), separating profiles clearly while keeping images wider than the original 24px layout and retaining four desktop cards;
- a partial static set retains the four-column desktop track, so one to three profiles do not stretch into oversized cards;
- carousel navigation follows Gallery 27's top-right placement but uses the project's existing icon-button appearance and accessible labels;
- the carousel track declares `touch-action: pan-y pinch-zoom`, and profile images disable native browser dragging, so horizontal Embla gestures remain reliable in mobile Safari without preventing normal vertical page scrolling or pinch zooming;
- autoplay is not added.

The Payload adapter remains a server component. It trims content, resolves media and actions, and passes only serializable presentation data into a focused client-side carousel component. The static-grid branch must not initialize Embla. This keeps the client boundary and shipped interaction code limited to the behavior that requires it.

If a malformed profile reaches rendering despite Payload validation, a missing name or unresolved image omits that profile safely. The block renders nothing when no valid profiles remain.

## Registration and Thumbnail

Register Profile Carousel in:

- the Pages layout block list;
- the page-block renderer;
- generated Payload types;
- block-thumbnail definitions and fixtures.

The thumbnail fixture renders the production block with local deterministic profile images and at least five profiles so the carousel presentation is represented without a Payload database or remote assets. Regenerating thumbnails adds `public/block-thumbnails/profile-carousel.jpg` through the existing real-render thumbnail command.

## Testing and Verification

Add focused tests that verify:

- the block is registered as a page block and rendered under `profileCarousel`;
- Content and Layout & Theme tabs expose the agreed fields, defaults, and option order;
- profiles enforce a minimum of one and maximum of twelve;
- actions enforce a maximum of one without changing existing blocks' maximum of two;
- one through four valid profiles use the static grid and render no carousel controls;
- five or more valid profiles use the carousel with one/two/four responsive bases and accessible navigation;
- partial static sets retain the four-column desktop grid;
- names are not heading elements and roles use supporting muted text;
- size changes all image heights consistently;
- both card variants use the same size-aware image heights;
- Image Overlay renders a clipped theme-aware gradient and applies one Left, Center, or Right alignment to every profile;
- every image receives its configured background-position class, with Center as the fallback;
- semantic appearance, alignment, shared action mode, theme radius, and standard section spacing are retained;
- block-thumbnail metadata and fixture coverage include Profile Carousel and use local media;
- the existing Button component is not replaced by the registry version.

Run Payload type generation, focused Vitest tests, ESLint, Prettier, the thumbnail generator, and `git diff --check`. Do not stage any files.

## Non-Goals

- Per-profile biographies, actions, links, social accounts, or appearance controls.
- Autoplay or editor-configurable carousel mechanics.
- Editor-configurable cards-per-breakpoint values.
- Per-profile card variants, overlay alignment, or image aspect-ratio controls.
- Raw colors, fonts, radii, shadows, or hover settings.
- Backward compatibility with `gallery27`, because this is a new block.
