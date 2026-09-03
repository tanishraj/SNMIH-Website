# SNMIH Legal Pages Design

**Date:** 2026-08-31

## Summary

Provision minimal, CMS-managed Privacy Policy and Terms and Conditions Pages for the SNMIH
website. A one-time Payload migration creates and publishes either Page only when its canonical slug
does not already exist, then fills empty Site Identity legal relationships without overwriting an
editor's existing Page or relationship choice.

The public Pages cover only `snmih.in` website activity. They do not attempt to serve as a clinical
patient-record privacy notice, hospital consent form, admissions contract, or substitute for review
by qualified Indian legal counsel.

## Confirmed decisions

- Institution name: Shree Narayan Medical Institute and Hospital.
- Privacy and legal contact: `admission@snmih.in`.
- Effective date and last-updated date: 31 August 2026.
- Scope: website activity only.
- Canonical paths: `/privacy-policy` and `/terms-and-conditions`.
- Provisioning: a registered Payload migration.
- Existing matching Pages: preserve their content and publication state.
- Existing Site Identity legal relationships: preserve the editor's selection.
- Missing Pages: create and publish automatically.
- Missing legal relationships: connect to the matching existing or newly created Page.
- Git: implementation must not create commits.

## Goals

- Give visitors concise, readable website Privacy and Terms pages.
- Keep both documents editable through the normal Payload Page editor.
- Make the configured Privacy Page available to the consent banner and both legal Pages available to
  configured footer presets.
- Make provisioning safe to run in deployments where one or both Pages already exist.
- Correct the consent banner's handling of hierarchical Privacy Page paths.
- Keep the public design visually quiet and consistent with the current SNMIH theme.

## Non-goals

- A clinical or patient-record privacy notice.
- Consent for medical treatment, telemedicine, diagnostics, or hospital records.
- A binding admissions agreement or definitive statement of fees, eligibility, or seat availability.
- A cookie preference center or consent-management platform redesign.
- New Page fields, new block types, or a separate legal-content collection.
- Automatically applying the migration to a production database from this workspace.
- Deleting legal Pages during migration rollback.
- Resolving the other repository findings; those proceed as separate sequential projects.

## Legal and factual basis

