# Unified Motion Accessibility Design

**Date:** 2026-08-24
**Status:** Approved

## Problem

The public site has three persistent automatic-motion systems with different accessibility
contracts:

- Hero Carousel can auto-advance slides and autoplay looping background video without reduced-motion
  handling, keyboard-focus pausing, or a visible Pause/Play control.
- Rotating Announcement removes its animated transition under reduced motion but continues replacing
  content on a timer. It pauses only for pointer hover.
- Marquee Announcement pauses only for pointer hover and has no static reduced-motion presentation.

Visitors therefore cannot rely on one predictable way to stop movement. Motion-sensitive visitors
can still receive timed content replacement or video even after expressing a reduced-motion
preference.

## Job And Audience

Visitors must be able to read, navigate, and act without automatic movement competing for attention
or changing content unexpectedly. Visitors who tolerate motion should retain the editorial rhythm
and discoverability benefits of autoplay, while keyboard and motion-sensitive visitors receive full
control.

Success means every persistent automatic-motion surface follows the same rules, exposes a direct
Pause/Play mechanism when motion is available, and preserves all manual interaction when automatic
motion is suppressed.

## Selected Direction

Keep the existing autoplay capabilities and add a shared, component-local accessible motion policy.
Hero Carousel, Rotating Announcement, and Marquee Announcement each receive a compact visible
Pause/Play control whenever they have enough content and configuration to move automatically.

The shared policy combines four inputs:

1. whether automatic motion is configured and meaningful;
2. the visitor's reduced-motion preference;
3. the visitor's persistent Pause/Play choice for that component instance;
4. temporary interaction pauses from pointer hover or keyboard focus within the component.

Automatic motion is allowed only when all four conditions permit it. Reduced motion has the highest
precedence and cannot be overridden by Play. An explicit Pause remains active after hover or focus
leaves. Hover and focus pauses end when their interaction ends unless an explicit Pause remains.

Pause state is intentionally local. Pausing one announcement or carousel does not freeze unrelated
motion elsewhere and does not persist across navigation.

## Alternatives Considered

### Visible Controls On Every Auto-Moving Surface

Selected. This creates one learnable visitor contract, preserves editor-configured autoplay for
visitors who accept motion, and satisfies the need for direct control over persistent movement.

### Hero-Only Visible Control

This reduces controls in the announcement bar but leaves announcements dependent on implicit
hover/focus behavior. It remains inconsistent for touch and switch-input visitors.

### Manual-Only Site Default

This is mechanically safe but removes intentionally configured editorial behavior for every
visitor. It is unnecessary when reduced-motion enforcement and direct controls can provide choice.

## Shared Motion State

A focused client-side motion-state unit owns the cross-component policy. It derives:

- `prefersReducedMotion`: the current browser preference;
- `userPaused`: the component-local persistent choice;
- `isPointerPaused`: whether the pointer is inside the motion region;
- `isFocusPaused`: whether keyboard focus is within the motion region;
- `isMotionAllowed`: configured motion is meaningful and none of the pause conditions apply.

The unit exposes stable event handlers for pointer entry/exit and focus capture/blur capture, plus a
toggle for the persistent choice. Focus-within handling must inspect the next focused element so
moving focus between child controls does not briefly resume motion.

The visible control reflects only the persistent visitor choice: `Pause` sets `userPaused`; `Play`
clears it. When Play is selected while the pointer or focus remains inside, automatic motion resumes
only after that temporary interaction pause ends. This preserves the safety of interaction pausing
without losing the visitor's requested future state.

The shared unit contains no Payload, block, or presentation imports. Each consumer remains
responsible for its own timer, carousel plugin, video, and layout integration.

## Shared Control

Use one reusable motion toggle presentation with Lucide Pause and Play icons. It accepts the current
persistent pause state and a context-specific accessible label.

The control:

- has a minimum 44×44 pointer and touch target;
- uses a native `button`;
- exposes the next action in its label, such as `Pause hero motion`, `Play announcements`, or
  `Pause marquee`;
- uses existing semantic theme tokens and clear focus-visible treatment;
- does not use an unrelated accent color or a Unicode glyph as an icon;
- appears only when the component has controllable automatic motion and reduced motion is not
  active.

The control is icon-led to protect message width, but its accessible name never depends on the icon.
No tooltip is required for the initial implementation because the action name is available to
assistive technology and the familiar Pause/Play icon pair is visible.

## Hero Carousel Behavior

Hero Carousel retains its existing editor-controlled autoplay, arrows, dots, looping option,
alignment, overlays, and manual navigation.

Slide auto-advance is meaningful only when the CMS `Autoplay` setting is enabled and there is more
than one slide. Background video is independently meaningful whenever any slide contains video,
because the existing CMS setting describes slide advancement rather than video playback. The hero
motion control appears when either kind of motion is available, including a single video slide.

For slide auto-advance:

