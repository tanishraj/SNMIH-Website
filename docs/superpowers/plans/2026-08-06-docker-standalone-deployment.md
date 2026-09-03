# Docker Standalone Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the supplied Dockerfile a supported immutable production image using Next.js standalone output and durable S3-compatible media storage.

**Architecture:** Enable Next.js standalone output in the existing configuration and keep the existing multi-stage Docker image. Lock the source-level image contract with one focused Vitest file, then document the separation between development Compose usage and the production Dockerfile.

**Tech Stack:** Next.js 15, Payload CMS 3, TypeScript, Docker, Vitest, Markdown

## Global Constraints

- The Dockerfile is the production-image path; `docker-compose.yml` remains a local-development path.
- Production container deployments use durable MongoDB and `MEDIA_PROVIDER=s3`.
- Do not add persistent local-disk upload support to the production image.
- The final image runs as the non-root `nextjs` user on port `3000`.
- Do not add CI, production orchestration, TLS, or health-check configuration.
- Do not stage or commit any changes.

---

### Task 1: Lock The Standalone Container Contract

**Files:**
- Create: `tests/int/docker-standalone.int.spec.ts`
- Modify: `next.config.ts`
- Modify: `Dockerfile`

**Interfaces:**
- Consumes: the static source contracts in `next.config.ts` and `Dockerfile`
- Produces: `output: 'standalone'` and a non-root runner containing the traced standalone server and static assets

- [ ] **Step 1: Write the failing source-contract test**

Create `tests/int/docker-standalone.int.spec.ts`:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const nextConfigSource = readFileSync('next.config.ts', 'utf8')
const dockerfileSource = readFileSync('Dockerfile', 'utf8')

