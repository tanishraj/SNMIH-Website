# Live Preview Block Parity Design

## Context

Production Page rendering supports Hero Carousel, Gallery Coverflow, Testimonial Grid, Awards List,
and About Section, but the live-preview dispatcher has no cases for them. Those blocks fall through
to `null`, including when nested inside a Reusable Section.

## Goals

- Render all five missing block types in Page live preview.
- Match production content, layout, media, actions, appearance, variants, and interactivity.
- Honor configured Hero Carousel autoplay, arrows, dots, alignment, overlay, and height.
- Preserve the client/server import boundary.
- Prevent future drift between production and preview dispatcher coverage.

## Non-Goals

- Redesigning any block.
- Adding external preview snapshots or Payload queries.
- Changing production rendering.
- Changing carousel configuration defaults.
- Adding live-preview error boundaries beyond the existing dispatcher behavior.

## Architecture

The live-preview dispatcher will import and call the existing production components for all five
blocks. These components transform only the serialized block data they receive and do not import
`server-only`, Payload configuration, the Payload Local API, Node.js modules, or cached server
loaders.

Each new switch case will pass the block fields directly and use the existing block key. The
Reusable Section recursion already delegates nested blocks back through this dispatcher, so no
separate nesting implementation is required.

## Block Mapping

| Block type | Renderer |
| --- | --- |
| `heroCarousel` | `HeroCarouselBlockComponent` |
| `galleryCoverflow` | `GalleryCoverflowBlockComponent` |
| `testimonialGrid` | `TestimonialGridBlockComponent` |
| `awardsList` | `AwardsListBlockComponent` |
| `aboutSection` | `AboutSectionBlockComponent` |

The carousel will use its configured autoplay value in preview. Preview does not substitute static
slides or disable production controls.

## Failure Handling

- Existing block-level content validation remains inside each renderer; incomplete fixtures may
  still render `null` exactly as production does.
- An unknown block type continues to return `null`.
- Reusable Section recursion retains its depth limit and unresolved-relationship behavior.
- No fallback placeholder will claim that an omitted or invalid block rendered successfully.

## Testing

Focused tests will verify:

- production and live-preview switch cases cover the same Page block-type set;
- each of the five blocks emits its identifying content or data attribute in live preview;
- Hero Carousel passes configured autoplay behavior through its production client renderer;
- the five blocks also render when reached through Reusable Section recursion;
- the existing live-preview import-boundary test still passes.

## Documentation

The Pages and Page Blocks guides will state that every production Page block is supported in live
preview. The resolved live-preview limitation will be removed from the feature inventory.

## Acceptance Criteria

- All production Page block types have a live-preview dispatcher case.
- The five formerly missing blocks reuse their production renderer.
- Configured carousel behavior is preserved.
- No server-only module enters the live-preview client graph.
- Focused rendering, parity, import-boundary, lint, and TypeScript checks pass.
- All changes remain uncommitted.
