# Users Guide

## What This Section Is

`Users` is the Admin-only destination for creating CMS accounts and deciding which parts of the Admin
panel each person can operate. The two roles are Admin and Site Manager.

- Admins have complete access and may create multiple Admin or Site Manager accounts.
- Site Managers begin with no access and receive explicit feature checkboxes.
- Site Managers cannot open Users or view/change their own role and grants.

## Create a Site Manager

1. Open **Administration → Users**.
2. Create the login and choose **Site Manager**.
3. In **Feature Access**, enable only the destinations required for that person's responsibilities.
4. Save and ask the user to sign in again.
5. Verify both the sidebar and a direct URL for one granted and one ungranted feature.

Feature changes clear the affected user's sessions, so an already signed-in user must authenticate
again. New Site Managers have all 29 features disabled unless the creating Admin selects them.

## Create Another Admin

Choose **Admin** as the role. Admin access is implicit, so no feature checklist is shown. The CMS
allows multiple Admins but prevents demoting, trashing, or permanently deleting the last active Admin.

## Choosing Features

Each feature is one visible Admin destination and includes its documented action bundle. Do not grant
Action Queue or Audit Log alone: their rows are also filtered by the source feature. For example, a
review moderator commonly needs Reviews and optionally Action Queue; a form operator needs Form
Submissions and optionally Action Queue.

See the complete 29-feature action table in
[Users, Features, and Publication Governance](../operations/editorial-governance.md).

## Best Practices

- keep Admin membership small and maintain at least two active Admins;
- grant the minimum destinations needed for current responsibilities;
- review grants whenever staff responsibilities change;
- test direct URLs and API access, not just sidebar visibility; and
- take a database backup before bulk user or migration work.

## Related Guides

- [Audit Log](./operational-audit-events.md)
- [Action Queue](./work-queue.md)
- [Form Submissions](./form-submissions.md)