describe('Docker standalone deployment contract', () => {
  it('enables Next.js standalone output', () => {
    expect(nextConfigSource).toMatch(/output:\s*['"]standalone['"]/)
  })

  it('copies the standalone server and static assets into a non-root runner', () => {
    expect(dockerfileSource).toContain('/app/.next/standalone ./')
    expect(dockerfileSource).toContain('/app/.next/static ./.next/static')
    expect(dockerfileSource).toContain('USER nextjs')
    expect(dockerfileSource).toContain('CMD HOSTNAME="0.0.0.0" node server.js')
  })

  it('does not retain the obsolete standalone setup warning', () => {
    expect(dockerfileSource).not.toContain('you have to set `output: \'standalone\'`')
  })
})
```

- [ ] **Step 2: Run the focused test and confirm the missing configuration fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/docker-standalone.int.spec.ts
```

Expected: two assertions pass and `enables Next.js standalone output` plus the obsolete-warning assertion fail.

- [ ] **Step 3: Enable standalone output**

Add this property at the start of `nextConfig` in `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
```

- [ ] **Step 4: Align the Dockerfile with the supported contract**

Replace the opening warning with:

```dockerfile
# Production image for the Next.js standalone output enabled in next.config.ts.
# Based on https://github.com/vercel/next.js/tree/canary/examples/with-docker
```

Change the public asset copy so its ownership matches the runtime user:

```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
```

Keep the existing `.next/standalone`, `.next/static`, `USER nextjs`, port, hostname, and `server.js` instructions unchanged.

- [ ] **Step 5: Run the focused test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/docker-standalone.int.spec.ts
```

Expected: all three tests pass.

### Task 2: Document The Production Container Path

**Files:**
- Modify: `README.md`
- Modify: `docs/operations/runtime-and-providers.md`
- Modify: `docs/architecture/feature-inventory.md`
- Test: `tests/int/docker-standalone.int.spec.ts`

**Interfaces:**
- Consumes: the standalone image contract produced by Task 1
- Produces: operator-facing guidance that separates local Compose use from production image use and requires durable production providers

- [ ] **Step 1: Add failing documentation assertions**

Append to `tests/int/docker-standalone.int.spec.ts`:

```ts
const readmeSource = readFileSync('README.md', 'utf8')
const runtimeDocsSource = readFileSync('docs/operations/runtime-and-providers.md', 'utf8')
const featureInventorySource = readFileSync('docs/architecture/feature-inventory.md', 'utf8')

describe('Docker deployment documentation', () => {
  it('documents the production image and durable provider requirements', () => {
    expect(readmeSource).toContain('Production Docker Image')
    expect(readmeSource).toContain('MEDIA_PROVIDER=s3')
    expect(runtimeDocsSource).toContain('docker build')
    expect(runtimeDocsSource).toContain('durable MongoDB')
    expect(runtimeDocsSource).toContain('`docker-compose.yml` remains a local-development workflow')
  })

  it('no longer reports standalone Docker support as unfinished', () => {
    expect(featureInventorySource).not.toContain('does not currently enable it')
    expect(featureInventorySource).toContain('Next.js standalone production image')
  })
})
```

- [ ] **Step 2: Run the focused test and confirm the documentation assertions fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/docker-standalone.int.spec.ts
```

Expected: the three container tests pass and the two documentation tests fail.

- [ ] **Step 3: Add the README production-image workflow**

Add a `## Production Docker Image` section after `First Boot` that states:

```markdown
## Production Docker Image

The supplied `Dockerfile` builds the Next.js standalone production server. Build it with `docker build -t payload-cms-starter-kit .` and run it with the environment variables described below.

Production containers require a durable external MongoDB database and `MEDIA_PROVIDER=s3` with a durable S3-compatible bucket. The image intentionally does not provide persistent local-disk uploads. `docker-compose.yml` remains the local-development workflow and is not a production stack.
```

- [ ] **Step 4: Replace the unfinished runtime note with production guidance**

In `docs/operations/runtime-and-providers.md`, replace the standalone mismatch warning with a `## Production Docker Image` section containing:

````markdown
## Production Docker Image

`next.config.ts` enables standalone output, and the supplied Dockerfile packages that traced server as a non-root production image. Build it with:

```bash
docker build -t payload-cms-starter-kit .
```

Run the image with a durable MongoDB connection and `MEDIA_PROVIDER=s3` plus the required S3-compatible provider variables. The image intentionally has no persistent local-media volume. `docker-compose.yml` remains a local-development workflow; it is not a production deployment stack.
````

- [ ] **Step 5: Update the feature inventory**

Replace the unfinished Docker sentence in `docs/architecture/feature-inventory.md` with:

```markdown
- There is no repository CI workflow. The supplied Dockerfile builds a non-root Next.js standalone production image; production containers require durable MongoDB and S3-compatible media storage.
```

- [ ] **Step 6: Run the focused deployment test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/docker-standalone.int.spec.ts
```

Expected: all five tests pass.

### Task 3: Verify The Complete Change

**Files:**
- Verify: `next.config.ts`
- Verify: `Dockerfile`
- Verify: `README.md`
- Verify: `docs/operations/runtime-and-providers.md`
- Verify: `docs/architecture/feature-inventory.md`
- Verify: `tests/int/docker-standalone.int.spec.ts`

**Interfaces:**
- Consumes: Tasks 1 and 2
- Produces: evidence that the standalone source, documentation, and production build contracts are consistent

- [ ] **Step 1: Run focused linting**

Run:

```bash
pnpm exec eslint next.config.ts tests/int/docker-standalone.int.spec.ts
```

Expected: exit code 0 with no warnings or errors.

- [ ] **Step 2: Run TypeScript validation**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
```

Expected: exit code 0.

- [ ] **Step 3: Run the deployment and documentation tests together**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/docker-standalone.int.spec.ts tests/int/admin-documentation.int.spec.ts
```

Expected: both test files pass.

- [ ] **Step 4: Run the production build**

Run:

```bash
pnpm build
```

Expected: Next.js completes successfully and `.next/standalone/server.js` exists. If the build cannot access required external services or package resources, record that environmental limitation without weakening the source-level contract tests.

- [ ] **Step 5: Check patch integrity**

Run:

```bash
git diff --check
```

Expected: exit code 0 with no whitespace errors.
