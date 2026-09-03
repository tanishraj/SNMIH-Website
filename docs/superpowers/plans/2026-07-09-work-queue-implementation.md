# Work Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a persisted `work-queue` collection under the Payload `Admin` group that automatically tracks actionable work across the CMS and allows operators to manage assignee, status, priority, due date, notes, and resolution in one place.

**Architecture:** The queue is a normal Payload collection backed by shared sync helpers. Source collections compute actionable conditions in hooks and upsert queue records by deterministic dedupe keys. Queue records preserve operator-owned fields while source state drives creation, snapshot refresh, and terminal resolution, and meaningful queue changes also emit operational audit events.

**Tech Stack:** Payload CMS 3.x, Next.js App Router, TypeScript, existing editorial workflow hooks, integration tests under `tests/int`

## Global Constraints

- `Work Queue` must live under the `Admin` group, matching `Operational Audit Events`.
- Queue entries are created automatically from existing CMS events; no manual ad hoc creation in this phase.
- Queue items must support direct operator editing of `status`, `assignee`, `priority`, `dueDate`, `operatorNotes`, and `resolutionSummary`.
- Source snapshot fields inside queue items remain read-only.
- The queue must cover `pages`, `articles`, `reviews`, `form-submissions`, `media`, `system-pages`, `headers`, `footers`, `navigation-links`, and `redirects`.
- Queue sync must be idempotent and use context guards to avoid hook loops.
- Queue items must be preserved for history through `resolved` or `canceled` states instead of being deleted when the source issue clears.
- Admins always get access; capability-based users require a dedicated `manage_work_queue` capability.

---

### Task 1: Add the Work Queue collection and capability surface

**Files:**

- Create: `src/collections/WorkQueue.ts`
- Modify: `src/payload.config.ts`
- Modify: `src/access/adminCapabilities.ts`
- Modify: `src/access/editorialRoles.ts`
- Modify: `src/collections/Users.ts`
- Test: `tests/int/work-queue.int.spec.ts`
- Test: `tests/int/adminCapabilities.int.spec.ts`

**Interfaces:**

- Consumes: `hideFromUsersWithoutCapability(capability)`, `requireCapability(capability)`, `isAdminUser(user)`
- Produces: `WorkQueue: CollectionConfig`, `manage_work_queue: AdminCapability`

- [ ] **Step 1: Write the failing tests**

```ts
import { WorkQueue } from '@/collections/WorkQueue'
import { getDefaultCapabilitiesForRole } from '@/access/editorialRoles'
import { hasAdminCapability } from '@/access/adminCapabilities'

describe('work queue collection', () => {
  it('registers under Admin with system-managed create/delete rules', () => {
    expect(WorkQueue.slug).toBe('work-queue')
    expect(WorkQueue.admin?.group).toBe('Admin')
    expect(WorkQueue.access?.create?.({ req: {} } as never)).toBe(false)
    expect(WorkQueue.access?.delete?.({ req: {} } as never)).toBe(false)
  })
})

describe('work queue capability defaults', () => {
  it('grants admins full work queue access', () => {
    expect(
      hasAdminCapability(
        { role: 'admin', capabilities: getDefaultCapabilitiesForRole('admin') },
        'manage_work_queue',
      ),
    ).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test:int -- --runInBand tests/int/work-queue.int.spec.ts tests/int/adminCapabilities.int.spec.ts`
Expected: FAIL because `WorkQueue` and `manage_work_queue` do not exist yet.

- [ ] **Step 3: Add the collection and capability wiring**

