# Contact 24 Block

## Goal

Add the Shadcn Blocks Contact 24 composition as a reusable Payload page block. Preserve its
regional office-card grid while making Site Settings the single source of truth for office
contact data and replacing the registry's static map images with accessible interactive maps.

## Selected approach

Site Settings owns an ordered office directory, and Contact 24 owns only page-specific
presentation settings. Each office uses a provider-hosted map embed in an iframe plus a separate
external map URL for the functional `View on Map` action.

This approach avoids duplicating shared contact information in page blocks and does not introduce
a client-side map SDK, API-key lifecycle, provider billing dependency, or additional frontend
JavaScript.

The alternatives considered were:

- a dedicated Offices collection, which adds unnecessary editorial workflow and relationship
  complexity for a small shared directory
- a Google Maps or Mapbox JavaScript SDK, which provides richer custom map behavior at the cost of
  bundle size, credentials, billing, consent, and failure modes that this block does not need

## Site Settings

Preserve the existing primary contact fields:

- `contactEmail`
- `contactPhone`
- `address`
- `googleMapEmbedUrl`

They remain backward compatible with the footer and existing consumers. Contact 24 does not infer
office cards from these legacy single-location fields.

Add an `officeLocations` array to the Contact tab. The array order is the public display order.
Each row is editor-collapsible and requires:

- region
- city
- address
- phone
- email
- map embed URL
- external map URL
- accessible map title

The map embed and external map fields accept only complete HTTPS URLs. The map title describes
the iframe for assistive technology, for example `Interactive map for the Dubai office`.

No unrelated Site Settings fields are added. The existing Brand, Contact, Legal, and Social Links
tabs already cover the broader global content requirements.

## Payload block configuration

Create a block with:

- slug: `contact24`
- interface: `Contact24Block`
- singular label: `Contact 24`
- plural label: `Contact 24 Blocks`

The Content tab contains:

- optional eyebrow
- required title
- optional description

The Layout & Theme tab contains:

- shared block appearance fields
- content alignment: left, center, or right
- size: compact, default, or comfortable

Defaults are left-aligned content and default size. The block intentionally has no office selector
or office-level overrides: every valid published office from Site Settings is shown in the
configured order.

## Data flow

A server-only office loader reads the published Site Settings global and returns normalized office
records. The public Contact 24 block adapter calls this loader only when the block is rendered.
Request-level caching prevents repeated global reads if a page contains more than one Contact 24
instance.

The shared normalizer:

- trims all text values
- rejects incomplete office rows
- creates safe telephone links while preserving the editor-facing phone format
- preserves validated email and HTTPS map URLs
- keeps the Payload array order

The presentation component receives only normalized serializable office data and presentation
settings. It does not import Payload configuration or perform runtime map API calls.

The page preview route loads a draft Site Settings office snapshot and passes it into the
client-side live-preview renderer. A separate preview adapter uses that snapshot, keeping
server-only Payload code out of the browser bundle. The existing page-save refresh reloads the
snapshot; after editing Site Settings in a separate admin view, the editor reloads or reopens the
page preview to receive the new global draft.

If no complete offices are available, Contact 24 renders nothing. A single invalid office does not
prevent valid offices from rendering.

## Interactive maps and links

Each office card renders its map embed as a lazy-loaded iframe. The iframe has:

- an editor-provided accessible title
- `loading="lazy"`
- full-screen support when the provider offers it
- a conservative referrer policy

The external map action uses the existing shadcn Button with `variant="outline"` and `asChild`.
It renders a real anchor, opens in a new tab, and uses safe relationship attributes.

Telephone and email values render as `tel:` and `mailto:` links. Address text remains readable
when the map provider is unavailable. An iframe load failure therefore does not remove the
contact details or external map action.

## Visual design

The block retains Contact 24's office-grid character while following the project's regular block
system:

- shared `regularBlockContainerClasses`
- shared `regularBlockMobilePaddingClasses`
- `max-w-screen-2xl` container behavior
- one card column on mobile and two columns from the medium breakpoint
- project eyebrow typography
- `text-3xl font-semibold tracking-tight text-balance sm:text-4xl` heading scale
- base description copy with a seven-unit line height
- semantic background, border, foreground, and muted tokens
- theme-standard radius and outline button treatment
- flex and grid gaps instead of margin-driven stack spacing

The interactive map occupies a consistent aspect-ratio area at the top of every card. Region and
city overlay the map's lower edge with a semantic background gradient, preserving the registry
composition. Address, telephone, and email form the card body, and the full-width map action sits
at the bottom. Card layout accommodates wrapped addresses without changing the map dimensions.

Compact, Default, and Comfortable share the project's outer vertical rhythm. They differ through
internal heading, grid, and card gaps. Content alignment affects the block eyebrow, title, and
description; office details remain left-aligned for readability.

## Component responsibilities

- Site Settings declares and validates the canonical office directory.
- The Contact 24 block config declares editor-facing presentation fields.
- The server office loader reads the correct published or draft global state.
- The shared normalizer converts Payload values into a stable office presentation contract.
- The public block adapter joins block presentation data with published office data.
- The live-preview adapter joins block presentation data with the preview office snapshot.
- The Contact 24 presentation component owns the responsive grid, maps, contact links, and cards.

These boundaries allow the directory schema, data loading, and visual composition to be tested
independently.

## Registration and thumbnail

Register Contact 24 in:

- the Page layout block list
- the normal page block renderer
- the live-preview page block renderer
- block thumbnail definitions
- block thumbnail fixtures

The thumbnail fixture renders the presentation component with representative office data rather
than querying Site Settings. This keeps thumbnail generation deterministic and independent from
the current database contents.

## Accessibility and security

- Every iframe has a meaningful title.
- Phone, email, and external map destinations use semantic anchors.
- External map links open safely in a new tab.
- Map URLs reject non-HTTPS protocols such as `javascript:` and `data:`.
- Lucide icons are decorative and do not duplicate visible link text.
- Button icons use the project's `data-icon` contract without manual icon sizing.
- Text and actions retain keyboard access and theme contrast.
- Interactive maps do not replace the equivalent address and contact text.

## Verification

Focused tests cover:

- Site Settings office fields, required states, editor structure, and URL validation
- normalization of valid offices and rejection of incomplete records
- telephone, email, embed, and external map link output
- iframe title, lazy-loading, and referrer-policy attributes
- zero, one, and multiple office layouts
- shared spacing, typography, appearance, size, and alignment contracts
- normal rendering with published Site Settings data
- live-preview rendering with a draft office snapshot
- Page block and thumbnail registration
- deterministic thumbnail fixture availability

After implementation:

- generate Payload types
- generate the Contact 24 thumbnail
- run focused integration tests
- run lint and TypeScript/build verification in proportion to unrelated existing failures

## Out of scope

- A dedicated Offices collection
- Client-side Google Maps, Mapbox, or Leaflet SDK integration
- Custom map markers, clustering, routing, or geolocation
- Per-page office selection or office overrides
- Automatic geocoding from an address
- Migrating or removing the existing primary contact fields
- Changes to the footer's current contact-data contract
