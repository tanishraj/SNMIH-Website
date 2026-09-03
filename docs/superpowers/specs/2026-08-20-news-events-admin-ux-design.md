# News & Events Admin UX Design

## Goal

Make News & Events authoring easier to scan without changing stored content, public rendering, SEO behavior, or the application-wide editorial workflow.

## Admin navigation

Create one `News & Events` Admin group containing:

1. `News & Events`
2. `Classifications`
3. `Detail Page Template`

Classifications remain domain configuration rather than generic Topics/Tags because their Story/Event behavior changes validation and public date handling.

## Entry form

Keep Title and Slug above the tabs. Reduce the six tabs to four:

1. `Content`
   - Entry Classification
   - Excerpt
   - Featured Image
   - Image Position
   - a collapsed `Topics & Tags` group containing Primary Topic, Tags, and Additional Topics
   - Body
2. `Event Details`
   - Start/end dates, location, and the optional Registration Action
3. `SEO`
   - The existing shared SEO field contract, unchanged
4. `Workflow`
   - The existing shared editorial workflow contract, unchanged

Moving fields between tabs and a collapsible must preserve their existing names and top-level storage paths.

## List view

Use columns that work for both Story and Event behavior: Title, Classification, Payload Status, Workflow State, and Updated At. Event Start remains available through the column selector but is not a default column.

## Constraints

- Do not rename stored fields.
- Do not change hooks, validation, access, public queries, or rendering.
- Do not redesign shared SEO or Workflow fields.
- Do not add behavior-dependent Admin fetching in this pass.
- Do not commit or stage changes.
