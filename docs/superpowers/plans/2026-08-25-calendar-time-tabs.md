# Calendar Time and Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render simple timezone-correct time labels and correct shared Radix Tabs states.

**Architecture:** Keep the configured IANA timezone in all `Intl.DateTimeFormat` calls while removing only `timeZoneName` from visitor labels. Update the shared Tabs primitive to use Radix's `data-[state=active]` selector so every consumer gets correct selected and hover behavior.

**Tech Stack:** React 19, Radix Tabs, Tailwind CSS 4, TypeScript, Vitest.

## Global Constraints

- Preserve timezone conversion and date grouping.
- Preserve Calendar's framed 44px controls and semantic light/dark tokens.
- Do not stage or commit.

---

### Task 1: Simple timezone-correct public labels

**Files:**

- Modify: `tests/int/site-time-zone.int.spec.ts`
- Modify: `src/lib/siteTimeZone.ts`

**Interfaces:**

- Consumes: `formatZonedTime(value, timeZone): string`.
- Produces: the same function returning labels such as `1:30 AM` without `GMT+5:30`.

- [x] Add assertions that Kolkata conversion remains correct and output contains neither `GMT` nor `UTC`.
- [x] Run `pnpm exec vitest run tests/int/site-time-zone.int.spec.ts --reporter=dot` and verify the new assertion fails.
- [x] Remove `timeZoneName: 'short'` from `formatZonedTime` without changing its timezone argument.
- [x] Run the focused test and verify it passes.

### Task 2: Correct shared Tabs state styling

**Files:**

- Modify: `tests/int/calendar-ui-contracts.int.spec.tsx`
- Modify: `src/components/ui/tabs.tsx`
- Modify: `src/blocks/Calendar/calendarStyles.ts`

**Interfaces:**

- Consumes: Radix `data-state="active"`.
- Produces: Tailwind `data-[state=active]:*` styles for shared and Calendar Tabs.

- [x] Add a DOM assertion for `data-state="active"` and source assertions rejecting the obsolete `data-active` selectors.
- [x] Run `pnpm exec vitest run tests/int/calendar-ui-contracts.int.spec.tsx --reporter=dot` and verify failure.
- [x] Replace shared and Calendar active selectors with `data-[state=active]` variants while preserving hover/focus and line variants.
- [x] Run the focused test and verify it passes.
