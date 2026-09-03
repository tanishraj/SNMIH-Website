# Department Profiles Density and Frames Design

**Date:** 2026-08-23

## Objective

Extend Department Profiles with denser two-to-eight-column Image Overlay directories and Boxed, Framed Grid, and Ruled Grid presentations. Image Overlay uses a compact portrait `4:5` ratio on mobile and the taller `3:4` width-to-height proportion from the small breakpoint upward, while the selected Overlay size controls the available column range and internal visual density. Inline retains its original two-to-four-column contract.

## Size and Column Model

For Image Overlay, Card Size exposes one size-specific **Profiles per Row** field:

- **Large:** two, three, or four columns; default four.
- **Medium:** three, four, five, or six columns; default six.
- **Small:** four, five, six, seven, or eight columns; default eight.

The existing `columns` field remains the Large Overlay value and the shared Inline value, so saved two-to-four-column content requires no migration. Add `mediumColumns` and `smallColumns` for the other Overlay sizes. Admin conditions show `columns` for Inline at every size, or the field matching the current Card Size for Image Overlay. Switching Overlay sizes preserves each size's previously selected value.

Runtime normalization resolves the active column count from Card Layout and Card Size:

- missing or invalid Card Size resolves to Large;
- Inline always reads `columns` and falls back to four;
- Image Overlay Large reads `columns` and falls back to four;
- Image Overlay Medium reads `mediumColumns` and falls back to six;
- Image Overlay Small reads `smallColumns` and falls back to eight.

Responsive rendering remains content-safe: phones use one column, small screens use at most two, standard desktop uses at most four, and sufficiently wide screens use the configured five-to-eight-column count. Search, filters, pagination, and document order are unchanged.

## Image Overlay Density

Every Image Overlay card uses `aspect-4/5 sm:aspect-3/4`, regardless of Card Size. On mobile, the single-column Overlay grid is centered and capped at 320px for Large, 288px for Medium, and 256px for Small; from `sm` upward it returns to full grid width. Size also changes the configured column range, content padding, typography, metadata spacing, and responsive image `sizes` hint. Large therefore produces the roomiest cards, Medium a denser directory, and Small the highest-density directory.

Image crop positions, shared overlay tone/strength/direction/coverage controls, optional images, and the `UserRound` fallback remain supported. Existing content keeps Dark tone, Dark strength, Bottom-to-Top direction, and Full coverage. Text must wrap without clipping at the eight-column wide-screen layout. Small metadata uses compact but readable text and spacing.

Inline cards retain their 96px, 80px, and 64px media scales for Large, Medium, and Small. Every Inline size retains the original two-to-four-column control so labels and metadata have sufficient measure.

## Card Frame

Add a required block-level **Card Frame** (`cardFrame`) select:

- **Boxed Cards** (`boxed`): independently rounded and bordered cards with gaps. This is the default and runtime fallback.
- **Framed Grid** (`framed`): one complete square outer border, no gaps, square internal cells, and shared vertical and horizontal dividers.
- **Ruled Grid** (`open`): no left or right outer border, with top and bottom rules, no gaps, square internal cells, and shared dividers.

The frame selection applies to both Image Overlay and Inline layouts.

For Boxed Cards, Inline keeps its semantic muted card surface. For Framed Grid and Ruled Grid, Inline cells inherit the section surface and use current-color dividers. Image Overlay cells remain image-led in every frame; Framed and Ruled remove individual rounding and borders so the grid reads as one composition. Placeholder cells retain a semantic muted media surface.

Framed and Ruled containers use the established Download List pattern: an outer frame plus a grid offset by one pixel at the right and bottom, while every item supplies a right and bottom divider. This closes partial final rows cleanly without count-specific `nth-child` rules.

## Compatibility

Existing records have no `cardFrame`, so runtime resolves them to Boxed Cards. Their existing `columns` value remains active because absent or invalid Card Size resolves to Large. No content migration is required.

The Image Overlay proportion intentionally changes from the previously shipped size-dependent mapping to a responsive portrait model: compact `4:5` on mobile and taller `3:4` from `sm` upward. This preserves the requested portrait presentation without creating oversized single-column cards on phones.

## Component Boundaries

- `config.ts` owns size-specific column fields, conditional Admin controls, defaults, and the Card Frame schema.
- `Component.tsx` normalizes legacy values and resolves one active column count.
- `DepartmentProfilesClient.tsx` owns responsive grid composition and frame-container geometry.
- `DepartmentProfileCard.tsx` owns layout-specific cell surfaces, borders, rounding, typography, and media presentation.
- `types.ts` owns the two-to-eight column and frame unions shared by server and client.

No new dependency or custom Admin component is required.

## Accessibility and UX

- Cards remain static and non-clickable.
- Search, tabs, live result announcements, keyboard behavior, Load More, and no-results messaging remain unchanged.
- Framed and Ruled layouts use structural borders only; they add no hover-only information or interaction.
- Profile headings retain their current semantic level.
- Missing-image icons remain decorative because the adjacent profile name provides identity.
- Text and placeholders must remain readable across Page, Subtle, Brand, and Gradient Brand sections.

## Testing and Generated Artifacts

Focused tests will cover:

- Large, Medium, and Small Overlay column options, defaults, and Admin conditions;
- unchanged two-to-four-column Inline rendering at every size;
- runtime fallbacks for invalid size-specific columns and Card Frame values;
- responsive class coverage for two through eight columns;
- responsive mobile `4:5` and `sm`-up `3:4` Image Overlay proportions at every size;
- centered 320px, 288px, and 256px mobile width caps for Large, Medium, and Small;
- size-specific image hints, typography, and padding;
- Boxed, Framed Grid, and Ruled Grid geometry for Overlay and Inline;
- inherited Inline surfaces in Framed/Ruled and muted surfaces in Boxed;
- optional-image placeholders in every frame family;
- unchanged search, tabs, pagination, and compatibility behavior.

After implementation, regenerate Payload types and the Department Profiles thumbnail, update current block documentation and project context, and run focused tests, TypeScript, lint, theme/contrast contracts, the design detector, and diff hygiene checks.

No commit will be created.
