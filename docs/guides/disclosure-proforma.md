# Disclosure Proforma

Add **Disclosure Proforma** from **Explore** in the Page block picker. Use the existing Page Header and Breadcrumb blocks above it. The disclosure block also works in Reusable Sections and the News & Events detail template.

## Set up the data

1. Create a **Disclosure Dataset**, for example SNMIH Institutional Disclosures.
2. Create a **Disclosure Period** linked to that dataset. Give it a visitor-facing label and a reporting date; September 2026 is distinct from a confirmed academic session. Optionally attach the source document and provenance note.
3. Add **Disclosure Records**, each linked to the same dataset and period. Choose its section and matching group key. A record is one fact, one metric, or one table row. Publish the period and the records when verified.
4. Select the dataset in the Page's Disclosure Proforma block and publish the Page.

The Content tab owns the title, optional eyebrow and italic accent, description, shared header/footer actions, dataset, ordered sections, default section, labels, the empty-section message and hint, and archive help. Each section can be disabled, renamed and reordered. Each group has a stable key, title and Facts / Metrics / Table layout. Table columns have editable keys, labels and numeric alignment. Avoid changing keys after entering data unless the corresponding records are also updated.

Theme Settings owns shared appearance and section padding, introduction alignment, Split/Stacked section header layout, standard/wide sidebar, whether section numbers show, compact/comfortable rows, how missing values appear (Chip, Footnote or Text), rows per page (5/10/20/50), and pagination versus Load more. The selected sidebar edge remains square; colours, typography, controls and surfaces use the site's theme.

The header shows a single **Last updated** line. Split places it beside the introduction on wide screens; Stacked and centred sections place it below. The selected reporting period is named on the picker, which shares one outlined control with search on the section heading row; the picker groups published periods by year, finds earlier ones by name and loads further batches.

The block sits directly on the section background: a thin divider separates the sticky section list from the content, facts and figures use hairline rules, and tables number their rows and show supplied numeric values as small badges. Rows tint on hover. Footnote style marks each Not supplied value and adds one note under the affected group; Not applicable is always written out. Empty sections show a centred icon, the empty-section message and the hint; slow loads show an animated pulse after a short delay, which stays still for visitors who prefer reduced motion.

## Default sections and group keys

| Section | Group keys |
| --- | --- |
| Institution | `profile`, `leadership`, `hospital` |
| Statistics | `highlights`, `monthly`, `annual` |
| Courses & students | `intake`, `programmes`, `session` |
| Surgeries | `procedures` |
| Departments & faculty | `register`, `facilities` |
| Hostel & records | `accommodation`, `grievance`, `reporting` |
| Publications | `publications` |

For a metric or fact, enter its label and value. Select **Not supplied** or **Not applicable** explicitly when appropriate. Zero remains a real value. For a table row, enter cells whose keys match the configured columns. For example a course uses `programme`, `commencement`, `pursuing`, and `admitted`. Publications retain the source column **Scopes** via the `scopes` cell key.

Expandable Details supports additional named information such as faculty promotion date, employment type, five-year service history, annual lectures, topics and training dates. Keep the record for that period when adding a new year's register. Source notes are not included in the block's public response projection.

## History and loading

The Page stores presentation settings, not an expanding array of historical data. Each new report gets a new period and new records. Existing records and their versions remain retained; deletion and trash are disabled for these three collections. Editors can unpublish a mistaken disclosure without deleting its history.

Only the active section's bounded record batches are queried. Tables, facts and metrics paginate independently. Search matches record titles, department and table cell values. The reporting selector starts with 20 periods, newest reporting date first. Visitors can search for an earlier period or load another batch. Failed requests offer Retry; draft data requires an authenticated user with the relevant feature or dependency read permissions.

## Update credits

The public timestamp advances for published record changes, period publication/unpublication, and publication of the containing Page or Reusable Section. Saving a draft over published data does not change the public stamp. The public page displays the later of its block's publication stamp and its dataset's publication revision.

The block records who published each change (the editor's **Public Display Name**, otherwise **Editorial team**, never an email address; system operations use **System import**), but the public page currently shows only the timestamp. Reporting dates remain separate from publication timestamps, and public timestamps use the configured site timezone.

Admins have access automatically. Site Managers need explicit Disclosure Dataset / Period / Record grants to edit these destinations. Page and Reusable Section editors receive dependency reads without mutation rights.

## Local verification

`scripts/seed-disclosure-preview.ts` reads the reviewed `scripts/disclosure-proforma-source.json`, forces `mongodb://127.0.0.1:27017/?directConnection=true` and database `snmih_disclosure_preview`, and creates a local `/disclosure-preview` page. It does not use the environment's remote database. The script preserves existing matching source records on subsequent runs and checks draft isolation and unpublication against MongoDB. Its disposable local editor credential is stored with owner-only file permissions at `/tmp/snmih-disclosure-preview-credentials.json`.

Run the local server against that same database:

```sh
MONGODB_URI='mongodb://127.0.0.1:27017/?directConnection=true' DATABASE_NAME=snmih_disclosure_preview pnpm dev --hostname 127.0.0.1 --port 3000
```

This preview contains the supplied September 2026 data. Faculty, surgery and publication entries were not supplied and remain empty. Permitted PG seats (38) and admitted students across listed courses (35) remain separate.
