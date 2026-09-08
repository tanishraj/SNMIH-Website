# Product

<!-- impeccable:product-schema 1 -->

## Platform

webs

## Users

Public visitors—including students, faculty, applicants, families, and the wider institutional
community—use the site to understand the institution and find timely academic and campus
information. Authorized editors compose and maintain the site through Payload CMS.

## Product Purpose

This project is a reusable, one-client-per-deployment institutional website builder. It gives each
client a governed editorial system for composing branded public pages, publishing structured content,
and surfacing operational information such as programmes, news, events, offices, and calendars.
Success means visitors can find trustworthy information quickly while authorized Admins and
feature-granted Site Managers can maintain consistent pages without needing frontend code changes.

## Positioning

The starter combines a broad, curated block library with structured Payload collections, semantic
themes, editorial governance, live preview, and one-client deployment boundaries. It is a controlled
institutional publishing system rather than a tenant-switching SaaS page builder.

## Operating Context

Editors compose Pages from approved blocks and manage News & Events through centrally owned
classifications. Public calendar experiences derive dated items from active Event-behavior News &
Events classifications. Calendar grouping, month boundaries, and “today” follow the configured site
timezone, with `Asia/Kolkata` as the default.

## Capabilities and Constraints

- Payload CMS and Next.js share a TypeScript application with server-loaded public data and focused
  client interaction.
- The existing interactive Calendar block provides month-grid and timeline views with a stable
  Upcoming rail. A second calendar block may reuse its event data contract but must serve a distinct
  year-list browsing job.
- The new year-list calendar must show every month in the selected/current year, with each month
  owning its dated event rows and a separate Coming Next area beside the complete month list on
  desktop.
- Blocks must support semantic section backgrounds, light and dark website modes, authenticated live
  preview, keyboard use, responsive layouts, and reduced-motion preferences.
- Event content remains collection-owned; block configuration scopes and presents it but does not
  duplicate event records.
- Administration has exactly two roles. Admins have full access and grant any of the 29 registered
  Admin features to Site Managers; a missing grant fails closed in navigation and server access.
- Trusted review submissions enter moderation as drafts. Only an Admin or a Site Manager with the
  Reviews feature may approve or reject them; only approved reviews may be public.

## Brand Commitments

The current SNMIH institutional theme is the reference for this work. Display typography is reserved
for section-level titles; event names, controls, labels, and metadata use the established text and mono
families. Colors, borders, radii, and supporting-text contrast must come from semantic theme tokens so
the block remains coherent in light and dark modes.

## Evidence on Hand

- Existing Calendar block implementation under `src/blocks/Calendar/`.
- Structured News & Events classifications and calendar tone metadata.
- User-provided references showing month chapters, date-led event rows, current/today markers, and a
  horizontal Upcoming Highlights treatment.

No additional visitor research, usage analytics, or client photography is currently supplied; future
design work must not fabricate those forms of evidence.

## Product Principles

- Keep institutional information easy to scan and hard to misinterpret.
- Give editors flexible presentation within a coherent, client-approved vocabulary.
- Preserve one source of truth for collection-owned records.
- Make theme, accessibility, preview, and responsive behavior part of every block contract.
- Prefer calm, durable interaction over decorative novelty.

## Accessibility & Inclusion

Public interfaces must preserve semantic headings and time elements, visible keyboard focus, readable
contrast in light and dark modes, non-color event classification cues, responsive reflow, and reduced
motion behavior. Dense annual schedules must remain navigable without requiring pointer precision.
