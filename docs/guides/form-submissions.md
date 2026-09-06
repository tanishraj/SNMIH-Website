# Form Submissions Guide

## What This Section Is

`Form Submissions` is the operational inbox for everything visitors have sent through the public website forms. This is not where the form is designed. It is where the received entry is reviewed, assigned, progressed, and closed.

In North Valley Medical College, this is where staff would handle incoming admissions enquiries, prospectus requests, and public review submissions.

## When To Use It

Use `Form Submissions` when you need to:

- review a new website submission
- assign an owner to handle the submission
- move the submission through follow-up states
- add internal notes for staff coordination
- verify whether a review submission created a linked draft review

Do not use this section to edit the original submitted answers. The stored submission payload is intentionally read-only after intake.

## How It Connects To The Website

Each record in `Form Submissions` comes from a real public website form submission. The frontend validates the submission, stores the submitted data, and saves useful intake metadata such as source, campaign, landing page, submitter name, submitter email, and submitter phone when available.

This section also powers internal workflow:

- statuses such as `New`, `In Review`, `Qualified`, `Won`, `Rejected`, and `Archived` track operational progress
- `owner` and `internalNotes` help staff manage follow-up
- review-intent submissions can automatically create a linked draft in `Reviews`
- new and in-review submissions automatically create or update items in `Work Queue`

If an operator changes status without discipline, the website will still work, but the lead and review pipeline becomes harder to manage safely.

## Step-By-Step Medical College Example

Handle a new `Admission Enquiry` submission for North Valley Medical College:

1. Open `Form Submissions`.
2. Sort or filter to find records with status `New`.
3. Open the incoming admissions submission.
4. Review the read-only submitted data and confirm the enquiry is valid.
5. Set the `owner` to the staff member responsible for follow-up.
6. Add `internalNotes` such as preferred callback timing or program interest context.
7. Change status from `New` to `In Review` while the admissions conversation is active.
8. Move the submission to `Qualified` once the lead is worth continued pursuit.
9. Move it to `Won`, `Rejected`, or `Archived` when the outcome is clear.

Expected website result:

- the public form continues working normally
- internal staff can see clear progress on the submission
- related `Action Queue` items open or resolve automatically based on submission status

## Best Practices

- treat submitted answers as intake evidence and keep them unchanged
- always assign an owner when a submission needs active follow-up
- use the searchable submitter phone field for callback workflows while treating the original submitted value as read-only evidence
- use internal notes for coordination, not for rewriting the original visitor message
- keep statuses current so the queue reflects real operational work
- check `linkedReview` and `promotionError` when the submission came from a review form

## Common Mistakes And Recovery

- trying to edit the original submitted payload instead of adding notes
- leaving high-value submissions unassigned
- closing a submission without enough internal context
- ignoring a review submission that failed promotion into `Reviews`

If a review submission did not flow correctly, inspect `promotionError`, open the linked review if one exists, and confirm the original form uses the correct review fields and intent.

## Related Guides

- [Forms](./forms.md)
- [Reviews](./reviews.md)
- [Work Queue](./work-queue.md)
- [Audit Log](./operational-audit-events.md)