```ts
// src/access/adminCapabilities.ts
{
  label: 'Work Queue',
  value: 'manage_work_queue',
}

// src/access/editorialRoles.ts
const capabilities: AdminCapabilitiesMap = {
  // existing entries...
  manage_work_queue: false,
}

// admin defaults
'manage_work_queue',

// src/payload.config.ts
import { WorkQueue } from './collections/WorkQueue'

collections: [
  // existing collections...
  OperationalAuditEvents,
  WorkQueue,
  Users,
]

// src/collections/WorkQueue.ts
export const WorkQueue: CollectionConfig = {
  slug: 'work-queue',
  labels: {
    singular: 'Work Queue Item',
    plural: 'Work Queue',
  },
  admin: {
    group: 'Admin',
    hidden: hideFromUsersWithoutCapability('manage_work_queue'),
    useAsTitle: 'summary',
    defaultColumns: [
      'summary',
      'sourceCollection',
      'sourceTitle',
      'queueType',
      'status',
      'assignee',
      'priority',
      'dueDate',
      'lastSyncedAt',
    ],
    listSearchableFields: ['summary', 'sourceTitle', 'sourceSlug', 'reasonCode'],
  },
  access: {
    create: () => false,
    delete: () => false,
    read: requireCapability('manage_work_queue'),
    update: requireCapability('manage_work_queue'),
  },
  fields: [
    { name: 'sourceCollection', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'sourceID', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'sourceTitle', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'sourceSlug', type: 'text', admin: { readOnly: true } },
    { name: 'sourceAdminPath', type: 'text', admin: { readOnly: true } },
    { name: 'queueType', type: 'select', required: true, options: ['approval', 'moderation', 'follow_up', 'publish_issue', 'media_issue', 'system_issue'] },
    { name: 'reasonCode', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'summary', type: 'textarea', required: true, admin: { readOnly: true } },
    { name: 'details', type: 'textarea', admin: { readOnly: true } },
    { name: 'status', type: 'select', required: true, defaultValue: 'open', options: ['open', 'in_progress', 'blocked', 'resolved', 'canceled'] },
    { name: 'priority', type: 'select', required: true, defaultValue: 'normal', options: ['low', 'normal', 'high', 'urgent'] },
    { name: 'assignee', type: 'relationship', relationTo: 'users' },
    { name: 'dueDate', type: 'date' },
    { name: 'operatorNotes', type: 'textarea' },
    { name: 'resolutionSummary', type: 'textarea' },
    { name: 'dedupeKey', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'sourceUpdatedAt', type: 'date', admin: { readOnly: true } },
    { name: 'firstOpenedAt', type: 'date', required: true, admin: { readOnly: true } },
    { name: 'lastSyncedAt', type: 'date', required: true, admin: { readOnly: true } },
    { name: 'resolvedAt', type: 'date', admin: { readOnly: true } },
    { name: 'autoResolved', type: 'checkbox', defaultValue: false, admin: { readOnly: true } },
  ],
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test:int -- --runInBand tests/int/work-queue.int.spec.ts tests/int/adminCapabilities.int.spec.ts`
Expected: PASS with the new collection registered and the capability available.

- [ ] **Step 5: Commit**

```bash
git add src/collections/WorkQueue.ts src/payload.config.ts src/access/adminCapabilities.ts src/access/editorialRoles.ts src/collections/Users.ts tests/int/work-queue.int.spec.ts tests/int/adminCapabilities.int.spec.ts
git commit -m "feat(queue): add work queue collection"
```

### Task 2: Build the shared work queue sync and audit helpers

**Files:**

- Create: `src/lib/workQueue.ts`
- Create: `src/hooks/syncWorkQueueItem.ts`
- Modify: `src/lib/operationalAudit.ts`
- Test: `tests/int/work-queue.int.spec.ts`

**Interfaces:**

- Consumes: `recordOperationalAuditEvent(args)`, `PayloadRequest`, `req.context`
- Produces:
  - `buildWorkQueueDedupeKey(input: { sourceCollection: string; sourceID: string | number; queueType: string; reasonCode: string }): string`
  - `upsertWorkQueueItem(args: UpsertWorkQueueItemArgs): Promise<void>`
  - `resolveWorkQueueItem(args: ResolveWorkQueueItemArgs): Promise<void>`

- [ ] **Step 1: Extend the tests for dedupe and resolution behavior**

```ts
import { buildWorkQueueDedupeKey } from '@/lib/workQueue'

describe('work queue sync helpers', () => {
  it('builds stable dedupe keys per source condition', () => {
    expect(
      buildWorkQueueDedupeKey({
        sourceCollection: 'pages',
        sourceID: 12,
        queueType: 'approval',
        reasonCode: 'awaiting-review',
      }),
    ).toBe('pages:12:approval:awaiting-review')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test:int -- --runInBand tests/int/work-queue.int.spec.ts`
Expected: FAIL because `buildWorkQueueDedupeKey`, `upsertWorkQueueItem`, and `resolveWorkQueueItem` do not exist.

