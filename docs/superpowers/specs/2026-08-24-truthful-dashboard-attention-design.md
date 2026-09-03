# Truthful Dashboard Attention Cards Design

**Date:** 2026-08-24
**Status:** Approved

## Problem

The Admin dashboard aggregates `In Review` and `Scheduled` counts across every editorial
collection the signed-in user can manage. Each aggregate card currently links to only the first
visible collection. The number and destination can therefore describe different sets of records,
which makes editorial work appear missing after navigation.

The Action Queue cannot replace these destinations for every user because managing editorial
content does not necessarily grant `manage_work_queue`.

## Job And Audience

Content editors, reviewers, and site managers use the dashboard to identify work requiring action
and reach the relevant records quickly. The dashboard must provide an accurate summary without
asking users to remember which collections contribute to a total.

Success means every actionable count has a destination containing exactly the records represented
by that count, while unauthorized content remains absent.

## Selected Direction

Retain one compact aggregate card for `In Review` and one for `Scheduled`. Replace the misleading
whole-card link with collection-specific rows inside each card.

Each card contains:

- the aggregate authorized count;
- a short state label;
- one row for each authorized collection with a non-zero count or an unavailable count;
- the collection name, its count, and a directional affordance;
- a direct link to the matching filtered Payload collection view.

The `In Review` card may include Pages, Articles, News & Events, and Reviews. The `Scheduled` card
may include Pages, Articles, and News & Events. Collection order remains stable and follows the
dashboard's existing content order.

When every successful count is zero, the card shows `Nothing waiting` and contains no inactive
navigation. `Open Submissions` and `Action Queue` remain separate operational cards because each
already has one truthful destination.

## Alternatives Considered

### Separate Card Per Collection

This makes every destination explicit but expands two compact workflow concepts into as many as
seven peer cards. It increases dashboard scanning cost and makes the attention area unstable as
capabilities change.

### Action Queue As The Only Destination

This provides a single operational inbox but fails for content managers who can manage editorial
collections without `manage_work_queue`. It would also make dashboard truth depend on queue-sync
coverage instead of the source collection state.

### Aggregate Cards With Collection Rows

Selected. This preserves orientation through aggregate totals, gives every count an exact
destination, respects differing capabilities, and adds limited visual density only when work
exists.

## Data And Navigation

The dashboard remains a Payload server component. It authenticates from the incoming request and
runs only capability-authorized Local API queries with the current user and
`overrideAccess: false`.

Each workflow count resolves to one of three states:

1. `available` with a numeric count;
2. `unavailable` when the authorized query fails;
3. absent when the user lacks the relevant capability.

Successful numeric values contribute to the aggregate. Failed queries do not silently become
zero. An affected collection renders `Count unavailable`, while successful sibling collections
remain usable. If some authorized queries fail, the aggregate displays the known total with a `+`
suffix and the supporting label `Partial count`. If every authorized query fails, the aggregate
displays an em dash with `Count unavailable`.

`In Review` rows link to their exact collection with `workflowState=in_review`.

`Scheduled` rows link to their exact collection using the same future-schedule contract as the
count: `scheduledPublishAt` exists and is later than the dashboard request time. The list URL must
preserve both constraints so the destination matches the displayed count.

## Interaction And Presentation

The aggregate card is a semantic container, not a link. Collection rows are the only interactive
elements inside it.

Each row:

- provides a full-width link target;
- names the collection and count in visible text;
- includes a restrained directional affordance;
- exposes an obvious keyboard focus state;
- uses Payload theme variables rather than hard-coded collection colors;
- meets a comfortable touch-target height on narrow screens.

Cards participate in the existing responsive attention grid. Their internal rows stack vertically,
so the layout remains legible when the outer cards collapse to one column. Motion is limited to
brief color or border feedback and is removed for reduced-motion preferences.

## Error And Empty States

- A zero aggregate displays `Nothing waiting` and no collection links.
- A partial query failure displays `Count unavailable` only for the affected authorized
  collection and presents the successful aggregate as a lower bound using `N+` and
  `Partial count`.
- A complete workflow-query failure still renders the card with an unavailable state, rather than
  falsely claiming there is no work.
- Authentication failure and absent users retain the existing safe empty dashboard response.
- Operational cards and unrelated dashboard sections continue rendering when workflow counts fail.

## Scope And Boundaries

This tranche changes only the Admin dashboard's workflow-attention presentation and its supporting
count model.

It does not:

- change collection schemas, workflow states, scheduling semantics, or Action Queue generation;
- grant `manage_work_queue` to content editors;
- create a multi-collection list route or multi-tenant dashboard;
- redesign Content Overview, Quick Actions, Recently Edited, or Recent Submissions;
- add automatic publication scheduling.

The project remains a one-client-per-deployment starter.

## Testing And Documentation

Automated coverage must verify:

- aggregate values and collection-specific counts;
- exact filtered URLs for `In Review` and future `Scheduled` rows;
- stable authorized collection ordering;
- omission of unauthorized collections and queries;
- mixed zero and non-zero counts;
- partial and complete count-query failures;
- semantic link behavior and non-interactive aggregate containers;
- responsive/touch-target and focus-visible presentation contracts where practical.

Update the Admin dashboard guide and project-context architecture reference to describe truthful
collection-specific attention navigation. Complete the project-context update/check loop after
implementation.
