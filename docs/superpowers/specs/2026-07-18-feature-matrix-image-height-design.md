# Feature Matrix Responsive Image Height Design

## Objective

Make the existing Feature Matrix `size` setting produce a clearly visible, responsive change in all four panel image heights without changing the block schema, grid, content, or image cropping behavior.

## Responsive height scale

The component will retain the existing `compact`, `default`, and `comfortable` values and map them to:

| Size | Mobile | Medium | Large |
| --- | --- | --- | --- |
| Compact | `h-36` | `md:h-40` | `lg:h-44` |
| Default | `h-44` | `md:h-52` | `lg:h-60` |
| Comfortable | `h-52` | `md:h-64` | `lg:h-72` |

All four images within one Feature Matrix instance use the same height classes. Wide and narrow grid panels therefore retain consistent image heights.

## Behavior preserved

- The Payload `size` field, options, and default value remain unchanged.
- Existing section padding, panel padding, and introduction spacing continue to respond to size.
- Images remain full width with `object-cover`.
- Per-image background position remains unchanged.
- The asymmetric five-column desktop grid, borders, animation, text, and actions remain unchanged.
- No stored content or database update is needed.

## Implementation boundary

Only `imageHeightClasses` in `src/components/feature-matrix.tsx` changes. Tests in `tests/int/feature-matrix.int.spec.ts` will assert the exact responsive height class set for Compact, Default, and Comfortable modes and verify that each set is applied to all four images.

## Verification

- Feature Matrix integration tests pass.
- ESLint passes for the component and test.
- A mobile and desktop browser check confirms four equal image heights at each tested size.
- `git diff --check` passes.
- No files are staged.

## Out of scope

- New Payload fields or size options.
- Aspect-ratio or fluid `clamp()` sizing.
- Changes to panel padding, section spacing, typography, grid proportions, or image positioning.