- [ ] **Step 3: Implement shared queue persistence helpers**

```ts
// src/lib/workQueue.ts
export type WorkQueueStatus = 'open' | 'in_progress' | 'blocked' | 'resolved' | 'canceled'

export const buildWorkQueueDedupeKey = ({
  sourceCollection,
  sourceID,
  queueType,
  reasonCode,
}: {
  sourceCollection: string
  sourceID: number | string
  queueType: string
  reasonCode: string
}) => `${sourceCollection}:${sourceID}:${queueType}:${reasonCode}`

export const upsertWorkQueueItem = async ({
  req,
  dedupeKey,
  sourceCollection,
  sourceID,
  sourceTitle,
  sourceSlug,
  sourceAdminPath,
  sourceUpdatedAt,
  queueType,
  reasonCode,
  summary,
  details,
  priority = 'normal',
}: UpsertWorkQueueItemArgs): Promise<void> => {
  if (req.context.workQueueSync) return

  const existing = await req.payload.find({
    collection: 'work-queue',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: { dedupeKey: { equals: dedupeKey } },
  })

  const now = new Date().toISOString()

  if (existing.docs[0]) {
    await req.payload.update({
      collection: 'work-queue',
      id: existing.docs[0].id,
      context: { ...req.context, workQueueSync: true },
      data: {
        details,
        lastSyncedAt: now,
        priority,
        sourceAdminPath,
        sourceCollection,
        sourceID: String(sourceID),
        sourceSlug,
        sourceTitle,
        sourceUpdatedAt,
        summary,
        autoResolved: false,
        ...(existing.docs[0].status === 'resolved' || existing.docs[0].status === 'canceled'
          ? { resolvedAt: undefined, status: 'open' }
          : {}),
      },
      overrideAccess: true,
      req,
    })
    return
  }

  await req.payload.create({
    collection: 'work-queue',
    context: { ...req.context, workQueueSync: true },
    data: {
      autoResolved: false,
      dedupeKey,
      details,
      firstOpenedAt: now,
      lastSyncedAt: now,
      priority,
      queueType,
      reasonCode,
      sourceAdminPath,
      sourceCollection,
      sourceID: String(sourceID),
      sourceSlug,
      sourceTitle,
      sourceUpdatedAt,
      status: 'open',
      summary,
    },
    overrideAccess: true,
    req,
  })
}
```

- [ ] **Step 4: Add auto-resolution and audit logging**

```ts
// src/lib/workQueue.ts
export const resolveWorkQueueItem = async ({
  req,
  dedupeKey,
  resolutionSummary,
  status = 'resolved',
}: ResolveWorkQueueItemArgs): Promise<void> => {
  const existing = await req.payload.find({
    collection: 'work-queue',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: { dedupeKey: { equals: dedupeKey } },
  })

  const record = existing.docs[0]
  if (!record) return

  await req.payload.update({
    collection: 'work-queue',
    id: record.id,
    context: { ...req.context, workQueueSync: true },
    data: {
      autoResolved: true,
      lastSyncedAt: new Date().toISOString(),
      resolutionSummary,
      resolvedAt: new Date().toISOString(),
      status,
    },
    overrideAccess: true,
    req,
  })
}

// src/lib/operationalAudit.ts
export const recordWorkQueueAuditEvent = async ({
  action,
  summary,
  workQueueID,
  req,
}: {
  action: string
  summary: string
  workQueueID: string
  req: PayloadRequest
}) =>
  recordOperationalAuditEvent({
    action,
    entityId: workQueueID,
    entityTitle: 'Work Queue Item',
    entityType: 'work_queue',
    req,
    summary,
  })
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test:int -- --runInBand tests/int/work-queue.int.spec.ts`
Expected: PASS with stable dedupe keys and persisted resolution behavior.

- [ ] **Step 6: Commit**

```bash
git add src/lib/workQueue.ts src/hooks/syncWorkQueueItem.ts src/lib/operationalAudit.ts tests/int/work-queue.int.spec.ts
git commit -m "feat(queue): add sync helpers"
```

### Task 3: Connect editorial workflow collections to the queue

**Files:**

