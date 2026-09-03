---
name: project-context
description: Understand, implement, review, or diagnose changes in this Payload CMS starter while preserving its project-specific architecture and keeping generated project knowledge current. Use for repository work involving collections, globals, blocks, renderers, routes, themes, access, hooks, providers, tests, documentation, or cross-file change impact.
---

# Project Context

Read the repository [AGENTS.md](../../../AGENTS.md). Before changing Payload configuration, also read the neighboring [Payload skill](../payload/SKILL.md) and only the relevant detailed reference it routes.

Treat current source, registered configuration, generated Payload types, and maintained architecture documentation as authoritative in that order. Historical plans explain why work happened but do not override current source.

## Route Context

- Read [architecture.md](references/architecture.md) for runtime layers, routes, rendering, providers, caching, themes, and testing boundaries.
- Read [payload-model.md](references/payload-model.md) for collections, globals, access, fields, hooks, workflow, and relationships.
- Read [block-system.md](references/block-system.md) for block config, registration, renderers, live preview, reusable sections, thumbnails, generated types, and block tests.
- Read [change-impact-map.md](references/change-impact-map.md) before implementation and again before handoff.
- Read [project-inventory.json](references/project-inventory.json) when exact names, paths, versions, registrations, or coverage lists are needed.

## Work Safely

Inspect the schema/config producer, frontend consumer, hooks/helpers, generated types, tests, and maintained docs together. Keep Local API access enforcement for user-scoped operations, pass `req` through nested Payload operations, guard hook recursion with context, preserve draft/public filtering, and never run destructive data workflows against production.

Follow existing explicit registration patterns. Do not introduce a cross-environment block registry that mixes server-only and client-capable imports merely to reduce repetition.

## Complete Every Implementation

1. Run `pnpm project-context:update`.
2. Inspect the final diff using [change-impact-map.md](references/change-impact-map.md).
3. Update narrative references only when architecture, ownership, behavior, or operator contracts changed.
4. Run `pnpm project-context:check`.
5. Run affected tests and required Payload generators.
6. Report which project-context files changed, or explicitly report that the skill remained current.

A no-op inventory update is valid. Treat a stale knowledge graph as a warning; refresh it incrementally after structural architecture changes.
