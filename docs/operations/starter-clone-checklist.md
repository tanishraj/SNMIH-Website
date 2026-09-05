# Starter Clone Checklist

Use this checklist when copying the starter into a new client repository. The goal is to replace client-specific defaults without disturbing the core CMS behavior or the current starter contract.

## Replace Client Identity

- Update the project name and description in `package.json` if the clone will be published or handed off.
- Replace brand, contact, address, social, and identity defaults in `site-settings`.
- Select published privacy and terms Pages in `site-settings`.
- Review logo, favicon, and default SEO imagery stored through the `media` collection.
- Replace any example theme preset choice in `theme-settings` with the client-approved default.

## Confirm Runtime And Provider Choices

- Confirm `MONGODB_URI` points at the correct MongoDB instance for the environment.
- Set `DATABASE_NAME` to the intended application database; keep preview, staging, and production
  on distinct databases or clusters.
- Set a unique `PAYLOAD_SECRET` for every environment. Production values must contain at least 32
  non-placeholder characters.
- Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` if the site should send notifications.
- Decide whether `RESEND_FROM_NAME` and `RESEND_OVERRIDE_TO_EMAIL` are needed for staging or QA.
- Confirm `NEXT_PUBLIC_SERVER_URL` matches the public base URL used for previews and metadata.
- Keep `MEDIA_PROVIDER=localDisk` for local work, or set `MEDIA_PROVIDER=s3` when the clone is being prepared for hosted editor uploads.
- Configure `MEDIA_RECONCILE_TOKEN` if storage health will be checked remotely or by a scheduler.

## Review CMS Defaults

- Choose the homepage in `page-settings`.
- Choose the active header and footer presets in `page-settings`.
- Confirm the published 404, maintenance, and coming-soon presets in `system-pages`, then select them in `system-mode-settings`.
- Review default SEO values in `seo-settings`.
- Review `analytics-settings` and `cookie-consent-settings` with the client's privacy owner.
- Create and publish the root `news-events` Page, configure its Page SEO and appearance, and add the required News & Events listing blocks.
- Create and publish Office Locations and Gallery Albums required by data-backed Page blocks.
- Review Admin users and grant only the required features to each Site Manager before handoff.

## Verify Content And Intake Workflows

- Create or review at least one `article` with its taxonomy and SEO values.
- Submit a published form and confirm submissions persist in `form-submissions`.
- Confirm notification recipients are configured on each live form that should send alerts.
- Submit one review form, approve the submission flow, and confirm the public-facing review content path behaves as expected.
- Check that redirects and page previews work with the configured public URL.

## Verify Deployment Assumptions

- Confirm `MONGODB_URI` points to the hosted MongoDB cluster before any shared deployment work.
- Confirm `DATABASE_NAME` selects the intended environment database before migrations, exports, or deployment.
- Confirm `MEDIA_PROVIDER=s3` and the S3-compatible bucket credentials before any Vercel deployment work.
- Do not treat the default `media` upload behavior as durable on Vercel.
- Verify the configured homepage, 404 page, maintenance page, and coming-soon page all resolve correctly.

## Run Starter Verification

- Run `pnpm test:int`.
- Run `pnpm test:e2e`.
- Use an isolated MongoDB database for tests; E2E seeding mutates known users and homepage content.
- Start the app with `pnpm dev` and confirm the public site, admin login, and preview routes load.
- Run media reconciliation after an S3 migration or restore.
- Regenerate Payload types and the Admin import map after schema or custom Admin changes.
- Review [docs/architecture/content-model-map.md](../architecture/content-model-map.md) before adding client-specific content types.

## Safe Customization Boundaries

- Replace branding, contact details, and presentation defaults in globals before changing collection structure.
- Replace provider environment configuration through `src/config/runtime.ts` and `src/config/providers.ts`.
- Extend form routing or downstream lead handling through `src/lib/formSubmissionEvents.ts` instead of editing submission persistence rules in every clone.
- Keep content ownership explicit instead of pushing unrelated behavior into `pages` or site globals.