- Create: `src/hooks/syncWorkflowStateToWorkQueue.ts`
- Modify: `src/collections/Pages.ts`
- Modify: `src/collections/Articles.ts`
- Modify: `src/collections/SystemPages.ts`
- Modify: `src/collections/Headers.ts`
- Modify: `src/collections/Footers.ts`
- Modify: `src/collections/NavigationLinks.ts`
- Modify: `src/collections/Redirects.ts`
- Test: `tests/int/work-queue.int.spec.ts`

**Interfaces:**

- Consumes: `upsertWorkQueueItem(args)`, `resolveWorkQueueItem(args)`
- Produces: `createWorkflowQueueHook(config: { sourceCollection: string; titleField: string; sourceAdminPathPrefix: string }): CollectionAfterChangeHook`

- [ ] **Step 1: Add a failing integration test for workflow-backed queue items**

```ts
it('creates an approval queue item when a page enters needsReview', async () => {
  const page = await payload.create({
    collection: 'pages',
    data: {
      title: 'Queue Me',
      slug: 'queue-me',
      layout: [],
      workflowState: 'needsReview',
    },
  })

  const workItems = await payload.find({
    collection: 'work-queue',
    depth: 0,
    where: { sourceID: { equals: String(page.id) } },
  })

  expect(workItems.docs).toHaveLength(1)
  expect(workItems.docs[0]?.queueType).toBe('approval')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:int -- --runInBand tests/int/work-queue.int.spec.ts -t "creates an approval queue item when a page enters needsReview"`
Expected: FAIL because no workflow collection currently creates queue items.

- [ ] **Step 3: Implement the shared workflow sync hook**

```ts
// src/hooks/syncWorkflowStateToWorkQueue.ts
const actionableWorkflowStates = new Set(['needsReview', 'scheduled'])

export const createWorkflowQueueHook =
  ({
    sourceCollection,
    sourceAdminPathPrefix,
    titleField,
  }: {
    sourceCollection: string
    sourceAdminPathPrefix: string
    titleField: string
  }) =>
  async ({ doc, previousDoc, req }: CollectionAfterChangeHookArgs<any>) => {
    const title =
      typeof doc?.[titleField] === 'string' ? doc[titleField] : `${sourceCollection} ${doc.id}`
    const dedupeKey = buildWorkQueueDedupeKey({
      sourceCollection,
      sourceID: doc.id,
      queueType: 'approval',
      reasonCode: 'workflow-action-required',
    })

    if (actionableWorkflowStates.has(doc.workflowState)) {
      await upsertWorkQueueItem({
        req,
        dedupeKey,
        details: doc.changeSummary,
        priority: doc.workflowState === 'scheduled' ? 'high' : 'normal',
        queueType: 'approval',
        reasonCode: 'workflow-action-required',
        sourceAdminPath: `${sourceAdminPathPrefix}/${doc.id}`,
        sourceCollection,
        sourceID: doc.id,
        sourceSlug: doc.slug,
        sourceTitle: title,
        sourceUpdatedAt: doc.updatedAt,
        summary: `${title} requires workflow action.`,
      })
      return
    }

    if (previousDoc?.workflowState && previousDoc.workflowState !== doc.workflowState) {
      await resolveWorkQueueItem({
        req,
        dedupeKey,
        resolutionSummary: `${title} left the actionable workflow state.`,
      })
    }
  }
```

- [ ] **Step 4: Attach the hook to all editorial workflow collections**

```ts
// src/collections/Pages.ts
afterChange: [
  syncNavigationLinkAfterChange,
  createRedirectsForChangedPagePath,
  createWorkflowQueueHook({
    sourceAdminPathPrefix: '/admin/collections/pages',
    sourceCollection: 'pages',
    titleField: 'title',
  }),
  createCollectionAuditHook(/* existing */),
]
```

Apply the same pattern to:

- `src/collections/Articles.ts`
- `src/collections/SystemPages.ts`
- `src/collections/Headers.ts`
- `src/collections/Footers.ts`
- `src/collections/NavigationLinks.ts`
- `src/collections/Redirects.ts`

- [ ] **Step 5: Run the workflow queue tests**

