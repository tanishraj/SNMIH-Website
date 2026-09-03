# Hero Motion Control Refinement Design

**Date:** 2026-08-24
**Status:** Approved

## Problem

The unified motion policy introduced direct Pause/Play controls for the Hero Carousel and moving
Announcements. Two presentation and interaction details need refinement:

- Announcement Pause/Play uses a 44×44 target while Dismiss uses a 32×32 target, so adjacent controls
  appear mismatched.
- Hero Pause/Play is permanently visible at the lower-right. It should be an optional, centered
  overlay that appears during visitor interaction.

The Hero's explicit Pause currently stops autoplay and background video but leaves manual slide
selection active. That does not match the requested meaning of a paused carousel: arrows, dots,
keyboard navigation, and pointer/touch dragging can still change the selected slide.

## Selected Direction

Keep the shared reduced-motion and temporary interaction-pause policy. Refine only the Announcement
control sizing and the Hero's explicit control contract.

Announcement Pause/Play and Dismiss will both use 44×44 pointer and touch targets with matching
16×16 icons. The Hero will gain an editor-controlled `Show Pause / Play Control` checkbox under
Theme Settings. It defaults to off, and missing values in existing documents resolve to off without
a data migration.

When enabled and controllable motion exists, the Hero control is positioned at the exact horizontal
and vertical center of the carousel viewport. It is visually revealed when the Hero is hovered or
contains keyboard focus. On devices without hover capability, it remains visible so touch users can
operate it. Reduced-motion visitors receive the existing static behavior and no redundant control.

## Hero Paused-State Contract

The shared motion state continues to distinguish temporary hover/focus pauses from the visitor's
explicit Pause choice. Only explicit Pause locks manual slide selection.

While explicitly paused:

- Embla autoplay remains stopped;
- all background videos remain paused;
- pointer and touch dragging cannot move the carousel;
- Previous and Next controls are disabled;
- slide indicator buttons are disabled;
- Embla keyboard-driven selection cannot change slides;
- the selected slide remains stable until the visitor selects Play.

Temporary hover or focus still pauses automatic motion without locking navigation. This preserves
the existing ability to inspect and manually navigate the Hero before choosing an explicit Pause.
Selecting Play restores every navigation method allowed by the Hero's existing Arrow and Dot
settings.

Disabled arrows and dots remain rendered in their configured positions so the layout does not jump
when Pause is selected. They use native disabled semantics and the shared disabled presentation.
Drag locking is applied through the carousel configuration rather than cancelling pointer events on
the entire Hero, so links, calls to action, and the Pause/Play control remain operable.

## Hero Control Visibility And Placement

The control belongs to one carousel-level overlay, not to individual slides. Its anchor is the exact
center of the Hero viewport and is independent of slide content alignment, height, arrows, and dots.
It sits above slide media and overlays but below no interactive content by accident; an explicit
stacking contract keeps it clickable.

The overlay does not intercept pointer input outside the button. Visual visibility follows these
rules:

- hover-capable pointer: hidden at rest, revealed while the Hero is hovered;
- keyboard: revealed while focus is anywhere within the Hero;
- touch/coarse pointer: visible whenever the CMS option is enabled;
- reduced motion or no controllable motion: not rendered;
- CMS option disabled or absent: not rendered.

The reveal uses opacity only with a short existing-token transition and no translation or scaling.
Focus visibility does not depend on hover, and the button remains a native focusable control with an
accessible `Pause hero motion` or `Play hero motion` label. The centered overlay may temporarily
cover centered Hero copy; its compact semantic surface and interaction-only visibility keep that
obstruction bounded.

## Payload Authoring Contract

Add one checkbox to Hero Carousel's Theme Settings:

- name: `showPauseControl`;
- label: `Show Pause / Play Control`;
- default value: `false`;
- description: explains that the centered control lets visitors freeze autoplay, video, and slide
  navigation, and appears on hover/focus or remains available on touch devices.

The field is independent of `Autoplay` because a single video slide still has controllable motion.
Runtime rendering additionally requires either multi-slide autoplay or at least one background
video. Enabling the field on a static image Hero therefore stores the editor's intent but renders no
irrelevant control.

The field flows through generated Payload types, the server block adapter, production rendering,
and live preview through the existing Hero component boundary. No collection migration or backfill
is required.

## Announcement Control Contract

Keep Pause/Play at its current logical inline-end position. Increase Dismiss from 32×32 to 44×44 so
both adjacent controls share:

- the same target dimensions;
- a 16×16 Lucide icon;
- the existing rounded, semantic ghost presentation;
- the existing focus-visible behavior.

The bar's flex and truncation behavior remains unchanged. Matching does not reduce the established
44×44 accessible target.

## Alternatives Considered

### Centered Carousel-Level Overlay

Selected. It provides one stable position across every slide and does not couple the control to
content alignment or the lower dot rail.

### Control Inside Each Slide's Content Layer

Rejected because it would move with slide alignment and could require duplicate controls in the
rendered carousel structure.

### Reworked Lower Control Rail

Rejected because bottom-center is not the requested horizontal-and-vertical center, and combining
Pause/Play with dots would make placement depend on whether dots are enabled.

## Accessibility And Edge Cases

- The CMS option never overrides `prefers-reduced-motion`; reduced motion remains the highest-priority
  automatic-motion constraint.
- Hover-only disclosure is supplemented by focus-within and no-hover/coarse-pointer visibility.
- Explicit Pause does not disable Hero links or calls to action.
- Native `disabled` attributes communicate locked arrow and dot controls to assistive technology.
- A single background-video slide can expose and use the control when configured.
- A multi-image Hero with Autoplay disabled has no controllable automatic motion and renders no
  Pause/Play control even when the checkbox is saved on.
- Rejected video `play()` promises remain safely ignored under the existing policy.
- Resuming restores interaction without changing the selected slide first.

## Scope

This refinement changes Hero Carousel schema, adapter, interactive behavior, focused tests,
generated Payload types, and the maintained block-system contract. It changes Announcement control
sizing and related tests.

It does not redesign Hero typography, overlays, arrows, dots, slide content, Announcement copy, or
the shared motion policy used by other components. It adds no global visitor preference and keeps
the starter one client per deployment.

## Verification

Automated coverage must verify:

- the Hero field's name, label, default, and editor description;
- absent and false values hide the Hero control;
- true reveals the centered control only when meaningful motion exists;
- hover, focus-within, and no-hover/coarse-pointer visibility contracts;
- exact center positioning independent of dots and content alignment;
- explicit Pause stops autoplay and video and disables arrows, dots, keyboard selection, and drag;
- temporary hover/focus pause does not lock manual navigation;
- Play restores configured manual navigation without changing slides automatically;
- reduced motion suppresses the control and all automatic motion;
- Announcement Pause/Play and Dismiss share 44×44 targets and 16×16 icons.

After implementation, regenerate Payload types, run focused Hero/Announcement/motion tests, run
TypeScript and lint, execute the complete integration suite and production build in proportion to
risk, and finish the project-context update/check loop. Browser verification should cover pointer,
keyboard, and touch/coarse-pointer presentation when a browser is available.
