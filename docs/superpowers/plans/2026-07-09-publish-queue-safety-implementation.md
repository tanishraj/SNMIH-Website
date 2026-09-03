# Publish Queue Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent `pages`, `articles`, `reviews`, and `system-pages` from moving to `published` while matching blocking Work Queue items still exist.

**Architecture:** Extend the existing `enforceEditorialWorkflow` hook so queue-based publish safety stays in the same decision path as capability and schedule enforcement. Add one focused `workQueue` query helper that finds blocking queue items by source identity, blocking statuses, and blocking queue types, then surface a human-readable `APIError` before publish metadata is stamped.

**Tech Stack:** Payload CMS 3.x, TypeScript, existing `enforceEditorialWorkflow` hook, `work-queue` collection, Vitest integration specs under `tests/int`

## Global Constraints

- The guard applies only when the next workflow state is `published`.
- The guard applies only to `pages`, `articles`, `reviews`, and `system-pages`.
- Blocking statuses are `open` and `blocked`.
- Non-blocking statuses are `in_progress`, `resolved`, and `canceled`.
- Blocking queue types are `approval` and `publish_issue`.
- Non-blocking queue types in this phase are `moderation`, `follow_up`, `media_issue`, and `system_issue`.
- Scheduling must remain allowed even when blocking queue items exist.
- The publish error must include the first blocking summary and mention additional blockers when present.

---

### Task 1: Add blocking Work Queue lookup helpers

**Files:**
- Modify: `src/lib/workQueue.ts`
- Test: `tests/int/work-queue.int.spec.ts`

**Interfaces:**
- Consumes: `PayloadRequest`, existing `WorkQueueStatus`, `WorkQueueType`
- Produces:
  - `findBlockingPublishQueueItems(args: { req: PayloadRequest; sourceCollection: string; sourceID: string | number }): Promise<WorkQueueRecord[]>`
  - `formatBlockingPublishQueueMessage(items: Array<{ summary?: string | null }>): string`

- [ ] **Step 1: Write the failing helper tests**

```ts
import {
  findBlockingPublishQueueItems,
  formatBlockingPublishQueueMessage,
} from '@/lib/workQueue'

it('formats one blocking queue summary into a publish-safe error message', () => {
  expect(
    formatBlockingPublishQueueMessage([
      {
        summary: 'Homepage is awaiting editorial approval.',
      },
    ]),
  ).toBe(
    'Cannot publish because Work Queue still has a blocking item: "Homepage is awaiting editorial approval.". Resolve it in Work Queue before publishing.',
  )
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test:int -- --runInBand tests/int/work-queue.int.spec.ts`
Expected: FAIL because the blocking query helper and formatter do not exist.

- [ ] **Step 3: Implement the blocking-item query helper**

```ts
// src/lib/workQueue.ts
const blockingPublishStatuses: WorkQueueStatus[] = ['open', 'blocked']
const blockingPublishQueueTypes: WorkQueueType[] = ['approval', 'publish_issue']

export const findBlockingPublishQueueItems = async ({
  req,
  sourceCollection,
  sourceID,
}: {
  req: PayloadRequest
  sourceCollection: string
  sourceID: number | string
}): Promise<WorkQueueRecord[]> => {
  const result = await req.payload.find({
    collection: 'work-queue',
    depth: 0,
    limit: 10,
    overrideAccess: true,
    req,
    sort: 'summary',
    where: {
      and: [
        {
          sourceCollection: {
            equals: sourceCollection,
          },
        },
        {
          sourceID: {
            equals: String(sourceID),
          },
        },
        {
          status: {
            in: blockingPublishStatuses,
          },
        },
        {
          queueType: {
            in: blockingPublishQueueTypes,
          },
        },
      ],
    },
  })

  return result.docs as WorkQueueRecord[]
}
```

- [ ] **Step 4: Implement the blocking message formatter**

```ts
// src/lib/workQueue.ts
export const formatBlockingPublishQueueMessage = (
  items: Array<{
    summary?: string | null
  }>,
): string => {
  const [first, ...rest] = items
  const firstSummary = first?.summary || 'Unresolved publish blocker'

  if (rest.length === 0) {
    return `Cannot publish because Work Queue still has a blocking item: "${firstSummary}". Resolve it in Work Queue before publishing.`
  }

  return `Cannot publish because Work Queue still has blocking items: "${firstSummary}" and ${rest.length} more. Resolve them in Work Queue before publishing.`
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test:int -- --runInBand tests/int/work-queue.int.spec.ts`
Expected: PASS with blocking query helpers and formatter covered.