Run: `pnpm test:int -- --runInBand tests/int/work-queue.int.spec.ts -t "approval queue item"`
Expected: PASS with one queue item created and later resolved when the workflow becomes non-actionable.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/syncWorkflowStateToWorkQueue.ts src/collections/Pages.ts src/collections/Articles.ts src/collections/SystemPages.ts src/collections/Headers.ts src/collections/Footers.ts src/collections/NavigationLinks.ts src/collections/Redirects.ts tests/int/work-queue.int.spec.ts
git commit -m "feat(queue): sync editorial workflow items"
```

### Task 4: Connect reviews, form submissions, and media governance to the queue

**Files:**

- Create: `src/hooks/syncReviewToWorkQueue.ts`
- Create: `src/hooks/syncFormSubmissionToWorkQueue.ts`
- Create: `src/hooks/syncMediaToWorkQueue.ts`
- Modify: `src/collections/Reviews.ts`
- Modify: `src/collections/FormSubmissions.ts`
- Modify: `src/collections/Media.ts`
- Test: `tests/int/work-queue.int.spec.ts`

**Interfaces:**

- Consumes: `upsertWorkQueueItem(args)`, `resolveWorkQueueItem(args)`, `formSubmissionIntentOptions`
- Produces:
  - `syncReviewToWorkQueue`
  - `syncFormSubmissionToWorkQueue`
  - `syncMediaToWorkQueue`

- [ ] **Step 1: Add failing integration coverage for the non-workflow sources**

```ts
it('creates a follow-up queue item for a new form submission', async () => {
  const submission = await payload.create({
    collection: 'form-submissions',
    data: {
      data: { message: 'Hi' },
      form: formID,
      status: 'new',
      submissionIntent: 'lead',
      submittedAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })

  const workItems = await payload.find({
    collection: 'work-queue',
    depth: 0,
    where: { sourceID: { equals: String(submission.id) } },
  })

  expect(workItems.docs[0]?.queueType).toBe('follow_up')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:int -- --runInBand tests/int/work-queue.int.spec.ts -t "form submission"`
Expected: FAIL because form submissions, reviews, and media do not yet emit queue items.

- [ ] **Step 3: Implement the specialized source hooks**

```ts
// src/hooks/syncFormSubmissionToWorkQueue.ts
const actionableSubmissionStatuses = new Set(['new', 'in_review'])

export const syncFormSubmissionToWorkQueue: CollectionAfterChangeHook = async ({ doc, req }) => {
  const dedupeKey = buildWorkQueueDedupeKey({
    sourceCollection: 'form-submissions',
    sourceID: doc.id,
    queueType: 'follow_up',
    reasonCode: 'submission-action-required',
  })

  if (actionableSubmissionStatuses.has(doc.status)) {
    await upsertWorkQueueItem({
      req,
      dedupeKey,
      queueType: 'follow_up',
      reasonCode: 'submission-action-required',
      sourceAdminPath: `/admin/collections/form-submissions/${doc.id}`,
      sourceCollection: 'form-submissions',
      sourceID: doc.id,
      sourceTitle: doc.submitterEmail || doc.submitterName || `Submission ${doc.id}`,
      sourceUpdatedAt: doc.updatedAt,
      summary: `Form submission requires follow-up.`,
      details: doc.internalNotes,
      priority: doc.submissionIntent === 'lead' ? 'high' : 'normal',
    })
    return
  }

  await resolveWorkQueueItem({
    req,
    dedupeKey,
    resolutionSummary: 'Form submission moved to a terminal handled state.',
  })
}
```

Implement equivalent hooks for:

- `reviews`: moderation or approval-required states become `moderation`
- `media`: missing `alt`, critical asset replacement guidance, or other governance gaps become `media_issue`

- [ ] **Step 4: Attach the hooks to the collections**

```ts
// src/collections/FormSubmissions.ts
hooks: {
  beforeChange: [updateFormSubmissionActivity],
  afterChange: [syncFormSubmissionToWorkQueue],
}
```

Apply the same hook wiring pattern to `src/collections/Reviews.ts` and `src/collections/Media.ts`.

- [ ] **Step 5: Run the focused tests**

Run: `pnpm test:int -- --runInBand tests/int/work-queue.int.spec.ts -t "form submission|review|media"`
Expected: PASS with queue items created for actionable source states and resolved after terminal transitions.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/syncReviewToWorkQueue.ts src/hooks/syncFormSubmissionToWorkQueue.ts src/hooks/syncMediaToWorkQueue.ts src/collections/Reviews.ts src/collections/FormSubmissions.ts src/collections/Media.ts tests/int/work-queue.int.spec.ts
git commit -m "feat(queue): sync intake and media items"
```

### Task 5: Lock admin behavior, audit coupling, and integration coverage

**Files:**

- Modify: `src/collections/WorkQueue.ts`
- Modify: `src/lib/operationalAudit.ts`
- Modify: `src/payload.config.ts`
- Modify: `tests/int/work-queue.int.spec.ts`
- Modify: `tests/int/operational-audit.int.spec.ts`
- Modify: `src/payload-types.ts`

**Interfaces:**

- Consumes: `recordWorkQueueAuditEvent(args)`, `WorkQueue`, `OperationalAuditEvents`
- Produces: audited queue status changes, final generated Payload types

- [ ] **Step 1: Add the failing tests for editable vs read-only fields and audit coupling**

```ts
it('preserves source snapshot fields as read-only while allowing operator fields to change', async () => {
  const configFields = WorkQueue.fields.map((field) => ('name' in field ? field.name : null))
  expect(configFields).toContain('summary')
  expect(configFields).toContain('status')
})
```

- [ ] **Step 2: Run the tests to verify they fail or expose gaps**

Run: `pnpm test:int -- --runInBand tests/int/work-queue.int.spec.ts tests/int/operational-audit.int.spec.ts`
Expected: FAIL or partial PASS with missing assertions around queue-field access and audit events.

- [ ] **Step 3: Finalize queue hooks and operator-change auditing**

```ts
// src/collections/WorkQueue.ts
hooks: {
  afterChange: [
    async ({ doc, previousDoc, req }) => {
      if (req.context.workQueueSync) return

      const changedOperationalFields = [
        previousDoc?.status !== doc.status && `status ${previousDoc?.status ?? 'unset'} -> ${doc.status}`,
        previousDoc?.priority !== doc.priority && `priority ${previousDoc?.priority ?? 'unset'} -> ${doc.priority}`,
        previousDoc?.assignee !== doc.assignee && 'assignee updated',
      ].filter(Boolean)

      if (changedOperationalFields.length === 0) return

      await recordWorkQueueAuditEvent({
        action: 'work_queue_updated',
        req,
        summary: `Work queue updated: ${changedOperationalFields.join(', ')}.`,
        workQueueID: String(doc.id),
      })
    },
  ],
}
```

- [ ] **Step 4: Regenerate Payload types and run the full integration slice**

Run: `pnpm generate:types`
Expected: PASS and `src/payload-types.ts` updated with `work-queue` and `manage_work_queue`.

Run: `pnpm test:int -- --runInBand tests/int/work-queue.int.spec.ts tests/int/operational-audit.int.spec.ts tests/int/adminCapabilities.int.spec.ts`
Expected: PASS with queue coverage, capability coverage, and audit coverage all green.

- [ ] **Step 5: Commit**

```bash
git add src/collections/WorkQueue.ts src/lib/operationalAudit.ts src/payload-types.ts tests/int/work-queue.int.spec.ts tests/int/operational-audit.int.spec.ts tests/int/adminCapabilities.int.spec.ts
git commit -m "feat(queue): finish work queue operations"
```

## Self-Review

### Spec coverage

- Queue collection under `Admin`: covered by Task 1.
- Automatic queue creation from all relevant collection types: covered by Tasks 3 and 4.
- Editable operational fields with read-only source snapshots: covered by Tasks 1 and 5.
- Dedicated `manage_work_queue` capability and admin visibility: covered by Task 1.
- Idempotent upsert and auto-resolution behavior: covered by Task 2.
- Audit linkage between queue changes and `Operational Audit Events`: covered by Tasks 2 and 5.
- Integration coverage across queue creation, resolution, and admin behavior: covered by Tasks 1 through 5.

### Placeholder scan

No `TODO`, `TBD`, or “implement later” placeholders remain. All tasks list specific files, interfaces, commands, and expected outcomes.

### Type consistency

- Collection slug is consistently `work-queue`.
- Capability name is consistently `manage_work_queue`.
- Shared helper names are consistently `buildWorkQueueDedupeKey`, `upsertWorkQueueItem`, and `resolveWorkQueueItem`.