- Embla autoplay runs only while the shared policy allows motion;
- pointer hover and focus anywhere inside the carousel pause auto-advance;
- explicit Pause remains active after interaction leaves;
- the Pause/Play control remains available even when dots are hidden;
- manual arrows and dots remain usable in every state.

Background video follows the same policy. The active slide's video may play only when automatic
motion is allowed, independent of whether slide auto-advance is configured. Explicit Pause,
interaction pauses, and reduced motion affect both slide advancement and video. Inactive slide
videos remain paused. Reduced motion prevents automatic video playback and leaves the video paused
on its available first frame. The implementation must tolerate browser-rejected `play()` promises
without surfacing an error or leaving timers running.

The motion control belongs in the lower control zone, separated from slide-selection dots but
visually aligned with them. It must not overlap hero actions or disappear when arrow/dot settings
change.

## Rotating Announcement Behavior

Rotating Announcement keeps its existing one-item-at-a-time presentation, interval sanitization,
horizontal/vertical modes, and link behavior.

For multiple items:

- the interval exists only while motion is allowed;
- reduced motion stops timed replacement entirely on the first item;
- hover and focus within the announcement region pause replacement;
- explicit Pause/Play controls the persistent choice;
- reduced motion also removes the transition, preserving the current calm visual fallback.

For zero or one item, no timer or motion control is rendered. Existing content remains readable and
clickable.

The motion control sits at the logical inline end of the announcement content. The message retains
`min-width: 0` and truncation behavior so the control does not create horizontal overflow.

## Marquee Announcement Behavior

Marquee Announcement retains its configured duration, external-link handling, and duplicated visual
track only while automatic motion is available.

In the standard motion state:

- animation runs only while the shared policy allows motion;
- hover and focus within pause both tracks;
- explicit Pause/Play controls the persistent choice;
- the duplicate track remains hidden from assistive technology and its links remain outside the tab
  order.

Under reduced motion, render one non-animated, non-duplicated track. Items wrap within the available
width rather than translating or overflowing horizontally. All primary links remain keyboard
accessible. No Pause/Play control appears because there is no automatic motion to control.

For zero items, render nothing. For one item, render a static single track without a motion control
or duplicated content.

## Accessibility And Interaction Details

- Focus capture pauses before a focused link or control can be displaced by timed movement.
- Blur capture resumes only when focus leaves the entire component and no persistent Pause remains.
- Pointer and focus pauses are independent so leaving one interaction does not resume while the
  other is active.
- Controls use logical positioning and flexible layout so long localized labels and RTL direction do
  not break the bar or hero control zone.
- Dynamic content is not added to an assertive live region; automatic announcements must not create
  repeated screen-reader interruptions.
- Manual carousel controls retain their current accessible labels and `aria-current` behavior.
- Reduced-motion changes preserve content and hierarchy rather than applying a global near-zero
  animation duration.

## State And Lifecycle Safety

- Preference changes during a session take effect without remounting the page.
- Timers and carousel subscriptions are cleaned up on pause, reconfiguration, and unmount.
- Explicit pause state resets only when the component instance unmounts; item changes do not
  unexpectedly resume it.
- When content changes from multiple items to one, automatic motion stops and the control disappears.
- Video refs are reconciled after slide selection and policy changes; no inactive video continues
  playing.
- Server rendering and initial hydration remain deterministic. Automatic behavior begins only in
  the client after motion preference is known.

## Scope And Boundaries

This tranche changes only automatic motion behavior and its direct controls for Hero Carousel,
Rotating Announcement, and Marquee Announcement.

It does not:

- change Payload fields, defaults, stored documents, or editor-facing autoplay settings;
- add a site-wide persistent motion preference or cookie;
- change News & Events Featured Carousel, which already disables autoplay for reduced motion and
  pauses on hover/focus;
- redesign hero content, announcement copy, carousel navigation, or theme palettes;
- add video sound, manual video timeline controls, or a new poster-image field;
- remove autoplay for visitors who have not requested reduced motion.

The project remains a one-client-per-deployment starter.

## Testing And Verification

Automated coverage must verify:

- the shared policy's precedence across configuration, reduced motion, persistent Pause, pointer,
  and focus;
- pointer and focus independence, including focus movement between child controls;
- control visibility, accessible action labels, 44×44 presentation contract, and persistent toggle;
- Hero Carousel autoplay start/stop, manual navigation, dots-hidden placement, active/inactive video
  `play()` and `pause()`, and rejected `play()` promises;
- Rotating Announcement timer creation/cleanup, hover, focus, Pause/Play, single-item behavior, and
  reduced-motion content stability;
- Marquee running/paused tracks, focus behavior, Pause/Play, duplicate accessibility, static reduced
  motion, wrapping, and single-item behavior;
- preference changes after mount and cleanup on unmount.

Run focused motion/component tests, TypeScript, lint, the complete integration suite, and available
browser verification. Update the project-context architecture and block-system references only
where the implemented shared policy changes their maintained contracts, then complete the required
project-context update/check loop.
