# Contact 24 Office Layout Refresh

## Goal

Ensure every complete Site Settings office appears in Contact 24 and refresh the office
presentation so maps lead into clear, square-cornered contact details. A single office must use the
full available width, while multiple offices remain readable in a maximum two-column layout.

## Current-state diagnosis

The published Site Settings document contains four office rows. Only the first row has an
Interactive Map Embed URL; the other three rows have empty embed URLs. The shared office
normalizer rejects incomplete rows, so only the first office reaches the Contact 24 presentation.

This is expected validation behavior rather than a grid rendering defect. The missing embed URLs
must be completed in Site Settings before all four interactive maps can render. External map share
links are not used as iframe fallbacks because map providers do not guarantee that short or
navigation URLs are embeddable.

## Selected approach

Use a count-aware grid capped at two columns:

- one office: one full-width column
- two or more offices: two equal columns from the medium breakpoint
- every office: one column on smaller screens

Each office is a vertical composition with an interactive map followed by a separate details
panel, separated by a 16px gap. The map and panel have square corners. The details panel uses a
transparent background, a thin four-sided border, and restrained decorative border extensions
outside all four corners.

This approach keeps maps large enough to interact with, makes the single-office case intentional,
and concentrates the visual signature around the contact information instead of enclosing the
entire map.

Alternatives rejected:

- A four-column desktop grid makes maps and wrapped addresses too narrow.
- A single border around both the map and details boxes the map in and weakens the requested
  details treatment.
- A details panel overlapping the map reduces usable map space and creates uneven alignment when
  contact content wraps.

## Visual design

The block retains the existing shared container, outer spacing, heading scale, font families, and
theme appearance behavior.

Each office renders in this order:

1. interactive map
2. region eyebrow
3. city heading
4. address
5. phone
6. email
7. external map action

The map uses a 16:9 aspect ratio on narrow mobile screens and a shorter 5:2 aspect ratio from the
small breakpoint. It has no gradient or text overlay. The details panel sits below it with a 16px
gap and inherits the block background without adding its own fill. It uses the standard foreground,
muted foreground, and border color. The map wrapper also adds no background. No custom palette or
new global design tokens are introduced.

The panel has no border radius. Its four regular borders define the information surface. At each
corner, a separate 12px L-shaped bracket sits 4px outside the panel border. Because the bracket is
offset on both axes, neither of its strokes intersects the panel's horizontal or vertical border,
so the corner cannot read as a plus sign. The brackets are decorative, ignore pointer events, and
use the same semantic border color. The restrained corner treatment is the block's single visual
signature.

The existing project typography remains authoritative:

- the block eyebrow keeps the project mono uppercase treatment
- the block title keeps the shared regular-block heading scale
- region uses the compact mono uppercase treatment
- city uses a clear semibold display size
- contact details retain readable base sizing and line height

## Component changes

`src/components/contact24.tsx` remains the pure presentation component.

It will:

- select a full-width single-column grid when `offices.length === 1`
- select a two-column medium-breakpoint grid when more offices exist
- render every received office in source order
- replace the current rounded Card composition and map overlay with a square map/details
  composition
- use a 16px map-to-details gap and a shorter responsive map aspect ratio
- keep the existing accessible iframe, telephone link, email link, and external map anchor
- use a small internal decorative wrapper for four offset L-shaped corner brackets
- accept a details alignment independent from the block heading alignment
- align the region, city, contact rows, and map action left, center, or right
- render the map action as a compact content-width small button
- optionally hide the entire location-details panel so the office renders as an interactive map only

The Payload block adds a required `detailsAlignment` select under Layout & Theme with Left, Center,
and Right options and a Left default. The existing `contentAlignment` continues to control only
the block eyebrow, title, and description.

Layout & Theme also uses the stored `showAddressDetails` checkbox with the editor label
`Show Location Details`, enabled by default. The stored name remains unchanged so values already
saved through the first version stay compatible. Turning it off removes the entire bordered
details panel for every office in that block, including its corner brackets, region, city,
address, phone, email, and View on Map action. Only the interactive map remains. The component
receives this value through the clearer `showLocationDetails` presentation prop.

The Site Settings schema, server loader, live-preview adapter, and public office data flow do not
change.

## Data behavior

The office normalizer remains strict. A public office requires:

- region
- city
- address
- phone
- email
- valid HTTPS interactive map embed URL
- valid HTTPS external map URL
- accessible map title

Incomplete offices remain excluded so the public page never renders a broken or unsafe iframe.
Valid offices continue to render even when another row is incomplete. Site Settings array order
continues to control public display order.

Every published office currently has an Interactive Map Embed URL, so all four pass normalization.
This design keeps strict validation and does not invent, migrate, or provide fallbacks for map
URLs.

## Responsive and accessibility behavior

- Mobile and narrow tablet layouts use one column.
- A single office stays full width at every breakpoint.
- Multiple offices use two columns from the medium breakpoint.
- Maps use 16:9 on narrow mobile screens and 5:2 from the small breakpoint.
- A 16px gap separates each map from its details panel.
- Maps remain keyboard-interactive and retain accessible titles, lazy loading, fullscreen support,
  and the conservative referrer policy.
- Decorative corner strokes are hidden from assistive technology through their non-semantic CSS
  implementation.
- Phone, email, and View on Map remain real links with visible focus treatment inherited from the
  project components and styles.
- Wrapped addresses and long email values remain inside the panel without changing map height.
- Details alignment can be left, center, or right without changing the block heading alignment.
- The View on Map action uses the small Button size and content width at the selected alignment.
- Hiding location details removes the entire bordered panel and its gap contribution, leaving only
  the interactive map.

## Verification

Focused tests will verify:

- one office uses a full-width one-column grid
- two and four offices use the capped two-column desktop grid
- all valid offices render in source order
- the map precedes the details
- the map uses the shorter responsive aspect ratio and a 16px content gap
- region and city no longer overlay the map
- the map wrapper and details panel add no background
- the details panel has a four-sided border and no radius
- a separate offset L-shaped bracket is present at every corner
- details alignment is independent from heading alignment
- centered details center the heading, address rows, links, and map action
- the View on Map action uses the small Button size and does not stretch to panel width
- location details are shown by default for backward compatibility
- disabling location details removes the panel, border, corner brackets, region, city, address,
  phone, email, and View on Map while preserving the interactive map
- iframe accessibility and contact link semantics remain intact
- incomplete rows remain filtered while valid siblings render

Focused lint and the Contact 24 integration tests will run after implementation. The local
Contact 24 preview will be checked against the running Payload/Next development server.
