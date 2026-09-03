# Calendar Visual Consistency Design

## Status

Approved visual direction: **Institutional Ledger**.

This is a focused refinement of the existing Calendar block. It preserves its content model, data loading, month navigation, filters, Calendar and Timeline behavior, Upcoming projection, draft preview, and responsive view rules.

## Objective

Make the Calendar feel native to the SNMIH theme and the website's shared component system. The result must use consistent type roles, control sizes, spacing, borders, radii, and semantic colors in both light and dark modes.

## Visual Direction

The Calendar should resemble a precise institutional schedule: crisp structure, quiet rules, compact utility typography, and restrained status color. It should feel clinical and academic without becoming sterile or dashboard-like.

SNMIH's zero-radius geometry is intentional. Calendar surfaces and controls follow the active theme radius instead of introducing independent pill or card shapes.

## Typography

- The Calendar block's section-level heading is the only Calendar text that may use `var(--font-display)`.
- The Upcoming heading, Timeline date headings, month label, tabs, event titles, filter labels, empty states, and supporting copy use the standard sans family.
- Compact dates and calendar numbers use the project's mono utility family for consistent scanning.
- Event titles use the shared item-title hierarchy rather than a custom display treatment.
- Metadata uses the shared supporting or metadata hierarchy and semantic muted foreground.
- No child panel should compete typographically with the section heading.

## Component Composition

Use existing shadcn components wherever they own the interaction:

- `Tabs`, `TabsList`, and `TabsTrigger` for desktop Calendar/Timeline selection.
- `Select`, `SelectTrigger`, `SelectContent`, `SelectGroup`, and `SelectItem` for classification filtering.
- `Button` for previous month, next month, retry, and `+N more` actions.
- `Badge` for classification labels.
- `Separator` for row and group division.
- `Empty` for unconfigured, filtered-empty, and no-upcoming states.

Do not duplicate primitive interaction behavior with custom markup. Component `className` additions should express Calendar layout and theme-radius integration, not replace the primitive's state behavior.

The Upcoming container remains a semantic `aside`. The installed shadcn `Card` intentionally owns a rounded, elevated visual treatment that conflicts with SNMIH's zero-radius, border-led Calendar direction. The panel still composes shadcn `Badge`, `Separator`, and `Empty` primitives internally.

## Control Contract

- Previous month, next month, Calendar tab, Timeline tab, and classification select use a 44px minimum interactive height.
- Icon buttons use the shadcn icon-button size and the project's Lucide icon contract.
- The desktop toolbar forms one coherent bordered row. Month navigation is the leading group; view and filter controls form the trailing group.
- Tabs have an unmistakable active state using semantic primary color and a two-pixel lower rule. They do not use display typography.
- The Select trigger, popover, and items use the active theme radius consistently. For SNMIH this resolves to square corners.
- Hover, active, focus-visible, disabled, and pending states must remain visible in both modes.
- Mobile controls wrap into full-width rows without shrinking below their labels or creating page-level horizontal overflow.

## Surfaces, Borders, and Radius

- Primary Calendar surfaces use `bg-card` and `text-card-foreground`.
- Structural rules use `border-border`; controls use the shared input/border semantics.
- Supporting text uses `text-muted-foreground`.
- Focus uses the shared `ring` semantic.
- Every Calendar radius resolves through `var(--radius)`; no hard-coded `rounded-2xl`, `rounded-3xl`, or unrelated radius is introduced in this block.
- The Calendar grid remains border-led rather than elevated. Upcoming is a supporting bordered panel with no decorative shadow.
- The toolbar-to-content gap is 16px. Internal panel padding uses a consistent 16px compact / 20px regular rhythm.

## Classification Color

Classification colors remain secondary signals. They may appear as:

- a small legend or timeline dot;
- a two-pixel event edge;
- a subtle tint mixed with the semantic card surface.

Classification color must not replace the foreground color for event titles or metadata. All readable text continues to use semantic theme foreground tokens. The tint must remain quiet in both light and dark modes and preserve visible differentiation from the surrounding card.

## Calendar Grid

- Weekday labels use compact sans or mono utility styling, semantic muted foreground, and consistent tracking.
- Date numbers use the utility hierarchy; only the current date receives the semantic primary treatment.
- Event tiles share one padding, type size, line height, and minimum target rhythm.
- Multi-day continuation geometry remains legible without changing event link semantics.
- `+N more` uses a shadcn Button treatment appropriate for a low-emphasis inline action and preserves its existing Timeline focus transfer.
- Out-of-month cells use a semantic muted surface and foreground without opacity-based contrast loss.

## Timeline

- Timeline date headings use sans or mono utility typography, never the display family.
- Event rows align classification, title, time, and location to one repeatable grid.
- Badge and metadata sizes match their equivalents in Upcoming.
- Separators, padding, hover, and focus behavior remain consistent across every row.
- The first and last rows do not receive accidental extra spacing.

## Upcoming Panel

- `Upcoming` uses a restrained sans heading below the existing eyebrow.
- Date numerals use the mono utility family.
- Event title, time, location, and all-day labels match Timeline typography.
- The vertical schedule rule and classification dot remain subtle status cues.
- The legend uses the same classification dot and label treatment as the event list.
- The empty state retains the panel's dimensions and hierarchy without introducing a competing illustration or display heading.

## Responsive Behavior

- Desktop (`md` and above) starts in Calendar view and exposes Calendar/Timeline tabs.
- Compact layouts remain Timeline-first and do not expose the desktop view tabs.
- The toolbar stacks cleanly on small screens; navigation and filter remain reachable with 44px targets.
- Calendar-specific content must not create page-level horizontal scrolling. The desktop grid's internal overflow behavior remains isolated when necessary.
- Upcoming moves below the primary view while preserving spacing and border rhythm.

## Accessibility

- Preserve existing labels, live announcements, focus transfer, date semantics, and link destinations.
- Tabs expose selected state through native shadcn/Radix semantics.
- Select items must be grouped inside `SelectGroup`.
- Focus rings must remain visible against card, page, subtle, and brand surfaces in both website modes.
- Color is never the only indication of current date, active tab, event type, pending state, or error state.
- Text and controls must meet the project's existing theme contrast contracts.

## Testing and Verification

Add or update focused tests for:

- display-font use being limited to the Calendar section heading;
- shadcn Tabs and grouped Select composition;
- consistent control height and theme-radius classes;
- semantic foreground/background/border usage;
- classification color remaining an accent rather than a text color;
- desktop Calendar and mobile Timeline behavior;
- keyboard focus transfer from `+N more`;
- light and dark theme token contracts;
- empty, error, pending, filtered, all-day, and multi-day states.

Run focused Vitest tests, TypeScript, ESLint, Prettier, project-context update/check, and the Calendar Playwright smoke test. Perform one visual browser pass at representative desktop and mobile dimensions in both light and dark modes.

## Out of Scope

- Calendar schema, API, caching, timezone, recurrence, or migration changes.
- A site-wide shadcn or theme redesign.
- Changes to the approved Calendar/Timeline/Upcoming information architecture.
- New animation or decorative effects.
- Changes to other blocks solely to make them resemble Calendar.
