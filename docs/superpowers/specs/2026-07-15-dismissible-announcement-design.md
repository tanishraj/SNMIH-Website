# Dismissible Announcement Design

## Goal

Add optional dismissal to global and page Announcement blocks. Make the sticky global announcement hide while scrolling and reappear at the top without leaving a gap above the header.

## CMS configuration

- Add `announcementDismissible` to the Announcement tab in Website Defaults.
- Add `dismissible` to the page Announcement block.
- Both fields are checkboxes with `false` defaults, preserving existing documents and behavior.
- Scroll auto-hide is part of the sticky global announcement behavior and is not added to page-content announcements.

## Shared component architecture

- The shared `AnnouncementBar` owns normalization, rendering, dismissal, and optional scroll visibility.
- The page Announcement block delegates rendering to `AnnouncementBar` instead of maintaining duplicate markup.
- Existing display modes, timing, links, labels, appearance classes, and content behavior remain unchanged.
- The component becomes client-rendered because it uses browser state and event listeners.

## Dismissal behavior

- The close control renders only when the CMS `dismissible` option is enabled.
- Use the existing shadcn Button with the ghost icon-button treatment and a Lucide `X` icon.
- The button has an accessible `aria-label` of `Dismiss announcement`.
- Dismissal is stored in `sessionStorage`, so it persists across navigation and reloads in the current browser tab and resets when the tab session ends.
- The global announcement uses the stable key `global-announcement`.
- Page announcements use their Payload block ID, preventing one dismissed block from hiding another.
- Missing or unavailable session storage must not break announcement rendering.

## Scroll behavior

- Only a sticky global announcement observes scrolling.
- It hides when `window.scrollY > 8` and reappears when the page returns to `window.scrollY <= 8`.
- Use one passive scroll listener and throttle state updates through `requestAnimationFrame`.
- Remove the listener and cancel any queued animation frame during cleanup.
- A manually dismissed announcement remains dismissed even when the page returns to the top.

## Header offset

- The global announcement controls a root CSS custom property representing its active height.
- When visible, the property is `2.5rem`, matching the current thin announcement row.
- When hidden or dismissed, the property is `0px`.
- The frontend layout computes the sticky header top offset from the CMS toolbar offset plus this property.
- The server-rendered fallback assumes the configured global announcement is visible, preventing initial overlap before hydration.

## Compatibility

- Page Announcement blocks do not hide on scroll.
- Non-dismissible announcements still participate in global scroll auto-hide when sticky.
- Existing appearance and animation settings remain authoritative.
- Empty or invalid announcement item collections continue to render nothing.
- No existing content migration is required.

## Verification

- Verify the new fields and false defaults in Payload configs.
- Verify the close button appears only when enabled.
- Verify session dismissal survives reload/navigation in the same tab.
- Verify separate page blocks use separate dismissal keys.
- Verify global announcement visibility at `0px`, `9px`, and back at `0px` scroll positions.
- Verify the sticky header has no gap while the announcement is hidden.
- Run focused announcement integration tests, generated type checks, and TypeScript.
