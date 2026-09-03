# Trash And Recovery Guide

## What This Feature Is

The starter enables Payload Trash for every registered collection. Deleting a document moves it to Trash instead of immediately removing it from the database, allowing authorized operators to inspect and restore it from the admin panel.

This applies to content, taxonomy, navigation, structure, media records, forms, operations records, and users. Access rules still apply: Trash does not grant permission to restore a collection the current user cannot manage.

## Before Deleting

- unpublish content when the goal is only to remove it from the website
- check Media usage; referenced assets are blocked from deletion
- remove or replace references to Pages and System Pages where validation prevents invalidation
- export the database before bulk cleanup or migration work

## Restore Procedure

1. Open the affected collection.
2. Open its Trash view.
3. Review the document and why it was deleted.
4. Restore it.
5. Re-check draft/published state, relationships, redirects, Action Queue items, and the public route.

Restoring a record does not guarantee that related records or external media objects also exist. For a Media record, confirm `Storage Status`; for a published Page, verify its path and generated redirects.

## Permanent Deletion

Treat permanent removal from Trash as irreversible application-level deletion. Take a database backup, verify the exact record, and confirm retention obligations before proceeding.

## Related Guides

- [Media](./media.md)
- [Pages](./pages.md)
- [Action Queue](./work-queue.md)
- [Audit Log](./operational-audit-events.md)
