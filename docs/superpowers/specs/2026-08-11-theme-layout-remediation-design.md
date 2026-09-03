# Theme and Block Layout Remediation Design

## Objective

Make every production block respond consistently to the selected website theme in light and dark modes, correct known responsive layout defects, and establish automated coverage that prevents new theme leaks or block-inventory drift.

The work preserves each block's existing design language. It does not redesign the website, add a new theme, or turn intentional media-overlay and rating colors into brand colors.

## Scope

This remediation covers:

- Theme selector isolation and semantic-token contrast.
- Primary button, primary link, active-tab, hover, and focus states.
- Shared block background, foreground, border, card, and rich-text behavior.
- Theme-driven radius behavior, including the zero-radius SNMIH preset.
- Known block-specific responsive and composition defects.
- Reusable-section block parity and block-thumbnail metadata.
- Integration, accessibility-contract, and visual-preview coverage.
- The Timeline horizontal-step label defect, using generated ordinal labels.

It does not cover unrelated application features, new Payload collections, content migrations, admin redesigns, or changes to intentional black/white image overlays.

## Chosen Approach

Use a contract-first remediation. Shared theme and appearance behavior is fixed before individual blocks are adjusted. Blocks consume semantic inherited colors instead of duplicating theme decisions.

This is preferred over:

1. Block-by-block theme patches, which would duplicate foreground and contrast logic.
2. Global selector overrides, which would hide local mistakes and create specificity conflicts.

## Theme Architecture

### Theme isolation

Every named theme is scoped to the root `data-theme-color` attribute. SNMIH uses:

```css
:root[data-theme-color='snmih'] { /* light tokens */ }
:root[data-theme-color='snmih'].dark { /* dark tokens */ }
```

No named theme file may declare an unscoped `:root` or `.dark` token block.

### Contrast contract

The following combinations must meet WCAG AA for normal text with a minimum contrast ratio of 4.5:1:

- `primary` with `primary-foreground`.
- `secondary` with `secondary-foreground`.
- `accent` with `accent-foreground`.
- `background` with `foreground`.
- `card` with `card-foreground`.
- `primary` used as text against `background`.

Each theme uses one primary token for filled actions, links, and active navigation text. Primary light-mode values are dark enough against the page background; dark-mode values are light enough against the dark background. The paired primary foreground uses the opposite surface color so the same token remains readable in both roles.

Primary-button hover mixes the primary color toward the foreground color by a small amount so the result becomes perceptibly darker in light mode and appropriately stronger in dark mode. Alpha blending toward the page background is not used.

### Radius contract

All derived radii remain valid non-negative CSS values. A base radius of zero produces square `xs` through `4xl` radii. `rounded-full` remains explicitly circular for avatars, status dots, radio controls, and intentional pills.

Fixed component radii such as the checkbox's five-pixel radius are replaced with semantic radius utilities.

## Block Appearance Architecture

The shared block appearance wrapper owns the outer surface and foreground color. Direct children use inherited color:

- Primary text: `text-current` or no explicit text class.
- Secondary text: `text-current/70`.
- Subtle structural lines: `border-current/15` when they live directly on the block surface.

Nested surfaces establish their own foreground pair:

- `bg-card text-card-foreground`.
- `bg-background text-foreground`.
- `bg-muted text-foreground`.
- `bg-primary text-primary-foreground`.

Text inside a nested card may use `text-card-foreground/70`; it must not assume the page-level foreground.

The dormant `textColor` API is resolved deliberately. Because no editor currently exposes the field, the implementation removes the unused override type and field factory rather than maintaining an unreachable `inverse` option. Appearance remains automatic and predictable.

### Rich text

Payload rich text uses typography variables mapped to the active semantic surface instead of `prose-neutral`. Headings, body copy, bullets, quotes, and rules inherit theme-safe values. Links use the accessible primary color and retain visible underlines or equivalent focus affordances.

### Intentional exceptions

The following remain independent of the selected brand theme:

- Black/white overlays over photography and video.
- Rating colors that communicate poor through excellent scores.
- Destructive and validation states.
- The fixed dark admin-session toolbar, which is admin chrome rather than website content.

### Global search typography and density

The global Search Dialog remains a focused command palette rather than expanding into a full search page. Its width is capped at `max-w-2xl`, while typography and control sizing gain a clearer hierarchy:

