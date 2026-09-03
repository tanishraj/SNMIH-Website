# Announcement Transition Stability Design

## Goal

Prevent rotating announcement messages from visually overlapping during a transition while
preserving the announcement bar's current appearance, timing controls, links, and pause behavior.

## Problem

The rotator currently mounts the outgoing and incoming announcements at the same time for a
320-millisecond crossfade. Both items occupy the same position, so their text can be visible
together. The overlap is brief and frame-dependent, which makes the flicker appear intermittent.

## Approved Design

Render one announcement transition participant at a time. When the rotation interval elapses,
the current item exits completely before the next item enters. Use the existing Framer Motion
dependency with `AnimatePresence` in `wait` mode so the sequencing is explicit and does not rely
on parallel CSS animation timers.

The rotator will retain:

- the configured interval with the existing two-second minimum;
- vertical and horizontal movement directions;
- hover-to-pause behavior;
- announcement titles, descriptions, internal links, and external-link handling;
- the existing bar dimensions, typography, colors, and truncation behavior.

Users who prefer reduced motion will receive an immediate content replacement without slide or
fade movement. The stable outer wrapper will remain mounted so transitions do not alter the
announcement bar's layout or header position.

## Component Boundaries

`RotatingAnnouncementContent` continues to own the active index, interval, pause state, and
transition direction. `AnnouncementItem` remains responsible only for rendering one item's text
and optional link. The previous-index state and cleanup timeout are removed because presence
sequencing owns the transition lifecycle.

## Edge Cases

- Zero valid items remain the caller's responsibility, matching the current component contract.
- One item never starts a rotation timer.
- A hover pauses future index changes and resumes with a fresh interval after the pointer leaves.
- Rapid rerenders or item-count changes cannot expose two readable announcement items.
- Transitioning content remains clipped to the existing single-line announcement region.

## Testing

Extend the integration tests to verify:

- only one readable announcement exists at the transition boundary;
- the next item appears after the sequential transition completes;
- hover pause and resume still work;
- horizontal and vertical modes retain their direction contract;
- the component honors reduced-motion preference without overlapping content.

Run the focused announcement test, targeted lint, and TypeScript checking after implementation.

## Out of Scope

- Announcement schema or admin-field changes.
- Changes to rotation interval semantics.
- Visual redesign of the announcement bar.
- Hero Banner alignment changes.
