# Stats Strip Adaptive Divider Contrast Implementation Plan

**Goal:** Resolve Stats Strip internal divider colors automatically from the selected semantic background.

**Architecture:** A small background-to-divider class map lives beside the existing grid maps in the Stats Strip component. Both row and column dividers consume the same resolved class, while the shared block appearance continues to own the outer border.

**Tech Stack:** React, Payload-generated block data, Tailwind CSS 4, Vitest, TypeScript.

## Constraints

- No new admin field.
- Internal dividers only; do not change the configured outer section border.
- Use semantic foreground pairs at 15% opacity.
- Preserve all spacing, layout, animation, and responsive behavior.

### Task 1: Add failing adaptive-divider coverage

**Files:**
- Test: `tests/int/stats-strip.int.spec.tsx`

- [ ] Render each background and assert its semantic divider class.
- [ ] Assert primary internal dividers do not use `border-border`.
- [ ] Run the focused test and verify failure.

### Task 2: Resolve divider classes from background

**Files:**
- Modify: `src/blocks/StatsStrip/Component.tsx`

- [ ] Add a complete `BlockBackground` mapping for divider classes.
- [ ] Apply the resolved class to row and responsive column dividers.
- [ ] Run the focused test and TypeScript validation.
- [ ] Run `git diff --check` and leave changes uncommitted.
