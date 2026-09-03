# Q&A Accordion Split First-Row Alignment

## Goal

Align the first Q&A question with the top of the section title when Q&A Accordion uses its large-screen Split layout, without reducing spacing in Stacked mode or when Split collapses to one column.

## Behavior

- In Split mode, the first Q&A trigger keeps its existing mobile and tablet padding.
- At the `lg` breakpoint, the first Q&A trigger has no top padding and retains its existing bottom padding.
- Later Q&A triggers keep their current symmetric vertical padding at every breakpoint.
- Stacked mode keeps the current symmetric vertical padding for every trigger.
- Question typography, icons, separators, answer spacing, open state, focus behavior, and accordion interaction remain unchanged.

## Presentation Contract

The trigger continues to use `py-6` below the large breakpoint. Its large-screen classes resolve as:

- Split, first item: `lg:pt-0 lg:pb-8`.
- Split, subsequent items: `lg:py-8`.
- Stacked, every item: `lg:py-8`.

The condition belongs on the first trigger rather than the accordion container or grid. This keeps the correction local to the element creating the extra space and avoids negative margins or layout compensation that would depend on answer height.

## Verification

Focused server-rendering tests will confirm:

- the first Split trigger has `lg:pt-0 lg:pb-8` and not `lg:py-8`;
- the second Split trigger retains `lg:py-8`;
- the first Stacked trigger retains `lg:py-8` and does not receive `lg:pt-0`;
- mobile and tablet retain `py-6` in every case;
- existing Q&A Accordion tests, layout contracts, TypeScript, lint, and project-context checks remain green.

## Out of Scope

- Moving the Q&A column or section title
- Changing section-content vertical alignment
- Altering accordion answer padding
- Changing row separators, typography, icons, or interaction
- Adding an Admin control for first-row spacing
