# Department Profiles Centered Tab Frame Design

## Goal

Make Department Profiles **Centered Auto Width** render the complete themed tab frame at its intrinsic content width, centered within the available toolbar space, matching the successful Fee Structure presentation.

## Cause

The current Department Profiles implementation applies `mx-auto w-max` only to the inner tablist. Its stationary outer frame remains `flex-1`, so the rounded border and surface stretch across the complete toolbar even when the tabs fit comfortably.

## Design

- For `tabWidth="centered"`, give the stationary outer frame intrinsic centered sizing with `mx-auto w-fit max-w-full` and do not let it grow with `flex-1`.
- Keep Content Width and Equal Full Width on the existing `flex-1` frame behavior.
- Preserve the nested viewport's `no-scrollbar min-w-0 overflow-x-auto overscroll-x-contain` classes exactly.
- Preserve the stationary rounded border, semantic tablist, configured tab styles, keyboard navigation, filtering, search relationship, and light/dark theme tokens.
- When centered tabs exceed available width, constrain the outer frame to the available width and scroll only the inner tab content without visible scrollbar chrome.
- Do not change Fee Structure or the shared content-tab helper.

## Verification

- Extend the Department Profiles tab-width integration contract to inspect the outer frame as well as the tablist.
- Require intrinsic centered frame classes and the absence of `flex-1` for Centered Auto Width.
- Require `flex-1` to remain for Content Width and Equal Full Width.
- Preserve the existing fixed-frame, nested-overflow, and `no-scrollbar` assertions.
- Run focused Department Profiles and shared tab tests, TypeScript, ESLint, Prettier, the layout detector, and the required project-context update/check loop.
