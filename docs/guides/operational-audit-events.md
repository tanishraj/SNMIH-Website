# Audit Log Guide

## What This Section Is

`Audit Log` is a read-only history of selected governed CMS operations. It records the actor, action, entity, and a short operator-facing summary; it is not a complete database audit trail.

In North Valley Medical College, this is the section to check when you need to understand who published an article, who updated a homepage-related default, or who changed a work-queue item during an operational incident.

## When To Use It

Use `Audit Log` when you need to:

- understand who changed an important record
- review publication and moderation decisions on pages, articles, reviews, or system pages
- inspect changes to site-wide defaults or system modes
- understand queue activity after assignment or status changes

Do not use it as the main place to manage content. It is a trace and accountability surface, not the editing workspace.

## How It Connects To The Website

Audit events do not render directly on the public website, but they explain why website behavior changed. This collection receives events automatically from key CMS actions across content, site-wide settings, and work-queue operations.

The current implementation captures selected events for:

- `Pages`
- `Articles`
- `News & Events`
- `Reviews`
- `System Pages`
- `Reusable Sections`
- `Layout Defaults`
- `Maintenance & Modes`
- `Action Queue` updates such as status, assignee, priority, due date, notes, and resolution changes
- permanent deletion across grantable collections
- user creation, access changes, trash, restore, and permanent deletion (Admin-only events)
- Media missing/restored storage transitions

This section matters when a live site changed unexpectedly and the team needs a fast, operator-friendly explanation of what happened.

## Step-By-Step Medical College Example

Investigate why a homepage-related publishing decision changed at North Valley Medical College:

1. Open `Audit Log` in `Administration`.
2. Search by a useful summary keyword such as `homepage`, `article`, or `publication`.
3. Review the latest events at the top of the list.
4. Check `entityType` to understand whether the event came from a page, article, review, system page, or work queue.
5. Review `actorEmail` and `actorRole` to see who made the change.
6. Open the related source record from the relevant section if the audit event suggests a content correction is needed.

Expected website result:

- there is no direct frontend change from reading the audit log
- operators can explain live-site changes more confidently and recover faster when something went wrong

## Best Practices

- use this section during incidents, publishing confusion, and recovery work
- search by summary and entity type rather than scrolling blindly
- pair audit review with the relevant source collection before making more changes
- treat audit summaries as operational clues, not as a replacement for content review
- expect deletion events to identify records by feature and ID without copying deleted content or personal data

## Common Mistakes And Recovery

- expecting this section to contain every low-level field change in the system
- using the audit record alone without checking the source document
- confusing queue activity with the original content change that caused the queue item

If an event is unclear, open the related source record and compare its current state with the audit summary. For queue-related events, check both `Action Queue` and the underlying content or submission record.

## Related Guides

- [Pages](./pages.md)
- [Articles](./articles.md)
- [System Pages](./system-pages.md)
- [Action Queue](./work-queue.md)