The existing public site identifies the institution as Shree Narayan Medical Institute and Hospital,
publishes `admission@snmih.in`, and lists its address as Mahavir Nagar, Bherdhari, Saharsa 852201,
Bihar, on Bypass NH 107. See the [SNMIH contact page](https://snmih.in/contact-us/).

India's Digital Personal Data Protection Act, 2023 and Digital Personal Data Protection Rules, 2025
have a phased commencement schedule. The public copy therefore describes concrete website behavior
and rights "under applicable law" rather than claiming that every statutory provision is already in
force or promising compliance conclusions that require counsel. See the official
[MeitY DPDP Rules page](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?hl=en-US)
and [commencement notification](https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf).

The supplied copy is an implementation draft. Documentation must tell operators to obtain review by
qualified Indian legal counsel before treating it as the institution's final legal position.

## Page presentation

Each Page uses the existing public layout, global header, global footer, semantic theme tokens, and
Page block renderer. Its layout contains exactly two blocks:

1. A minimal Page Header with:
   - automatic breadcrumb as its top content;
   - the document title;
   - subtitle `Effective 31 August 2026 · Last updated 31 August 2026`;
   - page background and no border;
   - no image, actions, key facts, or decorative treatment.
2. One Rich Text block with:
   - `maxWidth: 'prose'`;
   - compact section padding;
   - page background and no border;
   - clear level-two section headings, short paragraphs, and restrained lists.

There is no standalone Breadcrumb block because the Page Header already owns the automatic
breadcrumb. There are no cards, sidebars, images, animation, calls to action, or additional client
components.

## Privacy Policy copy contract

The Privacy Policy title is `Privacy Policy`. Its SEO description is:

> Learn how Shree Narayan Medical Institute and Hospital handles information collected through the
> snmih.in website, forms, reviews, cookies, and consented analytics.

The Rich Text content follows this exact section order and meaning. Implementation may make minor
grammar corrections without changing the commitments.

### Introduction

This Privacy Policy explains how Shree Narayan Medical Institute and Hospital ("SNMIH", "we",
"our", or "us") handles personal information when a visitor uses `snmih.in`, submits a website
form, posts a review, or otherwise contacts SNMIH through the website.

The policy covers the website only. It is not SNMIH's clinical patient-record privacy notice and does
not describe how medical records are handled during hospital treatment. Visitors must not submit
medical records, diagnostic reports, payment-card details, or urgent medical information through a
general website form. In an emergency, visitors should contact local emergency services or go to an
appropriate emergency facility.

### Information we collect

- Information supplied by the visitor, including name, email address, telephone number, form
  responses, review content, and other information entered into a website form.
- Submission context supplied by the website, such as the source, campaign, landing page, and
  submission time.
- Technical information needed to operate and secure the website, which may include IP address,
  browser or device information, requested pages, referring page, timestamps, and server logs.
- Analytics and performance information only when the visitor has granted analytics consent through
  the website's consent banner.

### How we use information

SNMIH may use website information to respond to enquiries; handle admission, career, contact, and
other requested follow-up; store and moderate reviews; operate, secure, and troubleshoot the website;
measure and improve the website when analytics consent has been granted; prevent misuse; and meet
applicable legal obligations.

### Cookies and analytics

The website uses essential storage needed for site operation and saves the visitor's analytics choice.
Google Tag Manager or Google Analytics and Vercel Speed Insights load only after analytics consent is
granted. A visitor may reject analytics in the consent banner. To change a saved choice when no
preference control is visible, the visitor may clear the site's cookies and choose again on the next
visit.

### Sharing and service providers

SNMIH may share information with service providers that support hosting, infrastructure, email,
storage, analytics, security, and website operation; with professional advisers where reasonably
necessary; or with authorities when required by applicable law. Service providers may process
information only for the relevant service and subject to their contractual and legal obligations.
SNMIH does not sell personal information collected through the website.

### Retention and security

SNMIH keeps website information only for as long as reasonably necessary for the stated purpose,
operational records, dispute handling, security, and applicable legal requirements. The analytics
consent choice may remain in the browser for up to one year. SNMIH uses reasonable administrative and
technical safeguards, but no internet transmission or storage system can be guaranteed completely
secure.

### Visitor choices and requests

Subject to applicable law, a visitor may ask for information about website personal data associated
with them, request correction or deletion, withdraw a consent that applies to future processing, or
raise a grievance. Requests go to `admission@snmih.in`. SNMIH may need to verify the requester's
identity and may retain information when applicable law or a legitimate record-keeping need requires
it.

### Children

The website provides general institutional information and is not directed at young children. A
person under 18 should use a parent or guardian's assistance before submitting personal information.
SNMIH may request appropriate guardian involvement where required.

### External links

The website may link to external websites. Their operators control their own privacy practices, and
visitors should review those policies before providing information.

### Changes to this policy

SNMIH may update the policy when website practices or applicable requirements change. The Page shows
the effective and last-updated dates. Material changes apply from the updated effective date.

### Contact

Privacy questions and website-data requests may be sent to `admission@snmih.in` or addressed to
Shree Narayan Medical Institute and Hospital, Mahavir Nagar, Bherdhari, Saharsa 852201, Bihar, on
Bypass NH 107, India.

## Terms and Conditions copy contract

The Terms title is `Terms and Conditions`. Its SEO description is:

> Read the terms that govern use of the Shree Narayan Medical Institute and Hospital website at
> snmih.in.

The Rich Text content follows this exact section order and meaning. Implementation may make minor
grammar corrections without changing the commitments.

### Acceptance

These Terms and Conditions govern access to and use of `snmih.in`, operated by Shree Narayan Medical
Institute and Hospital ("SNMIH", "we", "our", or "us"). By using the website, a visitor agrees to
these Terms. A visitor who does not agree should stop using the website.

### Website information and medical disclaimer

The website provides general information about SNMIH, its educational programmes, facilities,
services, notices, and activities. It is not medical advice, diagnosis, treatment, an emergency
service, or a replacement for consultation with a qualified healthcare professional. A person with a
medical emergency should contact local emergency services or go to an appropriate emergency facility.

### Admissions, courses, fees, and notices

Admissions, eligibility, fees, seats, courses, schedules, facilities, and regulatory information may
change and may be subject to official authorities, published notifications, and separate written
terms. Website content is not an offer, admission guarantee, fee contract, or assurance of
availability. Applicants must confirm material information with SNMIH and the relevant official
authority before acting or paying money.

### Acceptable use

A visitor must use the website lawfully and must not interfere with its security or operation,
attempt unauthorised access, introduce malicious code, submit false or unlawful content, impersonate
another person, infringe another person's rights, or use the website in a way that harms SNMIH or
other users.

### Forms, reviews, and other submissions

A visitor is responsible for information they submit and must have the right to provide it. Submissions
must not contain unlawful, abusive, defamatory, infringing, confidential, or unnecessary medical
information. SNMIH may review, refuse, edit for moderation, unpublish, or remove submissions and does
not guarantee publication or a response. By submitting content intended for public display, the
visitor grants SNMIH a non-exclusive, royalty-free licence to host, reproduce, moderate, and display
that content for website operation and promotion of the relevant SNMIH service. This licence does not
transfer ownership of the visitor's content.

### Intellectual property

Unless stated otherwise, website text, branding, graphics, layout, and other materials are owned by
or licensed to SNMIH and are protected by applicable law. Visitors may view and make reasonable
personal, non-commercial use of the website. Other reproduction, publication, modification,
distribution, or commercial use requires prior permission from the relevant rights holder.

### External links

Links to external websites are provided for convenience. SNMIH does not control their content,
availability, security, or practices, and a link does not necessarily imply endorsement. Visitors use
external websites at their own discretion and subject to those websites' terms.

### Availability and disclaimers

SNMIH aims to keep website information useful and the service available, but does not guarantee that
all content is complete, current, error-free, uninterrupted, or free from harmful components. To the
extent permitted by applicable law, the website and its content are provided on an "as available"
basis. Nothing in these Terms excludes a responsibility that cannot lawfully be excluded.

### Limitation of liability

To the extent permitted by applicable law, SNMIH is not liable for indirect, incidental, or
consequential loss arising solely from use of, inability to use, or reliance on the website or an
external link. This limitation does not apply where liability cannot lawfully be limited.

### Privacy

SNMIH's Privacy Policy explains how website personal information is handled. The configured Privacy
Policy Page should be read with these Terms.

### Changes

SNMIH may update the website and these Terms. The Page shows the effective and last-updated dates.
Continued use after updated Terms take effect constitutes acceptance of the updated Terms.

### Governing law and jurisdiction

These Terms are governed by the laws of India. Subject to any mandatory dispute-resolution or
consumer-protection requirement, courts with jurisdiction in Saharsa, Bihar will have jurisdiction
over disputes relating to the website.

### Contact

Questions about these Terms may be sent to `admission@snmih.in` or addressed to Shree Narayan Medical
Institute and Hospital, Mahavir Nagar, Bherdhari, Saharsa 852201, Bihar, on Bypass NH 107, India.

## Payload migration design

Add and register `20260831_000000_provision_legal_pages` after the existing theme migration.

### Frozen seed definitions

The migration owns two immutable seed definitions containing:

- canonical slug;
- title;
- SEO description;
- minimal Page Header block;
- serialized Lexical Rich Text document;
- target Site Identity relationship field.

Keeping the definitions inside the dated migration prevents later Page recipe or component changes
from changing historical migration behavior.

### Up behavior

For each seed, the migration:

1. Queries Pages by exact slug with `depth: 0`, `draft: true`, `limit: 1`, `overrideAccess: true`,
   and the migration `req`, so an existing unpublished Page is preserved and reused.
2. If a matching Page exists, uses its ID without changing content, status, metadata, or versions.
3. If none exists, creates one Page with:
   - `_status: 'published'`;
   - `workflowState: 'published'`;
   - the frozen title, slug, SEO fields, and two-block layout;
   - `publishedAt` set to the migration time;
   - a concise `changeSummary` identifying system provisioning;
   - `overrideAccess: true` and the migration `req`.
4. Reads both the published Site Identity state (`draft: false`) and latest state (`draft: true`)
   with `depth: 0`, `overrideAccess: true`, and `req`.
5. Selects a legal relationship for migration only when that field is empty in both states. A
   populated published relationship or a populated pending relationship remains unchanged.
6. Uses the migration's MongoDB session to set only the selected relationship field or fields on
   the current `site-settings` global record and its `latest: true` version record. This mirrors the
   repository's existing version-aware theme migration pattern, preserves the draft's other fields
   and status, and avoids `payload.updateGlobal({ draft: false })`, which would otherwise build from
   the latest version and could publish unrelated pending Site Identity edits.

Page publishing normally requires a user with `publish_pages`. The migration therefore passes one
explicit, server-only context value: `context: { systemProvisioning:
'legal-pages-migration' }`. `enforceEditorialWorkflow` recognizes only that exact literal value and
accepts the migration's already-normalized published workflow fields. The bypass is narrow, named,
tested, and never exposed through an HTTP endpoint. Missing, boolean, or differently named context
values do not bypass the hook; all ordinary editor and API writes retain the existing workflow
contract.

All nested Local API calls include `req`; the two version-aware global writes receive the migration
`session`. The migration must not mutate `req.user`, fabricate a database user, directly write Page
documents or Page versions, or change any Site Identity field other than an eligible empty legal
relationship.

### Down behavior

`down` is intentionally non-destructive. It does not delete, trash, unpublish, or unlink either Page.
Once deployed, editors may have changed the content or legal relationships, and a migration cannot
reliably distinguish those changes from its own output. The non-reversible content decision is
documented in the migration and operator guidance.

## Hierarchical Privacy Page link

The public frontend layout currently derives the consent-banner URL as `/${page.slug}`. Replace that
logic with the existing `getPageHref(privacyPolicyPage)` helper. This makes a configured nested Page,
such as `/legal/privacy-policy`, resolve correctly while leaving top-level `/privacy-policy`
unchanged.

The footer already uses `getPageHref` and requires no rendering change.

## Operator documentation

Update maintained operator documentation to state:

- migrations provision missing legal Pages but never overwrite existing matching Pages;
- Site Identity → Legal selects which Pages the footer and consent banner use;
- editors can update policy content using the normal Page editor and publishing workflow;
- existing relationship choices are not replaced by the migration;
- changes to legal copy should update the displayed last-updated date;
- legal counsel must review policy content for the deployed institution and its actual practices;
- running `payload migrate:down` does not remove provisioned legal content.

The maintained feature inventory and project-context narrative should mention the two Page paths and
their configuration ownership only if the final source-derived context update requires it.

## Error handling and edge cases

- A missing Page is created once; repeated migration execution finds it by slug and does not duplicate
  it.
- An existing draft matching Page remains a draft and is connected only when the corresponding legal
  relationship is empty. Editors remain responsible for publishing that pre-existing draft.
- A relationship that points to a differently named Page is preserved.
- Failure during any Page or global write aborts the migration transaction rather than leaving a
  partially provisioned state.
- Public rendering remains safe when Site Identity has no legal relationships.
- The cookie banner omits its learn-more link when no populated Privacy Page can resolve to an href.
- No migration operation depends on a production-only ID, configured administrator, or current
  database contents beyond exact slug and relationship checks.

## Verification strategy

Focused tests cover:

1. Missing Page creation with published status, workflow state, exact slug, minimal two-block layout,
   effective date, email, website-only scope, and medical/emergency disclaimer.
2. Existing matching Page reuse without `payload.update` or content replacement.
3. Missing legal relationship updates and preservation of published and pending populated
   relationships.
4. `req` propagation for every `find`, `create`, and `findGlobal` operation, plus `session`
   propagation for both version-aware Site Identity writes.
5. The narrow system-provisioning workflow context and unchanged ordinary workflow enforcement.
6. Non-destructive `down` behavior.
7. Consent-banner URLs for top-level and nested Privacy Pages through `getPageHref`.
8. Page/block registration and public rendering contracts affected by the new seeded data.

After focused tests:

- run `pnpm project-context:update`;
- inspect the final diff against the change-impact map;
- run `pnpm project-context:check`;
- run TypeScript and lint;
- run the affected integration suite;
- run a production build when the environment can provide its required MongoDB configuration;
- do not execute the migration against a production database from this workspace;
- do not create a Git commit.

## Acceptance criteria

- A fresh deployment migration creates published `/privacy-policy` and `/terms-and-conditions` Pages.
- Both Pages use only a minimal Page Header and narrow Rich Text body.
- Both Pages show 31 August 2026 as effective and last updated.
- Privacy copy covers only website data and clearly excludes clinical records and emergencies.
- Terms copy clearly distinguishes website information from medical advice and official admissions or
  fee commitments.
- Existing matching Pages and populated Site Identity relationships remain unchanged.
- Empty legal relationships are connected to the corresponding Page.
- Policy content remains editable through Payload.
- The consent banner resolves hierarchical Privacy Page paths correctly.
- Migration operations are transactional through `req`, idempotent, and non-destructive on rollback.
- Documentation records the editor workflow and legal-review requirement.
- Focused tests, project-context checks, TypeScript, and lint pass.
- No production migration and no Git commit are performed.
