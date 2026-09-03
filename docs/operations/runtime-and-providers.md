# Runtime And Providers

## Supported Contract

| Concern  | Supported values  | Notes                                                |
| -------- | ----------------- | ---------------------------------------------------- |
| Database | MongoDB           | URL must begin with `mongodb://` or `mongodb+srv://` |
| Email    | `none`, `resend`  | Resend requires API key and from address             |
| Media    | `localDisk`, `s3` | Vercel production rejects local disk                 |

The application validates this contract while loading `src/payload.config.ts` and fails fast on missing or unsupported configuration.

## Environment Variables

| Variable                   | Required           | Purpose                                                                                     |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------- |
| `MONGODB_URI`              | yes                | MongoDB connection string                                                                   |
| `PAYLOAD_SECRET`           | yes                | Unique authentication/encryption secret; production requires 32+ non-placeholder characters |
| `NEXT_PUBLIC_SERVER_URL`   | production/preview | Absolute site URL used by metadata and live-preview links                                   |
| `EMAIL_PROVIDER`           | no                 | `none` by default, or `resend`                                                              |
| `RESEND_API_KEY`           | with Resend        | Resend API key                                                                              |
| `RESEND_FROM_EMAIL`        | with Resend        | Default sender address                                                                      |
| `RESEND_FROM_NAME`         | no                 | Sender label; defaults to `Website`                                                         |
| `RESEND_OVERRIDE_TO_EMAIL` | no                 | Redirect every recipient in staging/QA                                                      |
| `MEDIA_PROVIDER`           | no                 | `localDisk` by default, or `s3`                                                             |
| `S3_BUCKET`                | with S3            | Object-storage bucket                                                                       |
| `S3_ENDPOINT`              | with S3            | S3-compatible HTTPS endpoint                                                                |
| `S3_REGION`                | with S3            | Storage region                                                                              |
| `S3_ACCESS_KEY_ID`         | with S3            | Storage access key                                                                          |
| `S3_SECRET_ACCESS_KEY`     | with S3            | Storage secret                                                                              |
| `S3_PUBLIC_URL`            | no                 | HTTPS origin for direct public/CDN delivery                                                 |
| `S3_ACL`                   | no                 | `none` default, `public-read`, or `private`                                                 |
| `S3_FORCE_PATH_STYLE`      | no                 | Boolean, defaults to `true`                                                                 |
| `S3_CLIENT_UPLOADS`        | no                 | Boolean, defaults to `false`; requires bucket CORS for browser PUT                          |
| `MEDIA_RECONCILE_TOKEN`    | for reconciliation | Secret accepted as Bearer or `x-media-reconcile-token`                                      |
| `SHADCNBLOCKS_API_KEY`     | optional tooling   | Used only by external Shadcn Blocks tooling, not the CMS runtime                            |

Boolean variables accept `true/false`, `1/0`, `yes/no`, or `on/off` case-insensitively.

## Local Development

Use `MEDIA_PROVIDER=localDisk` and either `docker compose up -d mongo` or another reachable MongoDB. Do not leave the placeholder S3 credentials active in a copied `.env`.

## Production Docker Image

`next.config.ts` enables standalone output, and the supplied Dockerfile packages that traced server as a non-root production image. Build it with:

```bash
docker build -t payload-cms-starter-kit .
```

Run the image with a durable MongoDB connection and `MEDIA_PROVIDER=s3` plus the required S3-compatible provider variables. The image intentionally has no persistent local-media volume. `docker-compose.yml` remains a local-development workflow; it is not a production deployment stack.

## S3-Compatible Storage

The Payload S3 plugin attaches only to `media`. Verify endpoint, credentials, optional ACL, path
style, and public/private delivery behavior with the actual provider. Blank `S3_ACL` and
`S3_ACL=none` both omit the ACL request field for providers such as Cloudflare R2. Explicit
`public-read` and `private` values remain available for compatible providers.

