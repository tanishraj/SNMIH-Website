# Clean Duplicate Slugs Design

## Goal

Generate readable, unique slugs when editors create or duplicate CMS records. A duplicated record should use `campus-copy`, then `campus-copy-2`, `campus-copy-3`, and so on instead of accumulating separators such as `campus---copy---copy`.

## Scope

Apply the behavior through one shared slug-field helper to every collection currently using Payload's generated slug field:

- Articles
- Categories
- Forms
- Footers
- Gallery Albums
- Headers
- News & Events
- Pages
- Reviews
- System Pages
- Tags

Existing stored slugs will not be rewritten. This avoids changing published URLs, invalidating links, or requiring redirects. The new behavior applies when a slug is generated or a record is duplicated after this change.

## Slug normalization

The shared normalizer will:

1. Trim surrounding whitespace.
2. Convert text to lowercase.
3. Convert runs of unsupported characters, whitespace, underscores, and hyphens into one hyphen.
4. Remove leading and trailing hyphens.

Examples:

- `Campus News` becomes `campus-news`.
- `Campus - Copy` becomes `campus-copy`.
- `campus---copy---copy` becomes `campus-copy-copy` before duplicate-base normalization.

The helper will preserve the existing ASCII-oriented slug contract rather than introduce a separate transliteration dependency.

## Duplicate naming

The slug field will provide a custom `beforeDuplicate` hook instead of Payload's default unique-field copy label.

The hook will:

1. Normalize the source slug.
2. Remove a trailing duplicate chain such as `-copy`, `-copy-2`, or legacy repeated `-copy-copy` segments to recover the original base.
3. Query the current collection for `base-copy`.
4. If occupied, try `base-copy-2`, then increment until an available slug is found.
5. Return the first available candidate.

The lookup will use the current Payload request, preserve access checks, and include draft records so unpublished duplicates cannot collide with published records. The database unique constraint remains the final protection against simultaneous duplicate requests.

## Architecture

A shared project helper will wrap Payload's `slugField` and supply:

- the project slug normalizer;
- the duplicate-name hook;
- the existing `useAsSlug` option and any field overrides required by callers.

Collections will import this helper instead of importing Payload's `slugField` directly. The generated field name, admin behavior, uniqueness, indexing, and lock/unlock UI remain unchanged.

The implementation will not patch `node_modules` or modify Payload internals.

## Error handling

- If a duplicate hook cannot determine a usable source slug, it will allow normal title-based generation rather than emit an empty copy slug.
- Lookup failures will propagate through Payload so the editor sees the operation failure rather than receiving a potentially conflicting slug.
- A bounded suffix search will prevent an accidental infinite loop; exhausting that bound will report a clear validation error.

## Compatibility

- Existing records and URLs remain unchanged.
- Manually edited slugs continue to be supported and normalized by the same field behavior used today.
- Legacy malformed slugs are cleaned when their records are duplicated, but not rewritten in place.
- No redirect migration is included.

## Verification

Focused tests will cover:

- normal title-to-slug generation;
- separator collapsing and trimming;
- first and repeated duplicates;
- duplicating an original record when numbered copies already exist;
- duplicating a legacy malformed copy slug;
- uniqueness checks that include draft records;
- shared helper adoption by every affected collection;
- preservation of the existing slug field contract.

The implementation will also run type checking, targeted linting/formatting, relevant integration tests, and the required project-context update/check loop.
