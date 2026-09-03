# Atlas To Local MongoDB Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the local Docker MongoDB database with the verified Atlas `test` snapshot without exposing credentials or losing the former local state.

**Architecture:** Pin the local Compose service to the Atlas MongoDB version and attach a new version-specific data volume, leaving the old volume and its archive untouched. Restore the Atlas archive with a namespace mapping into the application's existing database name, then compare normalized collection, document, and index summaries between Atlas and local MongoDB.

**Tech Stack:** Docker Compose, MongoDB 8.0.29, MongoDB Database Tools, mongosh, Payload CMS 3.85.2, Vitest, pnpm

## Global Constraints

- Atlas runs MongoDB 8.0.29; local restore must also run MongoDB 8.0.29.
- Atlas source namespace is `test.*`; local destination namespace is `payload-cms-starter-kit.*`.
- Keep `backups/atlas-test-2026-08-30T03-44-27-392Z.archive` and `backups/payload-db-2026-08-30-03-44-21-558.archive` intact.
- Keep the former Compose Docker data volume intact.
- Never write the supplied Atlas URI to a tracked file, `.env`, documentation, or Git history.
- Stop on image-start failure, a non-empty fresh target, any restore failure, or any verification mismatch.

---

### Task 1: Pin the Local MongoDB Runtime Contract

**Files:**

- Modify: `tests/int/mongodb-uri-contract.int.spec.ts`
- Modify: `docker-compose.yml`
- Modify: `docs/operations/mongodb-deployment.md`
- Modify: `.agents/skills/project-context/references/architecture.md`
- Generated if facts change: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: the existing `mongo` Compose service and host URI `mongodb://127.0.0.1:27017/payload-cms-starter-kit`
- Produces: a local `mongo` service using `mongo:8.0.29` and `mongo_data_8_0:/data/db`

- [ ] **Step 1: Add a failing local MongoDB image and volume contract test**

Add these fixtures below `activeContractPaths` in `tests/int/mongodb-uri-contract.int.spec.ts`:

```ts
const dockerCompose = readFileSync('docker-compose.yml', 'utf8')
const mongoDeploymentDocs = readFileSync('docs/operations/mongodb-deployment.md', 'utf8')
const projectArchitecture = readFileSync(
  '.agents/skills/project-context/references/architecture.md',
  'utf8',
)
```

Add this case inside `describe('MongoDB environment contract', ...)`:

```ts
it('pins local MongoDB to the Atlas-compatible runtime and volume', () => {
  expect(dockerCompose).toContain('image: mongo:8.0.29')
  expect(dockerCompose).toContain('- mongo_data_8_0:/data/db')
  expect(dockerCompose).toContain('mongo_data_8_0:')
  expect(dockerCompose).not.toContain('image: mongo:latest')

  expect(mongoDeploymentDocs).toContain('MongoDB 8.0.29')
  expect(projectArchitecture).toContain('MongoDB 8.0.29')
})
```

- [ ] **Step 2: Run the contract test and verify it fails for the unpinned image**

Run:

```bash
pnpm exec vitest run tests/int/mongodb-uri-contract.int.spec.ts --config ./vitest.config.mts
```

Expected: FAIL because `docker-compose.yml` still contains `image: mongo:latest`, does not define `mongo_data_8_0`, and the active documentation does not name MongoDB 8.0.29.

- [ ] **Step 3: Pin the image and move local MongoDB to fresh version-specific storage**

Change only the `mongo` service volume and image in `docker-compose.yml`:

```yaml
mongo:
  image: mongo:8.0.29
  ports:
    - '27017:27017'
  command:
    - --storageEngine=wiredTiger
  volumes:
    - mongo_data_8_0:/data/db
  logging:
    driver: none
```

Replace the top-level `data:` declaration with:

```yaml
volumes:
  mongo_data_8_0:
  node_modules:
```

Do not delete the existing `payload-cms-starter-kit_data` Docker volume.

- [ ] **Step 4: Document the compatibility pin and restore namespace contract**