When `S3_PUBLIC_URL` is absent, Payload retains its normal file-handler URL behavior. When it is
present, it must be an HTTPS origin without credentials, a path, query, or fragment. Payload emits
encoded file URLs from that origin, and Next.js allows images only from that exact host. Direct
delivery bypasses Payload file access checks: every object in that bucket is public to anyone who
knows its URL, even when the corresponding Payload document is a draft. Never place private or
restricted documents in a public-delivery bucket.

Enable client uploads only after adding a narrowly scoped PUT CORS rule for every approved Admin
origin. Keep `S3_CLIENT_UPLOADS=false` during the initial provider cutover.

Run storage reconciliation after migrations, restores, or suspected bucket drift. See [Media](../guides/media.md).

### Cloudflare R2 Setup

Create one R2 bucket for public website media and a bucket-scoped token with only the object
read/write permissions Payload needs. Configure the application with non-secret values shaped like:

```dotenv
MEDIA_PROVIDER=s3
S3_BUCKET=snmih-media
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_PUBLIC_URL=https://assets.snmih.tanish.im
S3_ACL=none
S3_FORCE_PATH_STYLE=true
S3_CLIENT_UPLOADS=false
```

Set `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` only in `.env` or the deployment environment.
Never paste either secret into documentation, source, browser-visible variables, or support logs.

Before moving `tanish.im` nameservers, inventory all existing DNS records and reproduce their values
in Cloudflare. After the zone is active, connect `assets.snmih.tanish.im` to the R2 bucket, verify its
certificate, and disable the public `r2.dev` development URL.

Create a cache rule scoped only to `assets.snmih.tanish.im` with a 30-day edge TTL and a one-day
browser TTL for eligible successful static responses. Prefer a new filename when replacing an
asset. If an existing object key is overwritten, purge that exact custom-domain URL after the
upload so Cloudflare does not serve the stale object.

Before a production deployment, verify that the deployment environment contains exactly
`S3_PUBLIC_URL=https://assets.snmih.tanish.im`. Changing this value requires a new deployment
because `next.config.ts` reads the public media origin at build time. Next.js image variants use a
one-day minimum optimizer TTL (`86400` seconds).

Accept the rollout only after testing a direct object URL containing encoded spaces, its optimized
`/_next/image` URL, and a repeated request that demonstrates cache reuse. Reject the rollout if any
rendered media URL still resolves through `/api/media/file/**`.

### R2 Migration And Rollback

1. Build the required object manifest from Payload media records, including originals, generated
   sizes, prefixes, and MIME types.
2. Copy all readable objects from the former provider. Use the local recovery image folder only for
   missing objects, preserving exact keys and content types.
3. Compare the R2 object list with the Payload manifest and resolve every required missing object.
4. Verify representative custom-domain URLs, including filenames with spaces or punctuation, and
   confirm a repeated request is cached.
5. Change deployment environment variables and redeploy, then test an authenticated Admin upload,
   public rendering, deletion, and media reconciliation.
6. Crawl every sitemap page and confirm all images load from the custom domain before considering
   the cutover complete.

Do not delete former-provider objects or the local recovery folder during migration. If Admin
uploads, CDN delivery, or the site crawl fails, restore the previous storage environment values and
redeploy. DNS may remain on Cloudflare while the media provider configuration is rolled back.

## Email

`EMAIL_PROVIDER=none` keeps form storage and workflows active without sending email. Resend configuration creates Payload's email adapter. `RESEND_OVERRIDE_TO_EMAIL` is useful for staging but dangerous in production if forgotten because it reroutes all recipients.

## Deployment Notes

- set a unique high-entropy `PAYLOAD_SECRET` per environment; production rejects missing,
  placeholder, and shorter-than-32-character values
- use durable MongoDB and object storage for hosted production
- set `NEXT_PUBLIC_SERVER_URL` to the externally reachable HTTPS origin
- never expose reconciliation or provider secrets to client-side variables
- keep database archives in approved encrypted external storage, never in Git or Docker contexts
- GitHub Actions verifies project context, generated types, TypeScript, lint, integration tests,
  and the production build

## Verification

```bash
pnpm test:int
pnpm build
```

Then sign in, upload an image, publish a Page, submit a Form, and inspect the public route in the target environment.
