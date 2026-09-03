# News & Events Robots Inheritance Design

## Context

News & Events archive and detail metadata call `resolveRobotsMode` without the global
`seo-settings.robots` value. When a record uses `default`, the resolver therefore falls back to
`index,follow` instead of inheriting the configured site policy.

## Goals

- Make `default` inherit the global robots policy for the archive and every News & Events detail.
- Preserve explicit route-level `index` and `noindex` overrides.
- Keep metadata formatting functions pure and independently testable.
- Reuse the existing global cache invalidation tag.
- Fetch independent metadata inputs in parallel.

## Non-Goals

- Changing the robots options or their stored values.
- Changing sitemap eligibility rules.
- Consolidating every repository SEO settings loader.
- Changing metadata title, description, canonical, Open Graph, Twitter, or structured-data behavior.

## Architecture

`src/lib/newsEvents.ts` will expose a server-only cached
`getNewsEventsInheritedRobots(): Promise<SeoSetting['robots']>` helper. Its uncached loader reads
the `seo-settings` global at depth zero. The cached wrapper uses
`CMS_CACHE_TAGS.globals` with indefinite revalidation, matching other managed global data.

`getNewsEventsArchiveMetadata` and `getNewsEventDetailMetadata` will accept the inherited robots
value as a required second argument and pass it to `resolveRobotsMode`. The functions remain
synchronous metadata formatters.

The archive route will load News & Events settings and inherited robots with `Promise.all`. The
detail route will load its public entry and inherited robots with `Promise.all`. If an entry is
missing, it will continue to return empty metadata.

## Resolution Contract

| Route value | Global value | Result |
| --- | --- | --- |
| `default` | `index,follow` | index, follow |
| `default` | `noindex,follow` | noindex, follow |
| `default` | `index,nofollow` | index, nofollow |
| `default` | `noindex,nofollow` | noindex, nofollow |
| `index` | any global value | index, follow |
| `noindex` | any global value | noindex, follow |

## Error Handling

The global loader will follow existing managed-global behavior: a failed Payload read rejects
metadata generation instead of silently changing crawler policy. No fallback may convert an
unavailable or configured global policy into `index,follow`.

## Testing

Focused tests will verify:

- archive `default` inherits a global noindex policy;
- detail `default` inherits a global nofollow policy;
- archive and detail explicit values override a conflicting global policy;
- both routes pass the cached inherited value to their metadata builder;
- the global helper reads `seo-settings` and uses the globals cache tag;
- unrelated News & Events metadata remains unchanged.

## Documentation

The News & Events authoring/settings guides will state that `default` inherits the global crawler
policy and explicit values override it. The resolved robots limitation will be removed from the
feature inventory.

## Acceptance Criteria

- No News & Events metadata path resolves `default` without the global robots value.
- Explicit route-level choices retain their existing precedence.
- Archive and detail inputs load concurrently.
- Focused metadata, route, documentation, lint, and TypeScript checks pass.
- All changes remain uncommitted.