Add this paragraph after the Local Development list in `docs/operations/mongodb-deployment.md`:

```markdown
Docker Compose pins local MongoDB to 8.0.29 and uses the version-specific
`mongo_data_8_0` volume. Keep the local server on the same MongoDB release as the hosted source
during dump and restore workflows. Atlas snapshots from the `test` database must be restored into
`payload-cms-starter-kit` so the existing local `MONGODB_URI` remains valid.
```

Add this sentence to the runtime/provider paragraph in `.agents/skills/project-context/references/architecture.md`:

```markdown
Local Docker Compose pins MongoDB 8.0.29 and isolates its files in the version-specific
`mongo_data_8_0` volume so Atlas dump and restore workflows do not cross MongoDB server versions.
```

- [ ] **Step 5: Validate the resolved Compose configuration**

Run:

```bash
docker compose config
```

Expected: exit 0; the resolved `mongo` service uses image `mongo:8.0.29`, mounts `mongo_data_8_0` at `/data/db`, and still publishes port 27017.

- [ ] **Step 6: Refresh and inspect generated project context**

Run:

```bash
pnpm project-context:update
git diff -- .agents/skills/project-context/references/project-inventory.json
```

Expected: the update exits 0. Retain `project-inventory.json` only if the generator records a factual change; a no-op is valid.

- [ ] **Step 7: Run the focused contract and project-context check**

Run:

```bash
pnpm exec vitest run tests/int/mongodb-uri-contract.int.spec.ts --config ./vitest.config.mts
pnpm project-context:check
git diff --check
```

Expected: all commands exit 0, the Vitest file passes, the project context is current, and Git reports no whitespace errors.

- [ ] **Step 8: Review and commit the runtime contract**

Run:

```bash
git diff -- docker-compose.yml docs/operations/mongodb-deployment.md .agents/skills/project-context/references/architecture.md .agents/skills/project-context/references/project-inventory.json tests/int/mongodb-uri-contract.int.spec.ts
git status --short
git add docker-compose.yml docs/operations/mongodb-deployment.md .agents/skills/project-context/references/architecture.md tests/int/mongodb-uri-contract.int.spec.ts
git add .agents/skills/project-context/references/project-inventory.json
git commit -m "chore(db): pin local MongoDB 8.0.29" -m "Match the Atlas server before restoring its archive and isolate local files from the prior MongoDB 8.2 runtime."
```

If `project-inventory.json` is unchanged, omit its `git add` command. Expected: one focused commit containing only the tested local MongoDB contract and any generated inventory update.

### Task 2: Recreate, Restore, and Verify Local MongoDB

**Files:**

- Read: `backups/atlas-test-2026-08-30T03-44-27-392Z.archive`
- Preserve: `backups/payload-db-2026-08-30-03-44-21-558.archive`
- Mutate: Docker service `payload-cms-starter-kit-mongo-1`
- Create through Compose: Docker volume `payload-cms-starter-kit_mongo_data_8_0`

**Interfaces:**

- Consumes: the gzip Atlas archive containing `test.*` and the pinned Compose contract from Task 1
- Produces: MongoDB 8.0.29 at `mongodb://127.0.0.1:27017/payload-cms-starter-kit` with the Atlas collection, document, and index state

- [ ] **Step 1: Verify both recovery archives before changing the running container**

Run:

```bash
test -s backups/atlas-test-2026-08-30T03-44-27-392Z.archive
test -s backups/payload-db-2026-08-30-03-44-21-558.archive
ls -lh backups/atlas-test-2026-08-30T03-44-27-392Z.archive backups/payload-db-2026-08-30-03-44-21-558.archive
```

Expected: both `test -s` commands exit 0; the Atlas archive is approximately 448 KB and the former-local archive is approximately 2.2 MB.

- [ ] **Step 2: Recreate only the MongoDB service on the pinned image and new volume**

Run:

```bash
docker compose up -d --force-recreate mongo
docker compose ps mongo
```

