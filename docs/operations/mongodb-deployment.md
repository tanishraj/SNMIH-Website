# MongoDB Deployment

For the complete environment matrix, email/media providers, and deployment boundaries, see [Runtime And Providers](./runtime-and-providers.md).

## Supported Profile

- local development: `MongoDB`
- Vercel preview: `MongoDB`
- Vercel production: `MongoDB`

## Required Environment Variables

- `MONGODB_URI`
- `PAYLOAD_SECRET`
- `MEDIA_PROVIDER=s3`
- `S3_BUCKET`
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`

## Optional Email Variables

- `EMAIL_PROVIDER=resend`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME`
- `RESEND_OVERRIDE_TO_EMAIL`

## Local Development

1. Copy `.env.example` to `.env`.
2. Start MongoDB with `docker compose up -d mongo`.
3. Keep `MONGODB_URI=mongodb://127.0.0.1:27017/payload-cms-starter-kit` when running the app from your host machine.
4. If you run the app inside Docker, switch the hostname to `mongo` so the container can resolve it.

Docker Compose pins local MongoDB 8.0.29 and uses the version-specific
`mongo_data_8_0` volume. Keep the local server on the same MongoDB release as the hosted source
during dump and restore workflows. Atlas snapshots from the `test` database must be restored into
`payload-cms-starter-kit` so the existing local `MONGODB_URI` remains valid.

## Hosted Deployment Notes

- Use a durable hosted MongoDB cluster for preview and production.
- Keep preview and production on separate databases unless your workflow explicitly requires shared content.
- Do not deploy this starter to Vercel with `MEDIA_PROVIDER=localDisk` if editors will upload assets.
- Use `MEDIA_PROVIDER=s3` for IDrive e2 or another S3-compatible provider before enabling production uploads.
- If you expect uploads larger than Vercel's server upload limit, set `S3_CLIENT_UPLOADS=true` and allow `PUT` CORS for your site origin on the bucket.

## Verification

1. Confirm the hosted MongoDB cluster is reachable from the deployment environment.
2. Set `MONGODB_URI`.
3. Set `PAYLOAD_SECRET`.
4. Set `MEDIA_PROVIDER=s3`.
5. Set the S3-compatible storage variables for your bucket.
6. If email is required, set the Resend variables.
7. Deploy and verify the app boots without runtime configuration errors.
8. Upload a test image in Payload admin and confirm the object appears in the bucket.