- Search input: `text-base` on mobile and `text-lg` from the small breakpoint.
- Result titles: `text-base`; supporting excerpts and empty/loading messages: `text-sm`.
- Keyboard instructions and footer actions: `text-sm`, with group labels remaining compact utility text.
- Keyboard instructions use an 8-pixel icon-to-label gap and a 16-pixel gap between command groups.
- Search and close icons: 20 pixels, with the close action receiving a minimum 36-pixel target.
- Input row and result spacing increase modestly without materially increasing the panel footprint.

All search surfaces continue using semantic background, foreground, border, muted, accent, ring, and radius tokens so the dialog follows every selected theme.

## Component Remediation

### Cross-block foreground fixes

Update the affected outer-surface content in Feature Spotlight, QA Accordion, Review Submission, Page Header, Timeline, Quote Block, About Section, Numbered Steps, Icon Grid, Logo Strip, Video Embed, Footer, Contact 24, Services 21, Team Showcase, Awards List, Testimonial Grid, and News & Events Highlights.

Nested cards retain independent semantic surfaces and receive the appropriate paired foreground class.

### Raw color removal

- Services 21 service identifiers use the semantic primary color instead of red.
- Team Showcase's blue/green/yellow hover rule becomes a restrained semantic primary gradient or solid rule.
- Rating stars keep their rating-specific color.

### Layout corrections

- Gallery Showcase reserves sufficient fan height and separation so transformed cards and shadows never intersect the heading at supported breakpoints.
- Team Showcase uses a defined mobile aspect ratio for `next/image` fill containers and derives its desktop column count from the available member count.
- Numbered Steps derives its desktop grid columns from the step count, avoiding a single orphan card where practical.
- Page block stacking does not add an unexplained mobile-only inter-block gap on top of each block's own spacing contract.
- Fixed-height media presentations retain intentional aspect ratios but do not create horizontal overflow.

### Timeline horizontal steps

The horizontal Timeline variant generates ordinal labels from array order:

```text
Step 01, Step 02, Step 03, Step 04, ...
```

The label updates automatically when an editor adds, removes, or reorders milestones. Custom CMS badge values remain available to variants where dates or editorial labels carry meaning, but they do not override the horizontal-step sequence.

## Payload Configuration

Reusable Sections support every page-content block except `ReusableSection` itself, which remains excluded to prevent recursive nesting. The missing Hero Carousel, Gallery Coverflow, Testimonial Grid, Awards List, and About Section blocks are added to the reusable-section registry.

The Reusable Section wrapper receives block-picker metadata and a thumbnail representation describing its wrapper purpose. Every registered Payload block therefore has exactly one manifest entry and one generated preview.

Generated Payload types are refreshed only after schema changes are complete.

## QA and Validation

### Contract tests

Automated tests verify:

- Every named theme is selector-scoped.
- Required semantic token pairs exist in light and dark modes.
- Contrast ratios meet the 4.5:1 contract.
- A zero base radius yields zero derived radii.
- Appearance-enabled blocks use the shared contract.
- Every registered block has renderer, live-preview, reusable-section eligibility, and thumbnail metadata as appropriate.
- Timeline horizontal labels follow their generated order.

### Visual previews

The thumbnail system retains the canonical 1600 by 900 output and adds representative QA routes or snapshots for:

- Default light desktop.
- Default dark desktop.
- SNMIH light desktop.
- SNMIH dark desktop.
- A mobile viewport for responsive layout checks.

Tall content is not silently scaled in the mobile layout check. The canonical CMS thumbnail may continue scaling for its fixed output, but it is not treated as the only layout test.

### Completion checks

The change is complete when:

- TypeScript passes.
- ESLint passes without errors.
- Relevant integration tests pass with updated full-inventory expectations.
- Block thumbnail fixtures render without missing image dimensions.
- Generated thumbnails have the expected dimensions and unique paths.
- No production block uses accidental raw brand colors.
- Theme contrast checks pass in every supported light/dark pair.

## Change Discipline

- Preserve current uncommitted work.
- Do not commit or force-push.
- Avoid dependency additions unless an existing test utility cannot perform deterministic OKLCH contrast conversion.
- Make shared-contract changes before block-specific changes so each block patch remains small and reviewable.
