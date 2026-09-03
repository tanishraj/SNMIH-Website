# Action Queue Guide

## What This Section Is

`Action Queue` is the CMS operations inbox for work that still needs attention. It is not a separate ticketing system that staff must fill manually. The queue is created automatically from important CMS conditions and gives operators one place to triage, assign, and resolve ongoing work.

In North Valley Medical College, this is where staff would see items such as an admissions submission needing follow-up, a submitted review awaiting moderation, unpublished structural changes, or a media asset missing governance details.

## When To Use It

Use `Action Queue` when you need to:

- see what still requires action across the CMS
- assign operational ownership
- change queue status as work progresses
- set urgency or due dates
- document how an issue was resolved

Do not use it to create content directly. The queue should send you back to the source record that needs attention.

## How It Connects To The Website

The queue does not appear on the public website, but it is tightly connected to website operations because it is generated from website-impacting CMS events.

The current system automatically creates or updates queue items from conditions such as:

- submitted `Reviews` awaiting moderation
- `Form Submissions` that are `New` or `In Review`
- `Headers`, `Footers`, `Navigation Links`, and `Redirects` having unpublished draft changes
- `Media` items with missing storage objects, missing titles, or incomplete critical replacement guidance

Each queue item stores the source collection, source record, current reason, and a direct admin path back to the underlying document. Operators are expected to resolve the real source condition, then let the queue sync automatically.

Open or Blocked Approval and Publish Issue items prevent governed content from publishing. In Progress items do not block publication. Queue records are system-created and cannot be manually created or deleted.

## Step-By-Step Medical College Example

Triage a new admissions-related work item for North Valley Medical College:

1. Open `Action Queue`.
2. Filter to status `Open`.
3. Review the summary and source collection for the new item.
4. Open the queue record and confirm the `queueType`, `reasonCode`, and source details.
5. Set the `assignee` to the responsible operator.
6. Adjust `priority` or set a `dueDate` if the item is time-sensitive.
7. Add `operatorNotes` to capture the plan.
8. Follow the `sourceAdminPath` back to the underlying page, review, form submission, or media item.
9. Resolve the source condition.
10. Return to the queue item only if operational notes or a resolution summary are needed.

Expected website result:

- the underlying content or submission issue is handled faster
- queue items close or change automatically when the source condition is no longer active

## Best Practices

- treat the queue as a triage surface, not the source of truth
- change assignee, status, and notes in the queue, but resolve the real issue in the source record
- use priority carefully so urgent items stay visible
- add a concise resolution summary when an item was blocked, canceled, or resolved manually
- review queue items by source collection when investigating one part of the website

## Common Mistakes And Recovery

- trying to solve the issue only inside the queue without fixing the source record
- leaving items open after the source condition is already gone
- changing status without assigning an owner or recording context
- assuming every content change creates a queue item

If a queue item seems wrong, inspect the `Source` tab first, open the related document, and confirm whether the triggering condition still exists. If the source is already corrected, save the source again if needed and verify the queue sync has resolved the item.

## Related Guides

- [Form Submissions](./form-submissions.md)
- [Audit Log](./operational-audit-events.md)
- [Pages](./pages.md)
- [Users](./users.md)
