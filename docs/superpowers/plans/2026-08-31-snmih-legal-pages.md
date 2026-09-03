# SNMIH Legal Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provision editable, published Privacy Policy and Terms and Conditions Pages for `snmih.in`, connect empty Site Identity legal relationships, and make the consent banner resolve hierarchical Privacy Page paths safely.

**Architecture:** A registered, idempotent Payload migration owns frozen legal-copy seeds and creates only missing Pages. A narrowly named migration context allows only already-normalized legal-page publications through the existing editorial hook, while ordinary user/API workflow remains unchanged. Public presentation reuses the existing Page Header and Rich Text blocks, and Site Identity remains the editor-owned configuration surface.

**Tech Stack:** Payload CMS 3.85.2, MongoDB migrations, Next.js 16 App Router, React 19, TypeScript 5.7, Payload Lexical rich text, Vitest.

## Global Constraints

- Institution name is exactly `Shree Narayan Medical Institute and Hospital`.
- Website and legal contact email is exactly `admission@snmih.in`.
- Effective date and last-updated date are both `31 August 2026`.
- The Privacy Policy covers website activity only; it is not a clinical patient-record privacy notice.
- Canonical paths are exactly `/privacy-policy` and `/terms-and-conditions`.
- Existing matching Pages, including drafts, must not be edited, published, or replaced.
- Existing published or pending Site Identity legal relationship choices must not be replaced.
- Only empty legal relationship fields may be connected by the migration.
- The migration must pass its `req` to every nested Payload Local API operation.
- Rollback is intentionally non-destructive and must not unlink or delete legal content.
- Do not add a collection, global, field, block, client component, package, or generated Admin import.
- Do not run this migration against production from this workspace.
- Do not create, stage, or commit Git changes.

---

## File Structure

- `src/hooks/enforceEditorialWorkflow.ts` — recognizes the exact migration-only context and only for an already-published legal Page payload.
- `tests/int/editorial-workflow.int.spec.ts` — proves the exact context succeeds and all near-miss contexts retain ordinary workflow enforcement.
- `src/migrations/20260831_000000_provision_legal_pages.ts` — owns frozen copy, Lexical serialization, idempotent Page provisioning, and empty Site Identity relationship updates.
- `src/migrations/index.ts` — registers the legal Page migration after the existing theme migration.
- `tests/int/legal-pages-migration.int.spec.ts` — verifies copy, Page shape, idempotency, preservation, transaction propagation, registration, and no-op rollback.
- `src/app/(frontend)/layout.tsx` — resolves the consent link with the hierarchy-aware `getPageHref` helper.
- `tests/int/global-footer.int.spec.ts` — verifies the layout uses the helper and proves top-level/nested Page resolution.
- `docs/operations/developer-workflows.md` — documents deployment and editorial/legal-review operation.
- `docs/architecture/feature-inventory.md` — records the two migration-provisioned public Page paths and Site Identity ownership.
- `.agents/skills/project-context/references/project-inventory.json` — regenerated project inventory; change only through `pnpm project-context:update`.

### Task 1: Add the narrow legal-page provisioning context

**Files:**

- Modify: `tests/int/editorial-workflow.int.spec.ts`
- Modify: `src/hooks/enforceEditorialWorkflow.ts`

**Interfaces:**

- Consumes: existing `enforceEditorialWorkflow(publishCapability, sourceCollection?)` hook.
- Produces: exported literal `LEGAL_PAGES_MIGRATION_CONTEXT = 'legal-pages-migration'` and an exact context contract `{ systemProvisioning: LEGAL_PAGES_MIGRATION_CONTEXT }` for Task 2.

- [ ] **Step 1: Write the failing exact-context tests**

Append these tests inside `describe('editorial workflow guardrails', ...)` in `tests/int/editorial-workflow.int.spec.ts`:

```ts
it('allows an already-normalized published Page only for the exact legal migration context', async () => {
  const find = vi.fn(async () => ({ docs: [] }))
  const hook = enforceEditorialWorkflow('publish_pages', 'pages')

  await expect(
    hook({
      context: {
        systemProvisioning: 'legal-pages-migration',
      },
      data: {
        _status: 'published',
        changeSummary: 'Provisioned the website Privacy Policy.',
        publishedAt: '2026-08-31T00:00:00.000Z',
        workflowState: 'published',
      },
      operation: 'create',
      req: createReq(undefined, { find }),
    } as never),
  ).resolves.toEqual({
    _status: 'published',
    changeSummary: 'Provisioned the website Privacy Policy.',
    publishedAt: '2026-08-31T00:00:00.000Z',
    workflowState: 'published',
  })

  expect(find).not.toHaveBeenCalled()
})

it.each([
  ['missing context', undefined],
  ['boolean context', { systemProvisioning: true }],
  ['different context', { systemProvisioning: 'another-migration' }],
])('keeps ordinary publish enforcement for %s', async (_label, context) => {
  const hook = enforceEditorialWorkflow('publish_pages', 'pages')

  await expect(
    hook({
      context,
      data: {
        _status: 'published',
        workflowState: 'published',
      },
      operation: 'create',
      req: createReq(),
    } as never),
  ).rejects.toThrow('Only publishers and admins can move content to published.')
})

it('does not bypass workflow for a mismatched legal migration payload', async () => {
  const hook = enforceEditorialWorkflow('publish_pages', 'pages')

  await expect(
    hook({
      context: {
        systemProvisioning: 'legal-pages-migration',
      },
      data: {
        _status: 'published',
        workflowState: 'draft',
      },
      operation: 'create',
      req: createReq(),
    } as never),
  ).rejects.toThrow('Only publishers and admins can move content to published.')
})
```

