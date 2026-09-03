# SNMIH-Blue Radius Design

## Goal

Restore the SNMIH-Blue website theme's shared radius to `0.5rem` so its cards, controls, and compact details retain the intended subtle rounding.

## Decision

- Set `--radius: 0.5rem` in `theme-snmih-blue.css`.
- Keep the existing semantic radius system: cards and controls derive from `--radius`, while compact details derive from half the theme radius and remain capped at `0.25rem`.
- Update the focused theme contract to expect `0.5rem`.
- Update maintained architecture wording so it describes SNMIH-Blue as subtly rounded rather than square.

## Scope

This changes only the SNMIH-Blue base radius contract and its matching test/documentation. It does not alter SNMIH-Green, explicit pills or circles, component markup, Payload Admin, or stored CMS content.

## Verification

- Run the focused theme and semantic-radius tests.
- Run the required project-context update/check loop.
- Confirm formatting and diff checks pass.

## Change Policy

Keep all changes uncommitted, as requested.
