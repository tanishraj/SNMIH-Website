# Role And Capability Model Design

## Goal

Replace the current editorial role naming and default capability bundles with a clearer client-facing model that fits a handoff-safe website CMS:

- `Admin`
- `Site Manager`
- `Content Manager`

The goal is not to remove capability customization. The goal is to make roles understandable, keep default access safe, and let admins customize exceptions through explicit capability checkboxes.

## Why This Change

The current role model mixes product intent and internal workflow language:

- `admin`
- `publisher`
- `editor`
- `marketingOps`

That model is workable in code, but it is harder to explain to real client teams. It also creates ambiguity around who manages the website versus who edits content.

For this starter, the real operational model is simpler:

- one platform owner
- one trusted website operator
- one non-technical content publisher

The role model should reflect that directly.

## Scope

This design changes:

- role names
- default capability bundles per role
- how capability overrides are explained and applied in admin

This design does not change:

- collection-level access architecture
- the existence of capability checkboxes
- admin always having full access
- current content model ownership

## User Model

### 1. Admin

`Admin` is the superuser role.

This role owns:

- full CMS access
- user creation and user management
- recovery from misconfiguration
- all structural, content, settings, and operations areas

`Admin` should continue to bypass normal capability limitations and should always resolve to full access even if capability values are incomplete or corrupted.

### 2. Site Manager

`Site Manager` is the trusted website operator.

This role is for the person who can safely run the website after handoff, including content publishing and higher-impact website controls.

Default responsibilities:

- manage and publish public content
- manage website structure
- manage site-wide settings
- manage system pages and system modes
- review operational history

This role is the only non-admin role that should receive system-level controls by default.

### 3. Content Manager

`Content Manager` is the non-technical publishing role.

This role is for the person who updates and publishes normal website content without controlling global website behavior.

Default responsibilities:

- create and edit content
- publish normal content
- manage supporting media for content

This role should not manage system-wide settings, system modes, or users by default.

## Recommended Access Boundaries

### Admin default

Enable every capability.

This includes:

- all content surfaces
- all structural surfaces
- all site controls
- all operations surfaces
- all publish capabilities
- users management through existing admin-only collection access

### Site Manager default

Enable these by default:

- `manage_pages`
- `manage_articles`
- `manage_reviews`
- `manage_media`
- `manage_taxonomy`
- `manage_navigation`
- `manage_redirects`
- `manage_headers`
- `manage_footers`
- `manage_forms`
- `manage_form_submissions`
- `manage_work_queue`
- `manage_page_settings`
- `manage_site_settings`
- `manage_theme_settings`
- `manage_seo_settings`
- `manage_system_pages`
- `manage_system_modes`
- `view_operational_audit`
- `publish_pages`
- `publish_articles`
- `publish_reviews`
- `publish_system_pages`

This gives the role full website operating control without making it an account-management superuser.

### Content Manager default

Enable these by default:

- `manage_pages`
- `manage_articles`
- `manage_reviews`
- `manage_media`
- `publish_pages`
- `publish_articles`
- `publish_reviews`

Leave these disabled by default:

- `manage_taxonomy`
- `manage_navigation`
- `manage_redirects`
- `manage_headers`
- `manage_footers`
- `manage_forms`
- `manage_form_submissions`
- `manage_page_settings`
- `manage_site_settings`
- `manage_theme_settings`
- `manage_seo_settings`
- `manage_system_pages`
- `manage_system_modes`
- `manage_work_queue`
- `view_operational_audit`
- `publish_system_pages`

This keeps the role aligned with non-technical publishing rather than site operation.

## Capability Strategy

The system should follow a preset-plus-override model.

### Recommended behavior

- selecting a role applies that role’s default capability bundle
- `Admin` always resolves to full access and does not rely on granular capability editing
- non-admin roles continue to show capability checkboxes
- admins can customize capability selections per non-admin user
- role remains the primary identity of the user, while capability edits remain explicit exceptions

### Why this model

This gives the starter both:

- client-friendly defaults
- operational flexibility for edge cases

It avoids two failure modes:

1. too-rigid roles that force custom code for minor team differences
2. capability-only access where roles stop meaning anything

## Capability Presentation

The capability screen should read as grouped website responsibilities, not as a flat implementation list.

Recommended grouping:

### Content

- Pages
- Articles
- Reviews
- Media
- Taxonomy

### Structure

- Navigation
- Redirects
- Headers
- Footers

### Site Controls

- Site Defaults
- Site Settings
- Theme Settings
- SEO Settings
- System Pages
- System Modes

### Operations

- Forms
- Form Submissions
- Work Queue
- Operational Audit

### Publishing

- Publish Pages
- Publish Articles
- Publish Reviews
- Publish System Pages

This grouping matches how client teams think about responsibilities and makes presets easier to audit visually.

## Naming Recommendation

Rename the current role model to:

- `Admin`
- `Site Manager`
- `Content Manager`

Retire the current human-facing names:

- `Publisher`
- `Editor`
- `Marketing Ops`

If migration compatibility is needed, legacy stored role values can be normalized to the new model during read/write transitions, but the admin UI should present only the new names.

## Operational Rules

These rules should remain explicit:

- `Users` management stays admin-only
- `Content Manager` can publish normal content but does not publish `system pages`
- `Site Manager` is the only non-admin role with system-level controls by default
- `Admin` always has full access regardless of checkbox state

## Recommended Migration Mapping

For existing users, the safest migration mapping is:

- `admin` -> `Admin`
- `publisher` -> `Site Manager`
- `editor` -> `Content Manager`
- `contentEditor` -> `Content Manager`
- `marketingOps` -> `Site Manager`

`marketingOps` maps best to `Site Manager` because the approved future model no longer treats campaign operations as a distinct primary role, and the higher-trust non-admin role is the closest operational fit.

If any current `marketingOps` users should remain narrower than `Site Manager`, admins can reduce their capability bundle after migration.

## Trade-Offs Considered

### Option 1: strict role presets

Pros:

- easiest to explain
- strongest governance

Cons:

- too rigid for real client teams
- encourages ad hoc code changes when one user needs a small exception

### Option 2: preset roles with full capability overrides

Pros:

- best balance of clarity and flexibility
- works with the existing capability architecture
- supports client-specific exceptions without changing the role model

Cons:

- requires discipline so overrides do not erode role meaning over time

### Option 3: capabilities-first model

Pros:

- maximum flexibility

Cons:

- weak handoff story
- harder for admins to understand
- roles become mostly cosmetic

## Decision

Adopt option 2.

Use three clear role presets backed by explicit capability defaults, while preserving per-user capability customization for non-admin users.

## Testing Impact

The eventual implementation should verify:

- only the new three roles are exposed in admin
- `Admin` still receives unconditional full access
- `Site Manager` receives the full trusted-operator default bundle
- `Content Manager` receives the non-technical publishing bundle
- changing a role reapplies the correct default capability set
- manual capability overrides still work for non-admin users
- legacy roles normalize safely to the new model

## Success Criteria

This design is successful when:

- a client team can understand each role without CMS-specific explanation
- non-technical publishers can publish normal content safely
- trusted non-admin operators can manage the website without requiring admin status
- admins can still customize exceptions through checkboxes
- the role model remains understandable after handoff
