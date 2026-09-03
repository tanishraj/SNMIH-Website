# Announcement Scroll Flicker Fix

## Goal

Remove the one-frame jump between the sticky global announcement and header when the announcement hides or reappears during scrolling.

## Cause

Announcement visibility changes during render, while `--global-announcement-offset` is currently synchronized in a passive effect. The effect cleanup removes the property before the next effect restores it, briefly exposing the server fallback offset and allowing the browser to paint mismatched announcement and header positions.

## Design

- Keep the existing scroll threshold of `window.scrollY > 8`.
- Keep the existing immediate hide/show behavior and session dismissal behavior.
- Synchronize `--global-announcement-offset` in a layout effect so the offset is correct before paint.
- Do not remove the CSS property during visibility-state transitions.
- Remove the property only when the global announcement component unmounts.
- Do not add animations or change announcement/header styling.

## Verification

- Extend the announcement behavior test to confirm scrolling updates the offset without removing the CSS property between visibility changes.
- Run focused announcement tests and lint for the modified component and test.
