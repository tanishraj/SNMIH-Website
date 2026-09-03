# Dashboard Capability Filtering Design

## Context

The custom Payload dashboard currently runs every aggregate and recent-data query with
`overrideAccess: true`. That bypasses collection access control for all authenticated dashboard
users. The rendered dashboard also exposes every count, recent-content section, submission row,
and quick action regardless of the user's configured capabilities.

The dashboard must describe the workspace the current user is allowed to operate. Users without a
capability must not trigger the related query and must not see the related dashboard control.

## Goals

- Authenticate the dashboard request before loading operational data.
- Make dashboard queries and rendered sections follow the existing admin capability model.
- Avoid querying collections that the current user cannot manage.
- Enforce Payload access control on every permitted query as defense in depth.
- Preserve the current dashboard presentation for administrators with all capabilities.
- Keep partial query failures isolated so one unavailable collection does not remove the dashboard.

## Non-Goals

- Redesigning dashboard styles or its overall information hierarchy.
- Adding new roles, capabilities, or row-level ownership rules.
- Changing collection access-control functions.
- Adding new dashboard metrics or changing workflow semantics.
- Making public collection read access equivalent to admin dashboard visibility.

## Capability Contract

Dashboard areas use the same management capabilities that control Payload admin navigation:

| Dashboard area | Required capability |
| --- | --- |
| Page totals, workflow metrics, recent Pages, and Page creation | `manage_pages` |
| Reusable Section creation | `manage_pages` |
| Article totals, workflow metrics, recent Articles, and Article creation | `manage_articles` |
| News & Events totals, workflow metrics, recent entries, and creation | `manage_news_events` |
| Review totals and review workflow metrics | `manage_reviews` |
| Media upload | `manage_media` |
| Open and recent form submissions | `manage_form_submissions` |
| Action Queue count and link | `manage_work_queue` |

Administrators continue to satisfy every capability through the existing `hasAdminCapability`
behavior. Publication-only capabilities do not make a collection visible because collection admin
navigation and mutation access are governed by the corresponding `manage_*` capability.

## Architecture

### Authentication boundary

`DashboardOverview` remains a Payload server component. It reads the incoming request headers and
calls `payload.auth()` to obtain the current user. If authentication produces no user, the custom
dashboard component returns `null` and performs no content queries. An authentication exception is
handled the same way so the dashboard never falls back to an unauthenticated privileged query.

### Capability-driven query plan

A small dashboard-specific helper converts the authenticated user into an explicit visibility map.
The map is computed with `hasAdminCapability` and is used for both query construction and rendering.
This keeps authorization decisions centralized and prevents the query layer and UI from drifting.

The dashboard creates promises only for visible areas. Every permitted Payload Local API operation
receives both:

```ts
{
  overrideAccess: false,
  user,
}
```

The capability check prevents public-read collection policies from leaking dashboard data. Payload
access control remains the final enforcement layer for queries that are allowed to run.

### Aggregates and recent data

Content totals are loaded independently for Pages, Articles, News & Events, and Reviews when their
management capability is enabled.

The `In Review` value aggregates only the authorized content collections. The `Scheduled` value
retains the current collection scope—Pages, Articles, and News & Events—but includes only authorized
collections. Recent edits are loaded only from authorized Page, Article, and News & Events
collections, merged by update time, and capped at the existing display limit.

Form-submission counts and rows require `manage_form_submissions`. The Action Queue count requires
`manage_work_queue`. No query is issued for either area when its capability is absent.

### Rendering

Each metric card, overview card, quick action, and recent-data section uses the same visibility map
as its query. Unauthorized controls are omitted rather than rendered with zero values.

Section headings and containers are omitted when they have no visible children. Aggregate workflow
cards link to the first authorized collection participating in that aggregate, ensuring the link is
always accessible. Administrators retain the current Pages-first destination.

## Error Handling

- Authentication failure or a missing authenticated user produces no custom dashboard content and
  no collection queries.
- A permitted count query that fails contributes zero to its metric.
- A permitted recent-data query that fails contributes an empty list.
- Query failures do not enable or reveal an unauthorized section.
- Authorization is never recovered by retrying with `overrideAccess: true`.

## Testing

Focused integration tests will mock the Payload instance and request headers to verify:

- unauthenticated requests execute no dashboard collection queries;
- a restricted user causes queries only for collections covered by their capabilities;
- every executed query includes the authenticated user and `overrideAccess: false`;
- unauthorized cards, recent sections, submission data, and quick actions are absent;
- authorized areas render their counts and links;
- an administrator retains all dashboard areas;
- an authorized query failure degrades to zero or an empty list without exposing other areas.

The existing admin navigation test remains the end-to-end smoke check that the dashboard loads.

## Acceptance Criteria

- Users never receive dashboard data for an area they cannot manage.
- Unauthorized collection queries are not executed.
- All executed dashboard queries enforce Payload access control.
- Dashboard controls and queried data share one capability mapping.
- Empty dashboard sections do not render.
- Full-access administrators retain the existing dashboard experience.
