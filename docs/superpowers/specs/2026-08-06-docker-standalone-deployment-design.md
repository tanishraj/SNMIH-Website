# Docker Standalone Deployment Design

**Date:** 2026-08-06

## Goal

Make the supplied Dockerfile a supported production-image path by aligning it with Next.js standalone output and the starter's durable hosted-storage contract.

## Deployment Contract

The Dockerfile builds an immutable production application image. Production container deployments use a durable MongoDB instance and `MEDIA_PROVIDER=s3` with a compatible object store. Local-disk media remains a local-development option and is not supported as persistent production storage inside this image.

`docker-compose.yml` remains the development workflow. It bind-mounts the repository, runs the development server, and can provide the local MongoDB service; it is not the production image definition.

## Build And Runtime Architecture

`next.config.ts` enables `output: 'standalone'`. The existing multi-stage Dockerfile installs locked dependencies, runs the production build, and copies the generated `.next/standalone` tree plus `.next/static` and `public` into the runner image.

The runner continues to execute as the non-root `nextjs` user. Runtime files copied into the final image use `nextjs:nodejs` ownership where appropriate. The generated `server.js` starts with `HOSTNAME=0.0.0.0` and port `3000`, preserving the current container interface.

The Dockerfile's obsolete setup warning is replaced with an accurate description of the now-enabled standalone build contract.

## Configuration And Failure Behavior

The application retains its existing environment validation. A production operator must provide at least a valid MongoDB URL, Payload secret, public server URL as needed, and S3 provider settings for editor-managed uploads. Invalid or incomplete provider configuration fails during application startup through the existing runtime configuration path.

The image does not create a writable local media volume. This prevents uploaded assets from being silently stored in an ephemeral container layer.

## Documentation

The runtime/provider documentation will distinguish:

- `docker compose` for local development and MongoDB;
- the Dockerfile for a standalone production image;
- S3-compatible storage as the supported production-container media path;
- durable external MongoDB as the production database path.

The architecture feature inventory will remove the unfinished standalone-output limitation once implementation and verification pass.

## Verification

A focused source-level integration test will lock the deployment contract by checking:

- `next.config.ts` enables standalone output;
- the Dockerfile copies `.next/standalone` and `.next/static`;
- the runner switches to the non-root `nextjs` user;
- the documentation states the production storage and development/production split.

Verification also includes ESLint, TypeScript, the focused test, and a production Next.js build when the local environment can complete it. Building the container itself is optional because it depends on an available Docker daemon and image-network access.

## Out Of Scope

- persistent local-disk uploads in production containers;
- production orchestration, TLS termination, health checks, or deployment-platform manifests;
- replacing the development-oriented `docker-compose.yml` with a production stack;
- adding repository CI.
