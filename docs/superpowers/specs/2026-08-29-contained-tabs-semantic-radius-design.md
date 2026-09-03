# Contained Tabs Semantic Radius Design

**Date:** 2026-08-29

## Goal

Make the shared Contained Tabs presentation follow the active website theme's semantic control radius on both the outer framed rail and its individual tab triggers.

## Scope

Update `src/blocks/shared/contentTabRail.ts`, which is the shared presentation contract used by Fee Structure, Department Profiles, Gallery Album Tabs, News & Events Tabs, and Tabs Content.

The change must not alter Payload fields, saved values, tab sizing, colors, borders, padding, overflow, scrolling, keyboard behavior, or responsive layout.

## Presentation Contract

- Contained rail: add `rounded-control`.
- Contained tab trigger: add `rounded-control`.
- Pill rail and triggers: retain `rounded-full`.
- Underline rail and triggers: retain square geometry.
- Light and Brand surfaces use the same radius roles while retaining their existing semantic color classes.
- SNMIH-Green therefore receives its theme-derived rounded controls; SNMIH-Blue remains square because its base radius is zero.

## Verification

- Add focused assertions for Contained rail and trigger radius classes.
- Preserve assertions for Pill and Underline geometry.
- Verify Fee Structure renders the shared Contained presentation.
- Run the semantic radius contract, affected tab/block tests, TypeScript, lint, and the required project-context update/check loop.

## Non-goals

- No changes to the generic shadcn Tabs component.
- No per-block radius overrides.
- No Payload schema, generated type, migration, or content changes.
