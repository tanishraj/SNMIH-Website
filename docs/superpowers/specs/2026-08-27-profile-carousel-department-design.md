# Profile Carousel Department Design

## Objective

Add optional department metadata to every Profile Carousel profile and present it consistently in both existing card variants without changing existing content behavior.

## Authoring Contract

- Add an optional text field named `department` to each row in the existing `profiles` array.
- Label the field `Department` and place it directly after `Role / Designation` in the profile Content fields.
- Keep the field optional. Existing Profile Carousel records require no migration or backfill.
- Store department names as editor-authored text rather than introducing a relationship or shared department taxonomy.

## Runtime Contract

- Extend the Profile Carousel profile input and resolved presentation types with an optional `department` value.
- Trim leading and trailing whitespace during server-side normalization.
- Treat an empty or whitespace-only value as absent.
- Preserve the existing requirement that a profile needs a usable name and image.
- Pass the normalized department through the shared Profile Carousel and client carousel path without adding client state or behavior.

## Presentation

Both `stacked` and `overlay` card variants use this information hierarchy:

1. Name
2. Role / Designation, when present
3. Department, when present

Department uses compact secondary metadata styling. It must remain visually subordinate to the name and role, inherit the resolved card or overlay foreground colors, wrap naturally, and work on light, dark, brand, and configured card surfaces.

The metadata stack closes naturally when Role, Department, or both are missing. No empty elements, separators, or placeholder department text are rendered.

## Compatibility and Scope

- Existing saved profiles without `department` render exactly as before.
- Department is informational text only; it does not filter profiles or link to Department Profiles.
- Carousel navigation, looping, card surfaces, overlays, image positioning, alignment, actions, and section settings remain unchanged.
- No content migration is required.

## Verification

- Assert the Profile Carousel schema exposes optional `department` after `role`.
- Assert generated Payload types include the optional department property.
- Assert server normalization trims authored department text and omits blank values.
- Assert both stacked and overlay cards render Department beneath Role.
- Assert Department renders correctly when Role is absent.
- Assert profiles without Department retain their existing output.
- Run focused Profile Carousel and shared card-renderer tests, Payload type generation, TypeScript, lint as warranted, and the project-context update/check loop.

## Maintained Context

Update the Profile Carousel behavior in `block-system.md` and refresh `project-inventory.json` if generated facts change.