Expected: Compose pulls or reuses `mongo:8.0.29`, recreates `payload-cms-starter-kit-mongo-1`, and reports it running with host port 27017. The former `payload-cms-starter-kit_data` volume remains present and unmounted.

- [ ] **Step 3: Confirm the server version and empty destination**

Run:

```bash
mongosh 'mongodb://127.0.0.1:27017/payload-cms-starter-kit' --quiet --eval 'print(JSON.stringify({version: db.version(), collections: db.getCollectionNames().sort(), documents: db.getCollectionNames().reduce((sum, name) => sum + db.getCollection(name).countDocuments({}), 0)}))'
```

Expected:

```json
{ "version": "8.0.29", "collections": [], "documents": 0 }
```

Stop instead of restoring if any collection or document exists.

- [ ] **Step 4: Restore the Atlas archive with namespace mapping and fail-fast behavior**

Run:

```bash
mongorestore --uri='mongodb://127.0.0.1:27017' --archive='backups/atlas-test-2026-08-30T03-44-27-392Z.archive' --gzip --nsFrom='test.*' --nsTo='payload-cms-starter-kit.*' --stopOnError
```

Expected: exit 0, no cross-version warning, 3,859 documents restored successfully, and 0 documents failed.

- [ ] **Step 5: Generate a normalized Atlas source summary without persisting credentials**

Set `ATLAS_URI` only in the current shell from the supplied credential, then run:

```bash
mongosh "$ATLAS_URI" --quiet --eval 'const d=db.getSiblingDB("test"); const names=d.getCollectionNames().sort(); const collections=names.map((name)=>({name,count:d.getCollection(name).countDocuments({}),indexes:d.getCollection(name).getIndexes().map(({v,ns,...index})=>index).sort((a,b)=>a.name.localeCompare(b.name))})); print(JSON.stringify({database:"test",collectionCount:names.length,documentCount:collections.reduce((sum,item)=>sum+item.count,0),collections}))'
```

Expected: one JSON object with `database` equal to `test`, `collectionCount` equal to 50, and `documentCount` equal to 3,859. Do not write `ATLAS_URI` or the command-expanded credential to a file.

- [ ] **Step 6: Generate the equivalent normalized local summary**

Run:

```bash
mongosh 'mongodb://127.0.0.1:27017/payload-cms-starter-kit' --quiet --eval 'const d=db.getSiblingDB("payload-cms-starter-kit"); const names=d.getCollectionNames().sort(); const collections=names.map((name)=>({name,count:d.getCollection(name).countDocuments({}),indexes:d.getCollection(name).getIndexes().map(({v,ns,...index})=>index).sort((a,b)=>a.name.localeCompare(b.name))})); print(JSON.stringify({database:"payload-cms-starter-kit",collectionCount:names.length,documentCount:collections.reduce((sum,item)=>sum+item.count,0),collections}))'
```

Expected: one JSON object with `database` equal to `payload-cms-starter-kit`, `collectionCount` equal to 50, and `documentCount` equal to 3,859. Aside from the database field, its sorted collection names, per-collection counts, and normalized indexes must exactly match Step 5.

- [ ] **Step 7: Verify connectivity, container version, volumes, and repository state**

Run:

```bash
mongosh 'mongodb://127.0.0.1:27017/payload-cms-starter-kit' --quiet --eval 'print(JSON.stringify(db.runCommand({ping:1})))'
docker inspect payload-cms-starter-kit-mongo-1 --format '{{.Config.Image}} {{range .Mounts}}{{.Name}}:{{.Destination}} {{end}}'
docker volume ls --format '{{.Name}}'
git status --short
```

Expected: MongoDB returns `{"ok":1}`, the container reports `mongo:8.0.29` with `payload-cms-starter-kit_mongo_data_8_0:/data/db`, both the new and former Compose volumes exist, and no ignored archive or secret appears in Git status.

The restore is complete only after every Task 2 check passes. Keep both archives and the former Docker volume until the user explicitly asks to remove them.