- [ ] **Step 6: Commit**

```bash
git add src/lib/workQueue.ts tests/int/work-queue.int.spec.ts
git commit -m "feat(queue): add publish blocker helpers"
```

### Task 2: Extend editorial workflow enforcement with queue publish safety

**Files:**
- Modify: `src/hooks/enforceEditorialWorkflow.ts`
- Test: `tests/int/editorial-workflow.int.spec.ts`

**Interfaces:**
- Consumes:
  - `findBlockingPublishQueueItems(args)`
  - `formatBlockingPublishQueueMessage(items)`
- Produces:
  - `enforceEditorialWorkflow(publishCapability, sourceCollection?)`

- [ ] **Step 1: Write the failing workflow tests**

```ts
it('blocks publish when an open approval queue item exists', async () => {
  const hook = enforceEditorialWorkflow('publish_pages', 'pages')

  await expect(
    hook({
      data: {
        workflowState: 'published',
      },
      operation: 'update',
      originalDoc: {
        _status: 'draft',
        id: 7,
        workflowState: 'in_review',
      },
      req: {
        payload: {
          find: async () => ({
            docs: [
              {
                summary: 'Homepage is awaiting editorial approval.',
              },
            ],
          }),
        },
        user: {
          id: 2,
          role: 'publisher',
          capabilities: {
            publish_pages: true,
          },
        },
      },
    } as never),
  ).rejects.toThrow('Cannot publish because Work Queue still has a blocking item')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test:int -- --runInBand tests/int/editorial-workflow.int.spec.ts`
Expected: FAIL because `enforceEditorialWorkflow` does not yet check `work-queue`.

- [ ] **Step 3: Extend the hook signature and document shape**

```ts
// src/hooks/enforceEditorialWorkflow.ts
type WorkflowDoc = {
  id?: number | string | null
  _status?: DocStatus | null
  changeSummary?: string | null
  lastReviewedAt?: string | null
  lastReviewedBy?: number | null
  publishedAt?: string | null
  publishedBy?: number | null
  scheduledPublishAt?: string | null
  workflowState?: EditorialWorkflowState | null
}

export const enforceEditorialWorkflow =
  (
    publishCapability: PublishCapability,
    sourceCollection?: 'pages' | 'articles' | 'reviews' | 'system-pages',
  ): CollectionBeforeChangeHook<WorkflowDoc> =>
```

- [ ] **Step 4: Add the publish blocker check only for final publish**

```ts
// src/hooks/enforceEditorialWorkflow.ts
if (nextState === 'scheduled') {
  if (!nextData.scheduledPublishAt) {
    throw new APIError('Scheduled content requires scheduledPublishAt.', 400)
  }

  nextData._status = 'draft'
  return nextData
}

if (nextState === 'published' || nextState === 'reverted') {
  const sourceID = nextData.id ?? originalDoc?.id

  if (sourceCollection && sourceID != null && nextState === 'published') {
    const blockingItems = await findBlockingPublishQueueItems({
      req,
      sourceCollection,
      sourceID,
    })

    if (blockingItems.length > 0) {
      throw new APIError(formatBlockingPublishQueueMessage(blockingItems), 400)
    }
  }

  nextData._status = 'published'
  nextData.publishedAt = now
  nextData.publishedBy = userID
  nextData.scheduledPublishAt = null
  return nextData
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test:int -- --runInBand tests/int/editorial-workflow.int.spec.ts`
Expected: PASS for direct publish, schedule, and queue-block guard behavior.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/enforceEditorialWorkflow.ts tests/int/editorial-workflow.int.spec.ts
git commit -m "feat(queue): block publish on queue items"
```

### Task 3: Wire collection callers to the collection-aware workflow guard

**Files:**
- Modify: `src/collections/Pages.ts`
- Modify: `src/collections/Articles.ts`
- Modify: `src/collections/Reviews.ts`
- Modify: `src/collections/SystemPages.ts`
- Test: `tests/int/editorial-workflow.int.spec.ts`

**Interfaces:**
- Consumes: `enforceEditorialWorkflow(publishCapability, sourceCollection)`
- Produces: collection-level queue-aware publish enforcement

- [ ] **Step 1: Add the failing collection config assertions**

```ts
import { Articles } from '@/collections/Articles'
import { Pages } from '@/collections/Pages'
import { Reviews } from '@/collections/Reviews'
import { SystemPages } from '@/collections/SystemPages'

