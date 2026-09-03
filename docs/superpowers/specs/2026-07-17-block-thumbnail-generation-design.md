# Block Thumbnail Generation Design

## Goal

Provide every selectable Payload block with a polished, real-rendered thumbnail so editors can understand the result before adding a block. Thumbnails must be deterministic, easy to regenerate, and required for future blocks.

## Scope

The first generated set covers every block currently selectable in Payload:

- Announcement
- Hero Institutional
- Feature Spotlight
- Stats Strip
- FAQ
- Review Submission
- Header Navbar 12
- Footer 56
- System 404
- System Maintenance
- System Coming Soon

The system also establishes a required thumbnail contract for future blocks. It does not add thumbnail customization fields to Payload, use editor-authored page data, or create alternate thumbnails for every block setting.

## Visual direction

Every thumbnail is a real rendering of the production block component rather than an illustration or wireframe.

- Output dimensions are exactly 1600×900 pixels.
- Every block uses the same canonical light color scheme and default website theme.
- Preview copy is neutral and reusable rather than specific to the current medical or education website.
- Representative images are stored locally in the repository and require no remote network access.
- The rendered block sits inside a safe padded preview canvas so Payload's cover-style crop does not remove important content.
- Blocks render at a desktop content width before capture.
- A block that is taller than the available preview area scales down proportionally to fit.
- A short block such as Announcement or Header remains at its natural scale, is centered in the canvas, and is never stretched.
- Content, fonts, borders, radius, colors, buttons, links, and media treatments come from the real component and the existing design tokens.

## Architecture

### Thumbnail manifest

The manifest has two coordinated layers so Payload configuration does not import production React components. A metadata-only definition list is the source of truth for:

- the Payload block slug;
- the editor-facing block label;
- the output filename;
- accessible thumbnail alt text;
- any preview-stage alignment needed for unusually short blocks.

The fixture renderer is keyed by the same slug union and maps every definition to the rendered block component and deterministic fixture props. Type checking and integration tests require exact slug parity between the metadata and fixture layers.

Fixtures use the existing component interfaces directly. They do not query Payload or duplicate block markup. Media values point to committed assets under a dedicated public thumbnail-assets directory.

The manifest is structured so generation and validation can enumerate every entry without importing a Payload database connection.

### Development-only preview route

The development-only `/block-thumbnail-previews/[slug]` Next.js route renders one manifest entry by slug. It uses a minimal root layout that imports the website stylesheet but does not load Payload globals, the admin session bar, announcements, the website header, or the website footer.

The route forces:

- light color scheme;
- the canonical default website theme;
- a fixed preview canvas;
- a 1440-pixel desktop rendering width inside the 1600×900 export;
- a ready marker only after fonts, images, and scaling are complete.

Unknown slugs return 404. The route also returns 404 when `NODE_ENV` is not `development`, so fixture previews are not exposed by the production site.

### Preview stage

The preview stage owns only capture presentation. It does not restyle the block.

It measures the rendered block and computes a uniform scale no greater than 1. The scale fits tall blocks within the safe area while preserving their aspect ratio. Short blocks retain their natural scale and are centered so they remain visible in Payload's cropped picker cards.

The stage exposes stable data attributes for Playwright readiness and capture. Image loading failures and browser rendering errors prevent the ready state.

### Generator

The repository exposes this command in `package.json`:

```bash
pnpm generate:block-thumbnails
```

The command reuses an already-running development server for the same project when its preview route is available; otherwise it starts an isolated Next.js development server. It launches Playwright's bundled Chromium when installed, with local Chrome and Edge channels as deterministic fallbacks, and captures every manifest route sequentially. Each successful capture overwrites its stable JPEG path under `public/block-thumbnails/`.

The generator:

1. waits for the preview route and ready marker;
2. confirms local images and fonts have loaded;
3. fails on page errors, console errors, missing fixtures, or unknown slugs;
4. captures the complete 1600×900 canvas;
5. writes a deterministic JPEG with consistent quality settings;
6. verifies the written image dimensions;
7. prints a concise success or failure result for every block;
8. leaves a reused development server untouched and shuts down only a server process that it started.

The generator does not require Payload data, administrator authentication, or a separately running development server.

## Payload integration

Each block config uses Payload's native `admin.images.thumbnail` metadata with a stable public URL and descriptive alt text.

The existing filenames remain unchanged: `announcement.jpg`, `hero-institutional.jpg`, `feature-spotlight.jpg`, `stats-strip.jpg`, `header-navbar-12.jpg`, `footer-56.jpg`, `system-404.jpg`, `system-maintenance.jpg`, and `system-coming-soon.jpg`. FAQ uses `faq.jpg`, and Review Submission uses `review-submission.jpg`. FAQ and Review Submission receive new thumbnail constants and config metadata. Header, Footer, and system-page blocks use the same manifest and validation contract as page-layout blocks.

The block picker continues to use Payload's native UI. No custom block-selector component is introduced.

## Assets and repository organization

Generated thumbnails remain in:

```text
public/block-thumbnails/
```

Committed fixture media lives separately in:

```text
public/block-thumbnail-assets/
```

Fixture media must be license-safe, locally stored, and optimized for repository use. Generated thumbnails and fixture assets are committed project assets; transient Playwright output is ignored.

The block-thumbnail README documents the generation command, visual rules, output dimensions, file ownership, and the steps required when adding a new block.

## Validation and testing

A focused integration test verifies that:

- every block registered in Pages, Headers, Footers, and System Pages has exactly one manifest entry;
- every manifest entry maps to a registered block;
- every block config contains `admin.images.thumbnail.url` and non-empty alt text;
- every referenced thumbnail file exists;
- every output image is exactly 1600×900;
- output filenames are unique;
- fixture slugs and component mappings are unique;
- FAQ and Review Submission participate in the same contract as existing blocks.

The generator itself is exercised by generating all thumbnails locally. Pixel-perfect snapshot comparison is intentionally excluded because font rasterization and browser changes make binary image snapshots brittle. Structural coverage, successful rendering, absence of browser errors, local asset loading, and output dimensions provide the stable verification contract.

## Failure behavior

Generation fails without partially reporting success when a block cannot render. Existing successfully written files may remain, but the command exits non-zero and identifies every failed block. Missing assets, timed-out readiness, console errors, page errors, duplicate slugs, duplicate filenames, incorrect dimensions, and unwritable output paths are explicit failures.

Validation errors include the block slug and expected file or configuration location so a future block author can correct the problem without inspecting the generator internals.

## Adding a future block

A future block is complete only when its author:

1. adds the block to the appropriate Payload blocks field;
2. adds a deterministic fixture and manifest entry;
3. supplies any new local fixture media;
4. adds native Payload thumbnail metadata using the manifest URL and alt text;
5. runs `pnpm generate:block-thumbnails`;
6. runs the focused thumbnail validation test.

The validation test fails when any one of these requirements is missing.

## Acceptance criteria

- Payload displays a real-rendered preview for every current block.
- All thumbnails share the canonical light theme, neutral representative content, safe canvas padding, and exact 1600×900 dimensions.
- FAQ and Review Submission no longer appear without thumbnails.
- `pnpm generate:block-thumbnails` regenerates the complete set without Payload data or remote assets.
- Tall and short blocks remain fully recognizable without distortion.
- Production does not expose the internal fixture route.
- A newly registered block without thumbnail coverage causes a focused test failure.
- Existing block behavior and frontend output are unchanged.
- No changes are staged or committed automatically.