- [ ] **Step 2: Run the focused test and confirm the new contract fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/editorial-workflow.int.spec.ts
```

Expected: the exact migration-context test fails because an anonymous request cannot currently publish.

- [ ] **Step 3: Implement the exact, already-normalized bypass**

In `src/hooks/enforceEditorialWorkflow.ts`, add the exported literal after the local types:

```ts
export const LEGAL_PAGES_MIGRATION_CONTEXT = 'legal-pages-migration' as const
```

Change the hook argument destructuring to include `context`, construct `nextData` first, and return it only for the exact context and exact published state pair:

```ts
  async ({ context, data, originalDoc, req }) => {
    const nextData: WorkflowDoc = {
      ...((data ?? {}) as Partial<WorkflowDoc>),
    }
    const isLegalPagesMigrationPublication =
      context?.systemProvisioning === LEGAL_PAGES_MIGRATION_CONTEXT &&
      nextData._status === 'published' &&
      nextData.workflowState === 'published'

    if (isLegalPagesMigrationPublication) {
      return nextData
    }

    const now = new Date().toISOString()
    const userID = normalizeUserID(req.user?.id)
```

Retain every existing branch after this insertion without changing capability checks, scheduling, queue blocking, metadata, or state normalization.

- [ ] **Step 4: Run the workflow tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/editorial-workflow.int.spec.ts
```

Expected: all editorial workflow tests pass, including the exact-context and near-miss cases.

- [ ] **Step 5: Review the Task 1 diff without staging or committing**

Run:

```bash
git diff -- src/hooks/enforceEditorialWorkflow.ts tests/int/editorial-workflow.int.spec.ts
```

Expected: only the narrow context contract and its tests appear.

### Task 2: Provision and register the two legal Pages

**Files:**

- Create: `tests/int/legal-pages-migration.int.spec.ts`
- Create: `src/migrations/20260831_000000_provision_legal_pages.ts`
- Modify: `src/migrations/index.ts`

**Interfaces:**

- Consumes: `LEGAL_PAGES_MIGRATION_CONTEXT` from Task 1; Payload `MigrateUpArgs`/`MigrateDownArgs`; existing `pages` and `site-settings` slugs.
- Produces: migration exports `up(args: MigrateUpArgs): Promise<void>` and `down(args: MigrateDownArgs): Promise<void>`, plus registry name `20260831_000000_provision_legal_pages`.

- [ ] **Step 1: Write the failing migration contract tests**

Create `tests/int/legal-pages-migration.int.spec.ts`:

```ts
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-mongodb'
import { describe, expect, it, vi } from 'vitest'

import { migrations } from '@/migrations'
import { down, up } from '@/migrations/20260831_000000_provision_legal_pages'

const createArgs = () => {
  const req = { id: 'legal-pages-migration-request' }
  const session = { id: 'legal-pages-migration-session' }
  const find = vi.fn()
  const create = vi.fn()
  const findGlobal = vi.fn()
  const updateGlobals = vi.fn().mockResolvedValue({ acknowledged: true })
  const updateVersions = vi.fn().mockResolvedValue({ acknowledged: true })
  const payload = {
    create,
    db: {
      globals: { updateMany: updateGlobals },
      versions: {
        'site-settings': { updateMany: updateVersions },
      },
    },
    find,
    findGlobal,
  }
  const args = { payload, req, session } as unknown as MigrateUpArgs

  return {
    args,
    create,
    find,
    findGlobal,
    payload,
    req,
    session,
    updateGlobals,
    updateVersions,
  }
}

describe('SNMIH legal Pages migration', () => {
  it('registers after the theme migration', () => {
    expect(migrations.map((migration) => migration.name)).toEqual([
      '20260829_000000_rename_snmih_theme_values',
      '20260831_000000_provision_legal_pages',
    ])
  })

  it('creates and publishes missing legal Pages with minimal website-only content', async () => {
    const { args, create, find, findGlobal, req, session, updateGlobals, updateVersions } =
      createArgs()
    find.mockResolvedValue({ docs: [] })
    create
      .mockResolvedValueOnce({ id: 'privacy-page-id' })
      .mockResolvedValueOnce({ id: 'terms-page-id' })
    findGlobal
      .mockResolvedValueOnce({
        privacyPolicyPage: null,
        termsAndConditionsPage: null,
      })
      .mockResolvedValueOnce({
        privacyPolicyPage: null,
        termsAndConditionsPage: null,
      })

    await up(args)

    expect(find).toHaveBeenCalledTimes(2)
    expect(find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: 'pages',
        depth: 0,
        draft: true,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        req,
        where: { slug: { equals: 'privacy-policy' } },
      }),
    )
    expect(find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: 'pages',
        depth: 0,
        draft: true,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        req,
        where: { slug: { equals: 'terms-and-conditions' } },
      }),
    )
    expect(create).toHaveBeenCalledTimes(2)

    for (const [callIndex, slug, title] of [
      [1, 'privacy-policy', 'Privacy Policy'],
      [2, 'terms-and-conditions', 'Terms and Conditions'],
    ] as const) {
      expect(create).toHaveBeenNthCalledWith(
        callIndex,
        expect.objectContaining({
          collection: 'pages',
          context: { systemProvisioning: 'legal-pages-migration' },
          data: expect.objectContaining({
            _status: 'published',
            layout: [
              expect.objectContaining({
                appearance: { background: 'none', border: 'none' },
                blockType: 'pageHeader',
                breadcrumbMode: 'automatic',
                subtitle: 'Effective 31 August 2026 · Last updated 31 August 2026',
                title,
                topContent: 'breadcrumb',
                variant: 'minimal',
              }),
              expect.objectContaining({
                appearance: { background: 'none', border: 'none' },
                blockType: 'richText',
                maxWidth: 'prose',
                size: 'compact',
              }),
            ],
            metaDescription: expect.any(String),
            slug,
            title,
            workflowState: 'published',
          }),
          depth: 0,
          draft: false,
          overrideAccess: true,
          req,
        }),
      )
    }

    const serializedCreates = JSON.stringify(create.mock.calls)
    expect(serializedCreates).toContain('admission@snmih.in')
    expect(serializedCreates).toContain('website only')
    expect(serializedCreates).toContain('clinical patient-record privacy notice')
    expect(serializedCreates).toContain('medical emergency')
    expect(serializedCreates).toContain('Admissions, eligibility, fees, seats')

    expect(findGlobal).toHaveBeenNthCalledWith(1, {
      depth: 0,
      draft: false,
      overrideAccess: true,
      req,
      slug: 'site-settings',
    })
    expect(findGlobal).toHaveBeenNthCalledWith(2, {
      depth: 0,
      draft: true,
      overrideAccess: true,
      req,
      slug: 'site-settings',
    })
    expect(updateGlobals).toHaveBeenCalledWith(
      { globalType: 'site-settings' },
      {
        $set: {
          privacyPolicyPage: 'privacy-page-id',
          termsAndConditionsPage: 'terms-page-id',
        },
      },
      { session },
    )
    expect(updateVersions).toHaveBeenCalledWith(
      { latest: true },
      {
        $set: {
          'version.privacyPolicyPage': 'privacy-page-id',
          'version.termsAndConditionsPage': 'terms-page-id',
        },
      },
      { session },
    )
  })

  it('reuses existing draft Pages and preserves existing legal relationships', async () => {
    const { args, create, find, findGlobal, updateGlobals, updateVersions } = createArgs()
    find
      .mockResolvedValueOnce({
        docs: [{ _status: 'draft', id: 'existing-privacy-page', slug: 'privacy-policy' }],
      })
      .mockResolvedValueOnce({
        docs: [{ _status: 'draft', id: 'existing-terms-page', slug: 'terms-and-conditions' }],
      })
    findGlobal
      .mockResolvedValueOnce({
        privacyPolicyPage: 'editor-selected-privacy-page',
        termsAndConditionsPage: 'editor-selected-terms-page',
      })
      .mockResolvedValueOnce({
        privacyPolicyPage: 'pending-privacy-page',
        termsAndConditionsPage: 'pending-terms-page',
      })

    await up(args)

    expect(create).not.toHaveBeenCalled()
    expect(updateGlobals).not.toHaveBeenCalled()
    expect(updateVersions).not.toHaveBeenCalled()
  })

  it('fills only fields empty in both published and pending Site Identity states', async () => {
    const { args, find, findGlobal, session, updateGlobals, updateVersions } = createArgs()
    find
      .mockResolvedValueOnce({ docs: [{ id: 'existing-privacy-page' }] })
      .mockResolvedValueOnce({ docs: [{ id: 'existing-terms-page' }] })
    findGlobal
      .mockResolvedValueOnce({
        privacyPolicyPage: null,
        termsAndConditionsPage: null,
      })
      .mockResolvedValueOnce({
        privacyPolicyPage: 'pending-privacy-page',
        termsAndConditionsPage: null,
      })

    await up(args)

    expect(updateGlobals).toHaveBeenCalledWith(
      { globalType: 'site-settings' },
      { $set: { termsAndConditionsPage: 'existing-terms-page' } },
      { session },
    )
    expect(updateVersions).toHaveBeenCalledWith(
      { latest: true },
      { $set: { 'version.termsAndConditionsPage': 'existing-terms-page' } },
      { session },
    )
  })

  it('keeps rollback non-destructive', async () => {
    const { args, payload } = createArgs()

    await down(args as unknown as MigrateDownArgs)

    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.find).not.toHaveBeenCalled()
    expect(payload.findGlobal).not.toHaveBeenCalled()
    expect(payload.db.globals.updateMany).not.toHaveBeenCalled()
    expect(payload.db.versions['site-settings'].updateMany).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the migration test and confirm it fails before the migration exists**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/legal-pages-migration.int.spec.ts
```

Expected: FAIL because the dated migration module and registry entry do not exist.

- [ ] **Step 3: Implement frozen Lexical helpers and seed types**

Create `src/migrations/20260831_000000_provision_legal_pages.ts` beginning with:

```ts
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-mongodb'
import type { RequiredDataFromCollectionSlug } from 'payload'

import { LEGAL_PAGES_MIGRATION_CONTEXT } from '@/hooks/enforceEditorialWorkflow'
import type { RichTextBlock } from '@/payload-types'

type LegalRelationshipField = 'privacyPolicyPage' | 'termsAndConditionsPage'
type LegalSection = {
  bullets?: readonly string[]
  heading: string
  paragraphs?: readonly string[]
}
type LegalPageSeed = {
  metaDescription: string
  relationshipField: LegalRelationshipField
  sections: readonly LegalSection[]
  slug: 'privacy-policy' | 'terms-and-conditions'
  title: 'Privacy Policy' | 'Terms and Conditions'
}
type LexicalChild = RichTextBlock['content']['root']['children'][number]

const EFFECTIVE_DATE_LINE = 'Effective 31 August 2026 · Last updated 31 August 2026'

const createTextNode = (text: string) => ({
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
  type: 'text',
  version: 1,
})

const createParagraphNode = (text: string): LexicalChild => ({
  children: [createTextNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  textStyle: '',
  type: 'paragraph',
  version: 1,
})

const createHeadingNode = (text: string): LexicalChild => ({
  children: [createTextNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  tag: 'h2',
  type: 'heading',
  version: 1,
})

const createBulletListNode = (items: readonly string[]): LexicalChild => ({
  children: items.map((text, index) => ({
    children: [createTextNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'listitem',
    value: index + 1,
    version: 1,
  })),
  direction: 'ltr',
  format: '',
  indent: 0,
  listType: 'bullet',
  start: 1,
  tag: 'ul',
  type: 'list',
  version: 1,
})

const buildRichTextContent = (sections: readonly LegalSection[]): RichTextBlock['content'] => ({
  root: {
    children: sections.flatMap((section) => [
      createHeadingNode(section.heading),
      ...(section.paragraphs ?? []).map(createParagraphNode),
      ...(section.bullets?.length ? [createBulletListNode(section.bullets)] : []),
    ]),
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
})
```

- [ ] **Step 4: Add the exact immutable Privacy Policy seed**

Continue the migration with this seed entry inside `const LEGAL_PAGE_SEEDS = [...] as const satisfies readonly LegalPageSeed[]`:

```ts
  {
    metaDescription:
      'Learn how Shree Narayan Medical Institute and Hospital handles information collected through the snmih.in website, forms, reviews, cookies, and consented analytics.',
    relationshipField: 'privacyPolicyPage',
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    sections: [
      {
        heading: 'Introduction',
        paragraphs: [
          'This Privacy Policy explains how Shree Narayan Medical Institute and Hospital ("SNMIH", "we", "our", or "us") handles personal information when a visitor uses snmih.in, submits a website form, posts a review, or otherwise contacts SNMIH through the website.',
          "This policy covers the website only. It is not SNMIH's clinical patient-record privacy notice and does not describe how medical records are handled during hospital treatment. Visitors must not submit medical records, diagnostic reports, payment-card details, or urgent medical information through a general website form. In an emergency, visitors should contact local emergency services or go to an appropriate emergency facility.",
        ],
      },
      {
        heading: 'Information we collect',
        bullets: [
          'Information supplied by the visitor, including name, email address, telephone number, form responses, review content, and other information entered into a website form.',
          'Submission context supplied by the website, such as the source, campaign, landing page, and submission time.',
          'Technical information needed to operate and secure the website, which may include IP address, browser or device information, requested pages, referring page, timestamps, and server logs.',
          "Analytics and performance information only when the visitor has granted analytics consent through the website's consent banner.",
        ],
      },
      {
        heading: 'How we use information',
        paragraphs: [
          'SNMIH may use website information to respond to enquiries; handle admission, career, contact, and other requested follow-up; store and moderate reviews; operate, secure, and troubleshoot the website; measure and improve the website when analytics consent has been granted; prevent misuse; and meet applicable legal obligations.',
        ],
      },
      {
        heading: 'Cookies and analytics',
        paragraphs: [
          "The website uses essential storage needed for site operation and saves the visitor's analytics choice. Google Tag Manager or Google Analytics and Vercel Speed Insights load only after analytics consent is granted. A visitor may reject analytics in the consent banner. To change a saved choice when no preference control is visible, the visitor may clear the site's cookies and choose again on the next visit.",
        ],
      },
      {
        heading: 'Sharing and service providers',
        paragraphs: [
          'SNMIH may share information with service providers that support hosting, infrastructure, email, storage, analytics, security, and website operation; with professional advisers where reasonably necessary; or with authorities when required by applicable law. Service providers may process information only for the relevant service and subject to their contractual and legal obligations. SNMIH does not sell personal information collected through the website.',
        ],
      },
      {
        heading: 'Retention and security',
        paragraphs: [
          'SNMIH keeps website information only for as long as reasonably necessary for the stated purpose, operational records, dispute handling, security, and applicable legal requirements. The analytics consent choice may remain in the browser for up to one year. SNMIH uses reasonable administrative and technical safeguards, but no internet transmission or storage system can be guaranteed completely secure.',
        ],
      },
      {
        heading: 'Visitor choices and requests',
        paragraphs: [
          "Subject to applicable law, a visitor may ask for information about website personal data associated with them, request correction or deletion, withdraw a consent that applies to future processing, or raise a grievance. Requests go to admission@snmih.in. SNMIH may need to verify the requester's identity and may retain information when applicable law or a legitimate record-keeping need requires it.",
        ],
      },
      {
        heading: 'Children',
        paragraphs: [
          "The website provides general institutional information and is not directed at young children. A person under 18 should use a parent or guardian's assistance before submitting personal information. SNMIH may request appropriate guardian involvement where required.",
        ],
      },
      {
        heading: 'External links',
        paragraphs: [
          'The website may link to external websites. Their operators control their own privacy practices, and visitors should review those policies before providing information.',
        ],
      },
      {
        heading: 'Changes to this policy',
        paragraphs: [
          'SNMIH may update the policy when website practices or applicable requirements change. The Page shows the effective and last-updated dates. Material changes apply from the updated effective date.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'Privacy questions and website-data requests may be sent to admission@snmih.in or addressed to Shree Narayan Medical Institute and Hospital, Mahavir Nagar, Bherdhari, Saharsa 852201, Bihar, on Bypass NH 107, India.',
        ],
      },
    ],
  },
```

- [ ] **Step 5: Add the exact immutable Terms and Conditions seed**

Add the second entry to the same `LEGAL_PAGE_SEEDS` array:

```ts
  {
    metaDescription:
      'Read the terms that govern use of the Shree Narayan Medical Institute and Hospital website at snmih.in.',
    relationshipField: 'termsAndConditionsPage',
    slug: 'terms-and-conditions',
    title: 'Terms and Conditions',
    sections: [
      {
        heading: 'Acceptance',
        paragraphs: [
          'These Terms and Conditions govern access to and use of snmih.in, operated by Shree Narayan Medical Institute and Hospital ("SNMIH", "we", "our", or "us"). By using the website, a visitor agrees to these Terms. A visitor who does not agree should stop using the website.',
        ],
      },
      {
        heading: 'Website information and medical disclaimer',
        paragraphs: [
          'The website provides general information about SNMIH, its educational programmes, facilities, services, notices, and activities. It is not medical advice, diagnosis, treatment, an emergency service, or a replacement for consultation with a qualified healthcare professional. A person with a medical emergency should contact local emergency services or go to an appropriate emergency facility.',
        ],
      },
      {
        heading: 'Admissions, courses, fees, and notices',
        paragraphs: [
          'Admissions, eligibility, fees, seats, courses, schedules, facilities, and regulatory information may change and may be subject to official authorities, published notifications, and separate written terms. Website content is not an offer, admission guarantee, fee contract, or assurance of availability. Applicants must confirm material information with SNMIH and the relevant official authority before acting or paying money.',
        ],
      },
      {
        heading: 'Acceptable use',
        paragraphs: [
          "A visitor must use the website lawfully and must not interfere with its security or operation, attempt unauthorised access, introduce malicious code, submit false or unlawful content, impersonate another person, infringe another person's rights, or use the website in a way that harms SNMIH or other users.",
        ],
      },
      {
        heading: 'Forms, reviews, and other submissions',
        paragraphs: [
          "A visitor is responsible for information they submit and must have the right to provide it. Submissions must not contain unlawful, abusive, defamatory, infringing, confidential, or unnecessary medical information. SNMIH may review, refuse, edit for moderation, unpublish, or remove submissions and does not guarantee publication or a response. By submitting content intended for public display, the visitor grants SNMIH a non-exclusive, royalty-free licence to host, reproduce, moderate, and display that content for website operation and promotion of the relevant SNMIH service. This licence does not transfer ownership of the visitor's content.",
        ],
      },
      {
        heading: 'Intellectual property',
        paragraphs: [
          'Unless stated otherwise, website text, branding, graphics, layout, and other materials are owned by or licensed to SNMIH and are protected by applicable law. Visitors may view and make reasonable personal, non-commercial use of the website. Other reproduction, publication, modification, distribution, or commercial use requires prior permission from the relevant rights holder.',
        ],
      },
      {
        heading: 'External links',
        paragraphs: [
          "Links to external websites are provided for convenience. SNMIH does not control their content, availability, security, or practices, and a link does not necessarily imply endorsement. Visitors use external websites at their own discretion and subject to those websites' terms.",
        ],
      },
      {
        heading: 'Availability and disclaimers',
        paragraphs: [
          'SNMIH aims to keep website information useful and the service available, but does not guarantee that all content is complete, current, error-free, uninterrupted, or free from harmful components. To the extent permitted by applicable law, the website and its content are provided on an "as available" basis. Nothing in these Terms excludes a responsibility that cannot lawfully be excluded.',
        ],
      },
      {
        heading: 'Limitation of liability',
        paragraphs: [
          'To the extent permitted by applicable law, SNMIH is not liable for indirect, incidental, or consequential loss arising solely from use of, inability to use, or reliance on the website or an external link. This limitation does not apply where liability cannot lawfully be limited.',
        ],
      },
      {
        heading: 'Privacy',
        paragraphs: [
          "SNMIH's Privacy Policy explains how website personal information is handled. The configured Privacy Policy Page should be read with these Terms.",
        ],
      },
      {
        heading: 'Changes',
        paragraphs: [
          'SNMIH may update the website and these Terms. The Page shows the effective and last-updated dates. Continued use after updated Terms take effect constitutes acceptance of the updated Terms.',
        ],
      },
      {
        heading: 'Governing law and jurisdiction',
        paragraphs: [
          'These Terms are governed by the laws of India. Subject to any mandatory dispute-resolution or consumer-protection requirement, courts with jurisdiction in Saharsa, Bihar will have jurisdiction over disputes relating to the website.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'Questions about these Terms may be sent to admission@snmih.in or addressed to Shree Narayan Medical Institute and Hospital, Mahavir Nagar, Bherdhari, Saharsa 852201, Bihar, on Bypass NH 107, India.',
        ],
      },
    ],
  },
] as const satisfies readonly LegalPageSeed[]
```

- [ ] **Step 6: Build the exact minimal Page data and migration operations**

Complete `src/migrations/20260831_000000_provision_legal_pages.ts` with:

```ts
const buildLegalPageData = (
  seed: LegalPageSeed,
  publishedAt: string,
): RequiredDataFromCollectionSlug<'pages'> => ({
  _status: 'published',
  changeSummary: `Provisioned the website ${seed.title}.`,
  generateSlug: false,
  includeInSitemap: 'include',
  layout: [
    {
      actionPlacement: 'side',
      appearance: { background: 'none', border: 'none' },
      blockType: 'pageHeader',
      breadcrumbMode: 'automatic',
      contentAlignment: 'left',
      contentWidth: 'default',
      height: 'default',
      size: 'default',
      subtitle: EFFECTIVE_DATE_LINE,
      title: seed.title,
      topContent: 'breadcrumb',
      variant: 'minimal',
    },
    {
      appearance: { background: 'none', border: 'none' },
      blockType: 'richText',
      content: buildRichTextContent(seed.sections),
      maxWidth: 'prose',
      size: 'compact',
    },
  ],
  metaDescription: seed.metaDescription,
  metaTitle: seed.title,
  publishedAt,
  robotsMode: 'index',
  slug: seed.slug,
  title: seed.title,
  workflowState: 'published',
})

export async function up({ payload, req, session }: MigrateUpArgs): Promise<void> {
  const publishedAt = new Date().toISOString()
  const pageIDs = new Map<LegalRelationshipField, string>()

  for (const seed of LEGAL_PAGE_SEEDS) {
    const existingPages = await payload.find({
      collection: 'pages',
      depth: 0,
      draft: true,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: {
        slug: {
          equals: seed.slug,
        },
      },
    })

    const existingPage = existingPages.docs[0]
    const pageID = existingPage
      ? existingPage.id
      : (
          await payload.create({
            collection: 'pages',
            context: {
              systemProvisioning: LEGAL_PAGES_MIGRATION_CONTEXT,
            },
            data: buildLegalPageData(seed, publishedAt),
            depth: 0,
            draft: false,
            overrideAccess: true,
            req,
          })
        ).id

    pageIDs.set(seed.relationshipField, pageID)
  }

  const [publishedSiteSettings, latestSiteSettings] = await Promise.all([
    payload.findGlobal({
      slug: 'site-settings',
      depth: 0,
      draft: false,
      overrideAccess: true,
      req,
    }),
    payload.findGlobal({
      slug: 'site-settings',
      depth: 0,
      draft: true,
      overrideAccess: true,
      req,
    }),
  ])
  const currentUpdates: Partial<Record<LegalRelationshipField, string>> = {}
  const versionUpdates: Record<string, string> = {}

  for (const seed of LEGAL_PAGE_SEEDS) {
    if (
      publishedSiteSettings[seed.relationshipField] != null ||
      latestSiteSettings[seed.relationshipField] != null
    ) {
      continue
    }

    const pageID = pageIDs.get(seed.relationshipField)

    if (!pageID) {
      throw new Error(`Missing provisioned Page ID for ${seed.relationshipField}.`)
    }

    currentUpdates[seed.relationshipField] = pageID
    versionUpdates[`version.${seed.relationshipField}`] = pageID
  }

  if (Object.keys(currentUpdates).length === 0) return

  // The adapter and Mongoose currently resolve different transitive MongoDB
  // ClientSession type identities. The migration supplies the same runtime
  // session to both models, so narrow the duplicate-driver type at this edge.
  const sessionOptions = { session: session as never }

  await Promise.all([
    payload.db.globals.updateMany(
      { globalType: 'site-settings' },
      { $set: currentUpdates },
      sessionOptions,
    ),
    payload.db.versions['site-settings'].updateMany(
      { latest: true },
      { $set: versionUpdates },
      sessionOptions,
    ),
  ])
}

export async function down(args: MigrateDownArgs): Promise<void> {
  // Intentionally non-destructive: editors may have revised or reconfigured this content.
  void args
}
```

- [ ] **Step 7: Register the migration after the existing theme migration**

Update `src/migrations/index.ts` to exactly:

```ts
import * as migration_20260829_000000_rename_snmih_theme_values from './20260829_000000_rename_snmih_theme_values'
import * as migration_20260831_000000_provision_legal_pages from './20260831_000000_provision_legal_pages'

export const migrations = [
  {
    up: migration_20260829_000000_rename_snmih_theme_values.up,
    down: migration_20260829_000000_rename_snmih_theme_values.down,
    name: '20260829_000000_rename_snmih_theme_values',
  },
  {
    up: migration_20260831_000000_provision_legal_pages.up,
    down: migration_20260831_000000_provision_legal_pages.down,
    name: '20260831_000000_provision_legal_pages',
  },
]
```

- [ ] **Step 8: Run the focused workflow and migration tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/editorial-workflow.int.spec.ts tests/int/legal-pages-migration.int.spec.ts
```

Expected: PASS. Keep any MongoDB driver type narrowing at the two migration model-call boundaries,
matching the existing theme migration; do not weaken Payload or generated types globally.

- [ ] **Step 9: Review the migration diff without running it or committing**

Run:

```bash
git diff -- src/migrations src/hooks/enforceEditorialWorkflow.ts tests/int/editorial-workflow.int.spec.ts tests/int/legal-pages-migration.int.spec.ts
```

Expected: two new dated files/contracts and one registry entry; no production data operation has run.

### Task 3: Fix the consent banner's hierarchical Privacy Page URL

**Files:**

- Modify: `tests/int/global-footer.int.spec.ts`
- Modify: `src/app/(frontend)/layout.tsx`

**Interfaces:**

- Consumes: existing `getPageHref(page)` from `src/lib/pagePaths.ts`.
- Produces: `privacyPolicyUrl: string | null` that includes populated parent slugs.

- [ ] **Step 1: Write the failing source-wiring and hierarchy test**

In `tests/int/global-footer.int.spec.ts`, import the helper:

```ts
import { getPageHref } from '@/lib/pagePaths'
```

Add this test:

```ts
it('resolves top-level and nested Privacy Page paths with the shared hierarchy helper', () => {
  const legalParent = {
    id: 'legal-parent',
    parent: null,
    slug: 'legal',
    title: 'Legal',
  }
  const privacyPage = {
    id: 'privacy-page',
    parent: null,
    slug: 'privacy-policy',
    title: 'Privacy Policy',
  }

  expect(getPageHref(privacyPage as never)).toBe('/privacy-policy')
  expect(getPageHref({ ...privacyPage, parent: legalParent } as never)).toBe(
    '/legal/privacy-policy',
  )
})
```

Inside the existing `fetches and renders the active footer preset in the frontend shell` test, add:

```ts
expect(layoutSource).toContain("import { getPageHref } from '@/lib/pagePaths'")
expect(layoutSource).toContain('const privacyPolicyUrl = getPageHref(privacyPolicyPage) ?? null')
expect(layoutSource).not.toContain('`/${(privacyPolicyPage as Page).slug}`')
```

- [ ] **Step 2: Run the test and confirm the layout-source assertion fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/global-footer.int.spec.ts
```

Expected: FAIL because the layout still builds the URL from the leaf slug only.

- [ ] **Step 3: Use `getPageHref` in the frontend layout**

In `src/app/(frontend)/layout.tsx`:

```ts
import { getPageHref } from '@/lib/pagePaths'
import type { Footer, Header } from '@/payload-types'
```

Replace the current ternary URL construction with:

```ts
const privacyPolicyUrl = getPageHref(privacyPolicyPage) ?? null
```

Do not change the footer props or cookie-consent component.

- [ ] **Step 4: Run the frontend wiring test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/global-footer.int.spec.ts
```

Expected: PASS for both top-level and nested paths.

- [ ] **Step 5: Review the Task 3 diff without staging or committing**

Run:

```bash
git diff -- 'src/app/(frontend)/layout.tsx' tests/int/global-footer.int.spec.ts
```

Expected: one shared-helper import, one URL expression, removal of the unused `Page` type, and focused tests.

### Task 4: Document legal-page ownership and safe operation

**Files:**

- Modify: `docs/operations/developer-workflows.md`
- Modify: `docs/architecture/feature-inventory.md`

**Interfaces:**

- Consumes: migration behavior from Task 2 and Site Identity legal relationships already present in Payload.
- Produces: operator instructions for deployment, editing, review, and rollback.

- [ ] **Step 1: Add the exact Legal Pages operator section**

Insert this section in `docs/operations/developer-workflows.md` before `## Office Migration`:

```md
## Legal Pages

The checked-in Payload migration `20260831_000000_provision_legal_pages` provisions published
`/privacy-policy` and `/terms-and-conditions` Pages only when those exact slugs do not already exist.
It connects only empty relationships under **Site Identity → Legal**. Existing Pages—including
drafts—and existing published or pending relationship choices remain unchanged.

After deployment:

1. review both Pages with qualified Indian legal counsel against the institution's actual website
   and data practices
2. edit copy through **Content → Pages** and use the normal editorial publishing workflow
3. select the public Pages under **Site Identity → Legal** if a different relationship is required
4. update the displayed last-updated date whenever legal copy changes
5. verify the configured footer and Cookie Consent Banner link to the intended Pages

The draft copy covers website activity only. It is not a clinical patient-record privacy notice,
medical consent form, or admissions contract. Migration rollback is intentionally non-destructive:
`payload migrate:down` does not unlink or delete provisioned legal content. Export the database and
confirm `MONGODB_URI` targets the intended environment before running deployment migrations.
```

- [ ] **Step 2: Record the migration-provisioned routes in the feature inventory**

In `docs/architecture/feature-inventory.md`, add these rows immediately after the catch-all Page row in the Public Routes table:

```md
| `/privacy-policy` | Migration-provisioned editable Page selected under Site Identity → Legal for footer and consent links |
| `/terms-and-conditions` | Migration-provisioned editable Page selected under Site Identity → Legal for footer links |
```

Keep the existing Site Identity global responsibility row because it already correctly owns legal Page relationships.

- [ ] **Step 3: Verify the documentation contract**

Run:

```bash
rg -n "Legal Pages|privacy-policy|terms-and-conditions|qualified Indian legal counsel|migrate:down" docs/operations/developer-workflows.md docs/architecture/feature-inventory.md
```

Expected: both paths, editor ownership, legal-review warning, and non-destructive rollback are present.

### Task 5: Format, regenerate project context, and run the full verification gate

**Files:**

- Potential generated update: `.agents/skills/project-context/references/project-inventory.json`
- Verify only: `src/payload-types.ts`

**Interfaces:**

- Consumes: all changes from Tasks 1–4 and repository project-context workflow.
- Produces: formatted, type-safe, tested, documented, uncommitted legal-page implementation.

- [ ] **Step 1: Format only the touched implementation files**

Run:

```bash
pnpm exec prettier --write src/hooks/enforceEditorialWorkflow.ts tests/int/editorial-workflow.int.spec.ts src/migrations/20260831_000000_provision_legal_pages.ts src/migrations/index.ts tests/int/legal-pages-migration.int.spec.ts 'src/app/(frontend)/layout.tsx' tests/int/global-footer.int.spec.ts docs/operations/developer-workflows.md docs/architecture/feature-inventory.md docs/superpowers/specs/2026-08-31-snmih-legal-pages-design.md docs/superpowers/plans/2026-08-31-snmih-legal-pages.md
```

Expected: Prettier completes without touching unrelated files.

- [ ] **Step 2: Run the focused test set together**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/editorial-workflow.int.spec.ts tests/int/legal-pages-migration.int.spec.ts tests/int/global-footer.int.spec.ts
```

Expected: all focused tests pass.

- [ ] **Step 3: Run Payload type generation and inspect generated-type stability**

Run:

```bash
pnpm generate:types
git diff -- src/payload-types.ts
```

Expected: type generation passes and `src/payload-types.ts` has no semantic change because no Payload schema changed.

- [ ] **Step 4: Run static checks**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
git diff --check
```

Expected: TypeScript passes, lint has no new errors, and the diff has no whitespace errors. Any pre-existing warning must be reported separately rather than hidden.

- [ ] **Step 5: Run the complete integration suite**

Run:

```bash
pnpm test:int
```

Expected: all runnable integration tests pass. If the sandbox prevents MongoDB Memory Server from binding or downloading, preserve the exact failure and rerun with the approved environment permissions; do not point tests at production.

- [ ] **Step 6: Run the required project-context update/check loop**

Run:

```bash
pnpm project-context:update
git diff -- .agents/skills/project-context/references/project-inventory.json
pnpm project-context:check
```

Expected: inventory reflects the new migration/test/docs facts, the context check passes, and only a stale knowledge-graph commit warning may remain. Inspect the final diff against `.agents/skills/project-context/references/change-impact-map.md`; do not rewrite historical specs or unrelated narrative.

- [ ] **Step 7: Run a production build only with a safe configured development/test database**

Run:

```bash
pnpm build
```

Expected: PASS when the required non-production `MONGODB_URI`, Payload secret, and runtime configuration are available. If they are not available, report the environment blocker without modifying `.env`, exposing secret values, or connecting to production.

- [ ] **Step 8: Perform the final no-commit safety review**

Run:

```bash
git status --short
git diff --stat
git diff --check
```

Expected: all intended source, test, documentation, spec/plan, and generated project-context changes remain uncommitted; no secret or `.env` content appears; no migration has been executed against a database.