it('keeps publishable collections on the queue-aware workflow hook', () => {
  expect(Pages.hooks?.beforeChange).toBeDefined()
  expect(Articles.hooks?.beforeChange).toBeDefined()
  expect(Reviews.hooks?.beforeChange).toBeDefined()
  expect(SystemPages.hooks?.beforeChange).toBeDefined()
})
```

- [ ] **Step 2: Run tests to verify they fail or expose gaps**

Run: `pnpm test:int -- --runInBand tests/int/editorial-workflow.int.spec.ts`
Expected: FAIL or reveal that the collection callers still use the old one-argument workflow hook.

- [ ] **Step 3: Update collection hook calls**

```ts
// src/collections/Pages.ts
enforceEditorialWorkflow('publish_pages', 'pages')

// src/collections/Articles.ts
enforceEditorialWorkflow('publish_articles', 'articles')

// src/collections/Reviews.ts
enforceEditorialWorkflow('publish_reviews', 'reviews')

// src/collections/SystemPages.ts
enforceEditorialWorkflow('publish_system_pages', 'system-pages')
```

- [ ] **Step 4: Re-run the workflow tests**

Run: `pnpm test:int -- --runInBand tests/int/editorial-workflow.int.spec.ts`
Expected: PASS with collection callers now opting into queue-aware publish safety.

- [ ] **Step 5: Commit**

```bash
git add src/collections/Pages.ts src/collections/Articles.ts src/collections/Reviews.ts src/collections/SystemPages.ts tests/int/editorial-workflow.int.spec.ts
git commit -m "feat(queue): wire publish safety into content collections"
```

### Task 4: Regenerate types and run the focused verification set

**Files:**
- Modify: `src/payload-types.ts`
- Test: `tests/int/work-queue.int.spec.ts`
- Test: `tests/int/editorial-workflow.int.spec.ts`

**Interfaces:**
- Consumes: updated collection and hook signatures
- Produces: refreshed generated types and final green test baseline

- [ ] **Step 1: Regenerate Payload types**

Run: `pnpm generate:types`
Expected: PASS with `src/payload-types.ts` refreshed for any hook-driven schema shape changes.

- [ ] **Step 2: Run the focused publish-safety verification set**

Run: `pnpm test:int -- --runInBand tests/int/work-queue.int.spec.ts tests/int/editorial-workflow.int.spec.ts tests/int/operational-audit.int.spec.ts tests/int/adminCapabilities.int.spec.ts`
Expected: PASS with queue helper coverage, workflow guard coverage, audit coverage, and capability coverage all green.

- [ ] **Step 3: Commit**

```bash
git add src/payload-types.ts tests/int/work-queue.int.spec.ts tests/int/editorial-workflow.int.spec.ts tests/int/operational-audit.int.spec.ts tests/int/adminCapabilities.int.spec.ts
git commit -m "test(queue): verify publish safety"
```

## Self-Review

### Spec coverage

- Block only final publish, not schedule: covered by Task 2.
- Block only on `open` and `blocked`: covered by Task 1 and Task 2.
- Block only on `approval` and `publish_issue`: covered by Task 1 and Task 2.
- Apply only to `pages`, `articles`, `reviews`, and `system-pages`: covered by Task 3.
- Human-readable error message with first blocker and count: covered by Task 1 and Task 2.
- Lightweight hook-level tests: covered across Tasks 1 through 4.

### Placeholder scan

No `TODO`, `TBD`, or “implement later” placeholders remain. Each task includes concrete files, interfaces, commands, and expected outcomes.

### Type consistency

- Collection slug names are consistently `pages`, `articles`, `reviews`, and `system-pages`.
- Blocking helper names are consistently `findBlockingPublishQueueItems` and `formatBlockingPublishQueueMessage`.
- The queue types and statuses used in the plan match the existing `work-queue` implementation and approved spec.
