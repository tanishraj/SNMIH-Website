# Forms Guide

## What This Section Is

`Forms` defines public form schemas, success copy, notification recipients, intent, and optional submitter confirmation. Pages expose these through the dedicated `Contact Form` and `Review Submission` blocks; there is no generic form block.

In North Valley Medical College, this is the section you would use for forms such as `Admission Enquiry`, `Request Prospectus`, or `Student Experience Review`.

## When To Use It

Use `Forms` when you need to:

- collect information from website visitors
- configure a Form selected by Contact Form or Review Submission
- decide whether submissions behave like general enquiries, leads, or review intake
- notify internal staff when a valid submission arrives

Do not use `Forms` to manage the received entries themselves. That belongs in `Form Submissions`.

## How It Connects To The Website

Only published Forms are loaded by `POST /api/forms/[slug]/submit`. Contact Form accepts a general/lead Form with the expected `name` text, `email` email, `subject` select, and `message` textarea fields. Review Submission accepts review-intent Forms and review field names.

This section also controls downstream operations:

- `submissionIntent` decides whether the submission is handled as general intake, a lead, or a review
- notification recipients receive internal alerts when valid submissions arrive
- form fields define what data is stored in `Form Submissions`
- review-intent forms can automatically create or update a linked draft in `Reviews`

If a form is misconfigured, the website may show the wrong questions, reject valid submissions, or send incomplete data into your intake workflow.

## Step-By-Step Medical College Example

Create an `Admission Enquiry` form for North Valley Medical College:

1. Open `Forms`.
2. Click `Create New`.
3. Enter the title `Admission Enquiry`.
4. Confirm the slug is clear and stable, such as `admission-enquiry`.
5. Set `Submission Intent` to `Lead`.
6. Set the submit button label to `Request a Call Back`.
7. Write a success message such as `Thanks. Our admissions team will contact you shortly.`
8. Add one or more notification recipients from the admissions office.
9. Add fields such as `full_name`, `email`, `phone`, `program_interest`, and `message`.
10. Mark the required fields clearly.
11. Save the form and publish it.
12. Ensure the schema matches Contact Form, then add that block to a Page and select `Admission Enquiry`.

Expected website result:

- visitors can submit an admissions enquiry from the public page
- the CMS stores the submission automatically
- the admissions team can review it in `Form Submissions`

## Submitter Confirmation Email

Each form can optionally send an automatic confirmation email to the person who submitted it. Enable this under **Submitter Confirmation** when the visitor should receive an immediate acknowledgment.

To configure it:

1. Open the form.
2. Expand the **Submitter Confirmation** section.
3. Turn on `Send confirmation email to submitter`.
4. Enter an email subject such as `We have received your enquiry`.
5. Write a plain-text message body confirming receipt and next steps.
6. Save and publish the form.

The CMS looks for a submitted email using the normalized keys `submitterEmail`, then `reviewerEmail`, then `email`. If none exists, no confirmation is sent even when enabled.

## Spam Protection And Failure Handling

- the hidden honeypot key is `website`; suspected bots receive a neutral success response
- the built-in limiter allows five attempts per IP and form slug per ten minutes
- the limiter is in-memory and per application process, not a durable distributed rate limiter
- required, email, select-option, and checkbox-acceptance rules come from the Form schema
- notification, confirmation, downstream-event, and review-promotion failures are logged without changing a successful visitor response after the submission is stored

## Best Practices

- keep field names machine-safe and stable because they are used in stored submission data
- use clear labels that non-technical operators can understand later
- choose the correct `submissionIntent` before launch because it affects downstream handling
- keep success messages short and reassuring
- add notification recipients only when someone is expected to monitor them
- write confirmation email messages in plain language that reassures the submitter about next steps

## Common Mistakes And Recovery

- selecting a Form whose fields do not match Contact Form or Review Submission
- using vague field names that make submission data hard to understand later
- choosing `General` when the form should really be treated as a lead workflow
- publishing a review-intent form without checking that the required review fields are included

If submissions are not behaving as expected, first review the form field definitions, `submissionIntent`, and notification recipients. Then submit a real frontend test entry and inspect the result in `Form Submissions`.

## Related Guides

- [Pages](./pages.md)
- [Form Submissions](./form-submissions.md)
- [Reviews](./reviews.md)
- [Work Queue](./work-queue.md)
