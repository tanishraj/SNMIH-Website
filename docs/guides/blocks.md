# Page Blocks Guide

## How The Block System Works

Pages use an ordered block layout. Editors can collapse, reorder, duplicate, and remove blocks; most visual sections share appearance and responsive spacing controls. A block error boundary isolates a failing block so the remainder of the Page can still render. Live preview uses the production renderer for every Page block, including blocks reached through Reusable Sections; inspect desktop, tablet, and mobile sizes before publishing.

`Reusable Section` references a shared block stack. Reusable Sections intentionally cannot contain another Reusable Section; runtime rendering also stops nesting after depth 10.

## Choosing A Block

The Add Block drawer is searchable and organized by editorial intent:

- **Start** establishes the page opening or inserts an approved shared section.
- **Explain** presents the main institutional story, structured content, or programme information.
- **Explore** helps visitors browse collections, departments, galleries, or answers.
- **Prove** adds evidence such as metrics, testimonials, and accreditations.
- **Convert** gives visitors a clear next action, contact route, or document.
- **Advanced Library** contains specialized alternatives that remain fully supported and searchable.

The first five groups form the client-approved 20-block vocabulary. Advanced blocks are not hidden or permission-restricted, so existing pages always remain editable.

For a new one-client deployment, developers customize the groups in `src/blocks/blockCatalog.ts`. Keep every Page-compatible block classified exactly once, retain Reusable Section and News/Event template exclusions, and run the catalog and registry contracts before handoff. Editors do not manage this vocabulary through Site Settings.

## Page Recipes

Full-page creation starts with **Blank Page** or **Landing Page**. Blank Page has no layout blocks. Landing Page starts with Page Header followed by an automatic Breadcrumb. Recipes are editable starting points: after the draft opens, editors can remove or reorder those blocks and add any block from the complete catalog.

Page creation inside a relationship drawer retains Payload's native blank form so the newly created Page can return to and populate the parent field safely.

## Linking To Page Sections

Every Page-compatible block has an optional **Section Anchor ID** field. Use a short, stable value
such as `admissions` or `student-services`. It must begin with a lowercase letter and may contain only
lowercase letters, numbers, and single hyphens; enter the value without `#`.

Use a Custom URL destination to link to the section:

- `#admissions` links from the current Page.
- `/programmes#mbbs` links to a section on another Page.

The browser scrolls smoothly to the section, leaves clearance for the sticky Admin bar,
announcement, and Header, and switches to immediate movement when the visitor prefers reduced
motion. Anchor IDs must be unique across the complete rendered Page, including blocks inside Reusable
Sections. Direct duplicates in one layout are rejected; if nested or repeated Reusable Sections
still produce a conflict, the first section in document order keeps the ID.

## Content And Theme Settings

Every configurable visual block uses the same two top-level tabs:

- `Content` contains the text, media, links, and repeating content rows.
- `Theme Settings` contains appearance, alignment, spacing, and presentation controls.

Genuine card rows use the same nested tabs. Their `Theme Settings` tab offers `Default Card`, `Primary`, `Secondary`, `Muted`, and `Accent` backgrounds. These are semantic theme surfaces rather than fixed colors: foreground text, supporting copy, icons, borders, links, and matching filled buttons automatically use readable colors in both light and dark mode.

The setting follows the selected presentation. Content Highlights applies it to Numbered Steps; Testimonial Grid applies it to Grid and Featured; Awards List, Download List, and Numbered Steps apply it to their Cards presentation. Minimal, list, table, row, connector, gallery, logo, menu, and other utility presentations intentionally keep their established geometry instead of becoming artificial cards. Bento Grid keeps its existing `Background` field but uses the same semantic surface values.

## Block Catalog

| Block                    | Use it for                                   | Important dependency or behavior                                                                                                                                                                                                                                                                                                                     |
| ------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Announcement             | In-page notices                              | Separate from the site-wide announcement in Layout Defaults                                                                                                                                                                                                                                                                                          |
| Banner CTA               | Image-backed conversion banner               | Media overlay, alignment, height, and section actions                                                                                                                                                                                                                                                                                                |
| Call to Action           | Prominent conversion prompt                  | Supports section actions                                                                                                                                                                                                                                                                                                                             |
| Hero Banner              | Single lead story                            | Media, overlay, alignment, and height controls                                                                                                                                                                                                                                                                                                       |
| Hero Carousel            | Rotating hero slides                         | Client carousel behavior                                                                                                                                                                                                                                                                                                                             |
| Gallery Coverflow        | Coverflow media presentation                 | Client carousel behavior                                                                                                                                                                                                                                                                                                                             |
| Feature Spotlight        | One highlighted feature                      | Image/content arrangements                                                                                                                                                                                                                                                                                                                           |
| Testimonial Spotlight    | One image-led leadership message             | Optional aligned section header/actions and centered footer actions; one person; image side, crop, fill, section appearance, spacing, inner alignment, semantic container background/outline                                                                                                                                                         |
| Feature Matrix           | Feature comparison grid                      | Repeating feature cards with independent semantic backgrounds                                                                                                                                                                                                                                                                                        |
| Content Highlights       | Curated content cards                        | Per-item backgrounds apply to Numbered Steps                                                                                                                                                                                                                                                                                                         |
| Editorial Reasons        | Institutional strengths                      | Four proportion presets, aligned section content, left/right placement, optional sticky introduction, and a responsive one-to-four-column numbered grid                                                                                                                                                                                              |
| Academic Programmes      | Configurable programme directory             | Grid, List, or Detailed Cards with optional images, category filters, duration pills, configurable icons and facts, per-card actions, section actions, and semantic card backgrounds                                                                                                                                                                 |
| Leadership Profiles      | Static leadership directory                  | Standard shows all metadata on a shared surface. Image Overlay uses fixed 4:5 portraits and shared overlay controls, showing label/name/designation only; other metadata stays saved for Standard. Legacy content defaults to Standard; 2–4 columns; non-clickable.                                                                                  |
| Department Profiles      | Searchable department-wise faculty directory | Configure departments in public filter order, then expand each department to manage its profiles. The block supports up to 400 profiles total. Search, department filtering, featured profiles, Load More, responsive card sizes, frames, and missing-image presentation remain configurable.                                                        |
| News & Events Highlights | Prioritized Event carousel                   | Up to three manually featured eligible Events followed by three automatic current/upcoming Events, scoped to selected or all active Event classifications, with configurable top/bottom controls, shared image/overlay settings, and the bundled SNMIH image fallback                                                                                |
| News Grid                | Editorial News & Events grid                 | Shows every published classification in newest-published order while excluding expired Events; supports 2–4 desktop columns and an optional final feature card                                                                                                                                                                                       |
| News & Events Tabs       | Complete News & Events directory             | Card Grid or full-row Editorial List under configurable classification tabs; All stays first, Load More reaches every published entry, and Event tabs place current/upcoming Events before recent past Events                                                                                                                                        |
| Calendar                 | Month and timeline event schedule            | Uses one to five active Event classifications; its interface inherits the selected section background; desktop opens as Calendar, phones open as Timeline, Upcoming remains stable, adjacent-month dates can be muted or hidden, and the optional PDF sits at the bottom of one full-height desktop sidebar with separate document and button labels |
| Annual Calendar          | Twelve-month institutional event stream      | Defaults to January–December in the configured site timezone or accepts start/end dates whose months define one exact 12-month academic range; renders a chronological Year Stream beside the same full-height Upcoming/PDF sidebar, with Download anchored at the desktop bottom and natural compact-layout flow                                    |
| Profile Carousel         | People/profile cards                         | Client carousel behavior and independent card backgrounds                                                                                                                                                                                                                                                                                            |
| Gallery Showcase         | Layered image showcase                       | Interactive presentation                                                                                                                                                                                                                                                                                                                             |
| Event Gallery            | Rectangular album quilt and optional viewer  | Uses one first-image cover per selected Gallery Album; count-aware 1–4 column spans close every grid cleanly, with a positionable details stack, shared overlays, and optional slideshow                                                                                                                                                             |
| Gallery Album Tabs       | Filterable album image directory             | Derives tabs from selected Gallery Albums, keeps All first, reveals images in batches, and opens the complete active tab in the shared slideshow                                                                                                                                                                                                     |
| Image Mosaic             | Manual or album-backed image composition     | Uses up to eight manual Media images or explicitly selected Gallery Albums; album tiles can open the shared slideshow                                                                                                                                                                                                                                |
| Student Experience       | Asymmetric image-led experience mosaic       | Uses up to five Media images; first card spans both rows in the desktop composition                                                                                                                                                                                                                                                                  |
| Stats Strip              | Animated metrics                             | Numeric values and labels                                                                                                                                                                                                                                                                                                                            |
| Q&A Accordion            | Expandable questions                         | Stacked or Split composition with Balanced 50/50, Section Content Focus 60/40, or Q&A Focus 40/60 proportions; left/right Q&A placement, top/center/bottom section-content alignment, optional Profile and Contact Prompt in Split mode, and accessible accordion interaction                                                                        |
| Rating Spotlight         | Aggregate rating summary                     | Reads published Reviews                                                                                                                                                                                                                                                                                                                              |
| Review Feed              | Paginated review list                        | Uses `/api/review-feed` after the initial render                                                                                                                                                                                                                                                                                                     |
| Review Submission        | Public review form                           | Requires a Form with review intent                                                                                                                                                                                                                                                                                                                   |
| Contact Form             | General or lead form                         | Requires `name`, `email`, `subject`, and `message` fields; optionally renders an exact-name `phone` field using the Phone type                                                                                                                                                                                                                       |
| Regional Offices         | Office/map cards                             | Reads Office Locations                                                                                                                                                                                                                                                                                                                               |
| Team Showcase            | Team member grid                             | Structured profile fields and independent card backgrounds                                                                                                                                                                                                                                                                                           |
| Services                 | Service cards                                | Repeating service items                                                                                                                                                                                                                                                                                                                              |
| Rich Text                | General formatted copy                       | Shared long-form Lexical typography with configurable reading width                                                                                                                                                                                                                                                                                  |
| Video Embed              | External video                               | Valid provider/embed URL                                                                                                                                                                                                                                                                                                                             |
| Media Carousel           | Scrollable media slides                      | Client carousel behavior and independent slide-card backgrounds                                                                                                                                                                                                                                                                                      |
| Program Matrix           | Academic programmes or structured offerings  | Stacked or 40/60 split introduction beside a seamless matrix with one to four responsive matrix columns, left/right placement, top, center, or bottom vertical positioning, flexible Lucide icons, semantic card backgrounds, and one optional per-card Link or Button action                                                                        |
| Partner Directory        | Insurer and partner logo directory           | Integration 23 bordered grid; optional logos, detail dialogs, and shared actions; found in Advanced Library.                                                                                                                                                                                                                                         |
| Logo Marquee             | Scrolling rows of partner logos              | Logos 20 opposing marquees with pause, static reduced-motion fallback, and editable rows; no split layout.                                                                                                                                                                                                                                           |
| Logo Strip               | Partner/accreditation logos                  | Optional marquee behavior                                                                                                                                                                                                                                                                                                                            |
| Page Header              | Inner-page heading                           | Eyebrow/title/description/actions                                                                                                                                                                                                                                                                                                                    |
| Breadcrumb               | Standalone page trail                        | Uses automatic hierarchy or editor-authored breadcrumb items                                                                                                                                                                                                                                                                                         |
| Timeline                 | Chronological milestones                     | Ordered timeline items                                                                                                                                                                                                                                                                                                                               |
| Icon Card Showcase       | Icon-led cards and values                    | Cards per Row supports 2–4 desktop columns; cards collapse responsively and support semantic backgrounds and actions                                                                                                                                                                                                                                 |
| Icon Grid                | Icon-led benefits and responsibilities       | Card, Contact Cards, Minimal, Icon Top, or Ruled Columns; ruled items use continuous responsive dividers and inherit the section surface                                                                                                                                                                                                             |
| Quote Block              | Quotation or pull quote                      | Quote and attribution                                                                                                                                                                                                                                                                                                                                |
| Tabs Content             | Grouped tab panels                           | Client tab interaction                                                                                                                                                                                                                                                                                                                               |
| Download List            | Files and document libraries                 | Stacked or responsive 40/60 split introduction, four document layouts, one shared 1–8 Columns setting, optional file icons, controlled file-type labels, and up to two ordered per-document Download, View, or Custom actions                                                                                                                        |
| Fee Structure            | Programme fee schedule                       | Default responsive table/cards or a 50/50 Programme Cost Atlas, one to four category tabs, fee-only notes, and a File action with View or Download behavior                                                                                                                                                                                          |
| PG Fee Structure         | Department-based postgraduate fees           | A responsive 50/50 Primary/Card department atlas with category-owned departments, shared or department-varying fee columns, category notes, and an official File action with View or Download behavior                                                                                                                                               |
| Bank Details             | Official payment account information         | One to six purpose-specific accounts in an admin-selected Text or locally generated Scanner presentation, with mirrored 36/64 panels, editable ledger labels, adaptive tabs, and exact-value copy controls                                                                                                                                           |
| Document Checklist       | Required documents and certificates          | Visitor tracker: ticked checklist rows with saved-on-device progress, Print and Clear, notes in a themeable sidebar; Stacked or Split layout, Roman/number/check markers, condition tags                                                                                                                                                             |
| Contact Numbers          | Helplines and desk phone numbers             | Five layouts (Switchboard, Call Desk, Desk Cards, Help Ribbon, Department Directory) with tap-to-call, Copy, optional WhatsApp/email, and "Open now" from each contact's hours                                                                                                                                                                       |
| Numbered Steps           | Ordered process                              | Backgrounds apply to numbered Cards, not connected/alternating layouts                                                                                                                                                                                                                                                                               |
| Bento Grid               | Mixed-size feature cards                     | Grid layout and semantic background controls                                                                                                                                                                                                                                                                                                         |
| Testimonial Grid         | Curated testimonials                         | Backgrounds apply to Grid and Featured cards                                                                                                                                                                                                                                                                                                         |
| Awards List              | Awards and recognition                       | Backgrounds apply to Cards, not table/row presentations                                                                                                                                                                                                                                                                                              |
| About Section            | Editorial about layout                       | Media and actions                                                                                                                                                                                                                                                                                                                                    |
| Accreditation Cards      | Accreditation and certification summary      | Two-to-four columns with shared semantic card and icon treatments                                                                                                                                                                                                                                                                                    |
| Reusable Section         | Shared block group                           | Reads one published Reusable Section                                                                                                                                                                                                                                                                                                                 |

Editorial Reasons uses Full Width to place its introduction above a container-wide list. Its
List Focus, Balanced, and Introduction Focus proportions apply on large screens and stack the
introduction before the list on smaller viewports. Section Content Alignment moves its eyebrow,
heading, description, and actions together. List Columns selects an explicit one-, two-, three-, or
four-column desktop composition; multi-column layouts collapse responsively on smaller screens.
List Border Style can leave only internal dividers (`Open`), retain the top and bottom rules
(`Ruled`), or wrap the entire list (`Framed`). Dividers inherit the active surface foreground at
low opacity, matching Stats Strip on light, dark, and Primary backgrounds.
Number Layout offers Stacked, Inline, and Three Columns. Three Columns places each generated
number, title, and description in separate desktop columns, then moves the description beneath the
title on smaller screens. It always uses one outer list column; choose List Focus, List Position
Right, Introduction Alignment Top, and Ruled borders to reproduce the reference-style composition.

Department tabs support **Content Width**, **Centered Auto Width**, and **Equal Full Width**.
Centered Auto Width shrink-wraps and centers the rail when it fits, then remains horizontally
scrollable from the inline start when it overflows. Equal Full Width divides the available tab rail
evenly; when Search is visible, that means the remaining toolbar space beside Search.

Download List keeps existing Card, List, and Compact documents compatible. Compact now falls back to
Inline List and is no longer selectable. Open Grid keeps top/bottom outer rules while leaving the
left/right edges open; Framed Grid adds one complete square outline. One shared **Columns** control
supports one to eight responsive columns in every presentation and defaults or falls back to three.
Only Boxed Card Grid applies independent semantic item backgrounds. Boxed Card, Open Grid, and
Framed Grid always keep the file-type badge at the top right. Their **Grid Icon Position** places the
Small, Medium, or Large main document icon either Above Title or Left of Content without moving the
badge. **Show File Icon** defaults on and controls the main icon in every presentation.
**File Type Label** is an optional PDF, DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX, or ZIP override.
Leaving it empty detects the type from the uploaded Media file. Historical explicit labels remain
readable in uppercase, while document categories and visitor category filtering are no longer part
of the block.

**Section Layout** keeps the introduction Stacked by default or places it beside the document
collection in a responsive 40/60 Split. Split sections support Left or Right introduction placement
and Top, Center, or Bottom vertical alignment. On smaller screens the introduction always returns
above the documents. If no introduction content is authored, the documents retain the full container
width.

Inline List never shows the file-type badge. Each ruled item keeps the optional file icon at the
upper-left, title and supporting text in a flexible wrapping column, a permanent vertical divider,
and compact button actions or visible Custom Links at the far right at every width. Legacy Compact
content uses the same Inline presentation and shared Columns value without a migration.

Each document owns an ordered **Document Actions** list with at most two entries. Download uses the
uploaded file and the fixed animated Download icon; View uses View URL first, falls back to File
Upload, and uses the fixed Eye icon. Both are buttons with editable labels and sensible label
fallbacks. Custom actions use an internal Page or Custom URL and can be a visible text Link or a
Button with a shared semantic variant and optional **Show Arrow** control. Show Arrow appears only
for Custom Buttons and uses the shared animated trailing arrow. Duplicate Download or View actions
are rejected, and two Custom actions must use different destinations.

**Grid Action Display** applies to Boxed Card, Open Grid, and Framed Grid. Labelled grids show the
Download and View labels with their fixed icons. Icon only and Inline List compact only those fixed
actions to accessible icon controls with their labels retained as names and tooltips. Custom Buttons
stay visibly labelled in every layout and add the trailing arrow only when Show Arrow is enabled.
Custom Link always remains an underlined text link without an icon or arrow. A non-empty Document
Actions list is authoritative, so invalid rows are omitted without exposing hidden legacy fallbacks.
Documents without the new list preserve compatibility in this order: the current Custom Action is
appended to available automatic actions; otherwise valid older manual actions replace the automatic
fallback; otherwise the saved automatic View/Download settings render unchanged. These compatibility
controls remain stored but hidden from new editing, so no content migration is required.

Fee Structure models one programme and one academic session per block. Every category owns its
ordered academic-period columns, fee rows, text values, and fee-only notes. Each row must contain
exactly one value for every configured column. Values are display text, totals are entered manually,
and missing amounts must be authored explicitly rather than calculated, converted, or inferred.
Category notes render only with their category. **Fee Layout** defaults to **Table & Mobile Cards**,
which keeps the programme/session context band, semantic desktop table, and one mobile card per
period. **Programme Cost Atlas** instead creates a 50/50 Primary/Card editorial composition on large
screens and stacks it on smaller screens. Its left summary contains programme details, the first
authored Total row as Annual totals, category notes, a required category-owned Complete programme
expense, and the file action. Complete programme expense is manually authored and required for
every Atlas category; it is never calculated from Annual totals. The right statement shows each remaining fee head once with all of
its authored period values; later Total rows remain there. The statement heading displays the
authored category label verbatim beneath the **Statement breakdown** eyebrow. Atlas does not calculate or reorganize
values beyond moving that first authored Total row. Atlas uses standard sans-serif titles,
left-aligned period labels and values, matched two-half spacing, and semantic Primary/Card colors.
New blocks start Additional Programme Details with an editable **Programme Duration** / **4.5 Years**
row; editors can change or remove it, and existing saved blocks are not backfilled.
Both fee blocks use an optional **Fee Document Action** with the shared File action controls.
Remote Media downloads use a same-origin attachment endpoint so files on a separate asset domain
download instead of opening in the current tab. The Media record must be published; View keeps
the direct file URL. Local relative file URLs continue to use the browser's download attribute.
Choose **View** or **Download**, set the label, use an underlined Link or configured Button, and
choose whether View opens in a new tab. The outlined document container retains its shared
semantic background settings. Existing fee documents, labels, and styles populate this action
as downloads until edited; removing the action keeps it removed after saving. Multiple-category tabs can use **Content Width**,
**Centered Auto Width**, or **Equal Full Width**. Centered Auto Width shrink-wraps and centers the
category tabs when they fit, then returns them to the inline start inside the existing horizontal
scroller when long labels or narrow viewports overflow. In the table layout, standard desktop fee-name
cells use normal weight, Total rows are bold, and every desktop body row uses one continuous,
theme-aware Accent or brand surface across its sticky label and value cells. Bank, payment-account,
and online-payment details must not be entered in this block.

PG Fee Structure is the department-based companion to Fee Structure. It models one programme and
one academic session per block, with one to four independent fee categories such as General and
NRI. Each category owns its fee columns, departments, notes, and currencies. Configure each column
as **Changes by Department** or **Shared Across Departments**. Enter a shared value once; for every
department, enter values only for the changing columns and preserve their displayed column order.
The block validates duplicate category, column, and department labels, requires every shared value,
and requires the exact number of department-specific values.

Amounts remain authored display text. The visitor presentation does not parse, add, format, infer,
or convert currencies. Large screens use a 50/50 Primary/Card department atlas. Its Primary summary
contains programme, academic session, active admission category, department count, shared charges,
category notes, and the optional official Media Link or Button panel. The Card statement renders one
complete chapter per department and repeats shared values so every chapter remains self-contained.
Its heading repeats the active category label exactly, without generated suffix text. With up to four
departments, the atlas keeps its natural height. From the fifth department onward,
large screens use a 676px frame: the Primary summary and statement header remain visible while the
department chapter list scrolls. Compact layouts always keep every chapter in normal page flow.
Compact layouts stack summary then statement, and fee grids reflow without page-level horizontal
scrolling. Within each compact department chapter, fee values follow the Fee Structure Atlas ruled
pattern: two values per row, paired vertical rules, horizontal row rules, and a full-width final value
when the column count is odd. Large layouts retain the adaptive fee grid. One category renders
directly; multiple categories use the shared Underline, Pills, or Boxed tabs with Content Width,
Centered Auto Width, or Equal Full Width and switch the complete atlas. The block exposes no
alternate layout selector, calculated-total fields, or payment-account fields.

Document Checklist lists the certificates and documents an applicant must upload or bring for
verification. Editors add up to 60 ordered items, each with a required document name, an optional
short condition tag such as "If required", and optional supporting details, plus up to six notes.
By default visitors can tick documents off as they collect them: a sidebar shows "N of M ready", a
progress bar, Print checklist, and Clear ticks. Ticks are stored only in that visitor's browser,
keyed to the block and each item, so reordering items keeps them and removed items stop counting;
nothing is sent to the site. Editors can turn tracking or the Print button off under **Theme
Settings**, which leaves a static numbered list. **Show progress panel** controls the coloured
panel; when it is hidden, the progress count, Print, and Clear move into the checklist header and
notes appear below the checklist.

The block shares the standard section options: eyebrow, title, Accent Title, description, Section
and Footer Actions, appearance, Section Anchor, Left/Center/Right content alignment, and padding.
Stacked places the introduction above the checklist and sidebar; Split places the introduction and
sidebar beside the checklist with Balanced, Checklist Focus, or Section Content Focus proportions,
a left or right checklist, and Top, Top (stays in view while scrolling), Center, or Bottom alignment. The
Progress & Notes Panel Background uses the shared card backgrounds and defaults to Primary.
**Presentation** chooses the look: Tracker (default) is a bordered checklist card; Editorial
Ledger drops the card for hairline rules, italic serif numerals, condition tags set in italic at
the right, and notes as footnotes, sitting directly on the section background (including Brand).
Every other option works with both. For the calmest ledger, turn off visitor ticking and the
progress panel.

Numbering offers Roman numerals, numbers, or check icons. Checklist Columns offers one, two, or
three columns in both Stacked and Split layouts: items read top to bottom in rows aligned across
columns, and columns are added only when the checklist itself has room (two from about 576px wide,
three from about 768px), so phones and narrow split columns fall back automatically. Three columns
in Split need the Checklist Focus proportion on desktop. Blank items and notes are omitted, and
the block renders nothing without a heading and at least one item.

Contact Numbers lists helpline and desk numbers. Each contact needs a phone number, shown exactly
as typed and linked for tap-to-call, and can add a label, desk or person name, Directory Group,
email, an "Also on WhatsApp" switch, and hours (days plus 24-hour opening and closing times, or a
free-text Hours Text). Choose the presentation under **Theme Settings → Layout**:

- **Switchboard**: large numbers in ruled rows with Copy and Call buttons.
- **Call Desk**: a card of tap-to-call rows with the Availability Note in its footer.
- **Desk Cards**: one card per desk with hours, status, Call, and Copy; 2, 3, or 4 columns.
- **Help Ribbon**: a compact strip of number chips for use between sections or above the footer.
- **Department Directory**: rows with number, email, WhatsApp, and Copy, tabbed by Directory Group.

Switchboard, Call Desk, and Directory can place the section content left of, right of, or above the
numbers. When a contact has days and times, visitors see "Open now" or "Closed now", calculated in
the block's Hours Timezone (default Asia/Kolkata) and updated each minute. Copy buttons and the
status badge can each be turned off. The block also has the standard section options: eyebrow,
title, Accent Title, description, Section and Footer Actions, appearance, Section Anchor,
Left/Center/Right alignment, and padding.

Bank Details is the dedicated home for official transfer information. Editors add one to six bank
accounts in visitor order and give each account a unique payment purpose, account holder, account
number, and IFSC code. Bank name, Branch & Type, UPI ID, and account-owned instructions are optional
and disappear completely when blank. Banking values are stored as text and displayed exactly as
authored after outer whitespace is removed, so leading zeroes, internal spaces, and punctuation
remain intact. Rows missing a core field are omitted, and duplicate purpose labels keep the first
valid row in authored order.

One valid account renders directly. Multiple accounts use the shared Underline, Pills, or Boxed tab
rail with Content Width, Centered Auto Width, or Equal Full Width. Editors choose Text or Scanner
mode and place the contextual panel on the desktop left or right under **Theme Settings**; visitors
never receive a mode switch. The contextual Primary panel remains the 36% track on either side, and
the white ledger remains 64%. Compact screens always stack contextual content before the ledger
without an internal scroller. Text mode shows optional contextual copy and the active account notice,
with a guaranteed compact-screen gap between the description and notice. Scanner mode generates a
local SVG QR from the same normalized credentials-only payload used by Copy all, without an upload or
third-party request. Payment Purpose and instructions remain visible page context but are excluded
from Copy all and QR. Payment Purpose is reused unchanged for the account tab and white-ledger
eyebrow.

Under **Content**, the optional **Ledger Text** group customizes the ledger title, verification text,
credential labels, and Copy all label. Each blank, missing, or malformed nested
value independently falls back to its English default, so existing blocks need no migration. The
context label, context title, context description, account values, and account instructions retain
their existing fields; operational success, clipboard error, and QR messages remain system-owned.
The contextual title uses the upright display family; the ledger title uses the upright sans family;
shared surface-aware green accents distinguish its eyebrows and credential labels. The fixed-white
ledger uses the light-overlay foreground contract in every website color scheme. Every visible
credential can be copied individually through controls with compact-screen touch targets. Copy all
uses smaller text without shrinking that target. Copy feedback is announced politely, clears after
two seconds or an account change, and gives a manual-selection recovery message when clipboard access
is unavailable.

Event Gallery uses the first valid image from every selected Gallery Album as the album cover and
can open the complete album in its full-screen viewer. Disable **Enable Album Slideshow** to retain
the same image and overlay presentation as a static, non-focusable tile. The section title is optional;
when all header fields and Section Actions are empty, the album quilt renders without a header or an
empty header gap. **Overlay Display** offers Always Visible and Reveal on Hover; existing Event
Gallery blocks remain Always Visible. Hover mode also reveals on keyboard focus and remains visible
on touch devices. This choice does not change slideshow interaction. Every overlay position stacks the image icon and
numeric count, event date, and text-family title in that order. Bottom Left aligns the stack left;
Bottom Center and Center — Vertical & Horizontal center it. Disabled or unavailable metadata closes
naturally without leaving an empty row.

Gallery Album Tabs is the directory-style companion to Event Gallery. Editors explicitly select
and order Gallery Albums; each album title becomes a tab, while a configurable **All** tab always
appears first. All combines the selected albums in resolved order and removes duplicate Media
images, while individual album tabs retain their complete contents. **Images Per Load** supports 6,
9, or 12 images and the local Load More action remembers progress independently for each tab. Tiles
use the shared rectangular quilt without overlay copy; selecting one opens the complete active-tab
image set at that position in the shared slideshow. Contained, Pill, and Underline tab variants use
semantic theme tokens, with Underline as the default and fallback. Tabs size to their labels while
the outer rail spans the block container. On compact screens or with long labels, the single-row rail
scrolls horizontally rather than wrapping or distributing tabs equally. Production uses selected
published albums; authenticated live preview uses the selected draft album snapshot loaded by the
server.

Image Mosaic defaults to **Manual Images**, including saved blocks created before the Content Source
field existed. Manual mode preserves its one-to-eight uploaded images, per-image crop position,
optional title, and action; manual images never open an album slideshow. **Gallery Albums** mode
accepts up to eight explicitly selected albums and renders one first-image cover per album. Editors
choose Manual order or Latest Event Date, can hide the date/count rows, place the overlay Bottom Left,
Bottom Center, or fully centered, and can disable album slideshow interaction without hiding the
tiles. **Overlay Display** offers Always Visible and Reveal on Hover for both Manual Images and
Gallery Albums; existing Image Mosaic blocks retain Reveal on Hover. Keyboard focus reveals hover
content, while touch devices keep it visible. Production loads only selected published albums. Authenticated live preview receives the
selected draft album snapshot from the server and performs no browser-side Payload query.

News & Events Highlights keeps the internal `newsEventsHighlights` block identity and renders only
published, non-expired Events. It shows up to three Events checked **Featured in Highlights** first,
then up to three non-featured current or upcoming Events. Each group is ordered by Event Start and
the combined result is de-duplicated. Editors can select active Event classifications under Content;
an empty selection includes every active Event classification, while a selection strictly limits the
carousel. Timed featured Events require Event End. All-day Events remain eligible through the final
local calendar day defined by Event End, or Event Start when no end is set. Autoplay and the Empty
State Message remain configurable; slide content remains owned by the News & Events collection.
Carousel Controls Position places the status and previous/next controls above or below the carousel.
Bottom remains the default and legacy fallback.

Image Position Override can retain each item setting or force Center, Top, Bottom, Left, or Right
across the block. Overlay Tone, Strength, Direction, and Coverage use the shared semantic media
controls. Existing blocks without the new settings render with the legacy Dark, Darker,
Bottom-to-Top, Full overlay. Missing or failed media uses the bundled SNMIH image centered as
decorative content. The large story and responsive rail stay synchronized; optional autoplay pauses
on interaction and respects reduced-motion preferences. From tablet widths, the featured panel and
vertical rail share a 36rem height. Three equal supporting cards fill that height; card titles use one
line and descriptions use two lines. Phone widths retain the horizontal supporting-card rail.

News Grid automatically shows all published News & Events classifications in newest-published order
while excluding expired Events. It retains its established grid, feature-card option, and title
requirement, supports 2–4 desktop columns, and can reserve the final slot for an optional feature
card. **Default Action Label** applies to non-event records; **Event Action Label** applies only to
Events. Use the separate News & Events Tabs block for a configurable directory. All always renders first; editors
can add, remove, rename, and reorder the seven supported classification tabs without changing the
classification assigned to each entry. Editors choose 3, 6, 9, or 12 entries per tab. Under **Theme
Settings**, **Layout** selects Card Grid (the default and legacy fallback) or Editorial List; **Cards
Per Row** appears only for Card Grid and retains the existing 2, 3, or 4 desktop-column choices.
**Items Per Tab** controls the initial number of entries and each later Load More batch. **Load More
Label** customizes the button shown only when the active tab has another page. Loaded entries remain
available when visitors switch tabs; refreshing the page returns to the initial batch. Load More can
reach every published entry in the selected classification. Story classifications use
newest-published order. Event classifications show current and upcoming Events earliest-first,
followed by past Events most-recent-first. The manual Highlights checkbox does not affect this
directory. The section
header is optional; shared appearance, header actions, footer actions, alignment, spacing,
empty-state, and action-label controls remain available. Card Grid keeps its text-only semantic card
surfaces. Editorial List renders each entry as a responsive full-row link with a date column, a
badge-above-title column, excerpt, and the shared animated arrow. Both layouts use theme-scale
`text-xl` semibold titles and `text-base` normal-weight descriptions with bounded line lengths. In
Editorial List, the title and description use equal-width tracks, the arrow has a wider trailing
track, and the date and arrow center vertically while one equal desktop gutter separates every
column. Under **Theme Settings**, **Tab Variant** offers the same Contained, Pill, and Underline
treatments as Gallery Album Tabs; Underline is the default and fallback. Tabs size to their labels
while the outer rail spans the block container. At narrow widths or with long labels, the configured
tabs remain on one horizontally scrollable row instead of wrapping or distributing equally.

`News & Events Content` is a global-only dynamic block for `Configuration > News & Events Detail
Page`; it is intentionally absent from Pages and Reusable Sections. The global accepts the same
ordered block catalog as Pages and requires exactly one dynamic content block when published. That
block binds the current News & Events entry automatically and renders its image, classification/title
overlay, excerpt, Lexical body, Story Details, and optional Share This card. Editors can configure
section appearance, spacing, featured-image ratio, sidebar card surface/outline, and the shared
overlay controls. Missing overlay settings use Dark, Darker, Bottom to Top, and Full, while a missing
featured image uses the bundled SNMIH fallback. Standard Page blocks before and after it retain their
saved order, and automatic Breadcrumb blocks receive the current entry trail in production and live
preview. On desktop, the main story shares the row with a fixed `30rem` right sidebar column.

Every project-owned Lexical field uses the same complete, always-visible fixed toolbar and reserves
H1 for the surrounding page or entry title while exposing H2–H6. Article, News/Event, and Rich Text
content use the shared long-form presentation, while Q&A answers retain the compact presentation;
toolbar consistency does not change stored content or public typography. Both presets style
Payload's semantic paragraph, list, checklist, blockquote,
emphasis, link, code, image, and horizontal-rule output. Rich-text headings use the text-family token
rather than the display family. Long-form H2–H6 use a compact descending text-family scale, with H2
capped by the shared 28px editorial token, plus tuned heading, paragraph, list, quote, code, image,
and rule rhythm. The shared preset suppresses Payload's empty `<p><br></p>` output. Story Details
keeps regular mono labels while values use the normal text family; only date values use tabular
numerals.

Q&A Accordion introductions use the full available width for Left, Center, and Right alignment.
In Split mode, supporting profiles, contact copy, and actions follow that alignment too. Use
**Theme Settings → Supporting Actions Position → Bottom of Column** to place Contact Prompt links
or buttons at the foot of the section-content column on desktop. **After Content** keeps them with
the supporting copy and is the default for existing content. On smaller screens, supporting actions
follow the content before the questions; Stacked mode hides supporting content. Section Actions
remain separate and follow any bottom-positioned supporting actions.

Headers use the `Header Navbar 12` block, Footers use `Footer 56`, and System Pages use exactly one matching `System 404`, `System Maintenance`, or `System Coming Soon` block. Those structural blocks are not selectable in normal Page layouts.

## Choosing Data-Owned Blocks

Prefer the data-backed blocks when the same records need governance or reuse:

- News & Events Highlights, News Grid, or News & Events Tabs when records should remain collection-owned
- Event Gallery or album-backed Image Mosaic instead of rebuilding an album from loose images
- Rating Spotlight or Review Feed instead of copying public reviews
- Contact Form or Review Submission instead of embedding an unmanaged form
- Regional Offices instead of repeating addresses on each Page

## Developer Thumbnail Workflow

The admin picker uses generated previews in `public/block-thumbnails`. The preview route exists only in development. See [Developer Workflows](../operations/developer-workflows.md) before regenerating all or one thumbnail.

## Partner Directory (Integration 23)

Add **Partner Directory** from **Advanced Library** in Pages or Reusable Sections. The Content tab owns
an optional eyebrow, title, italic accent, description, section/footer actions, and up to 100 ordered
Partners / Insurers. Each entry requires a name; its Media logo, details, and actions are optional.
Missing or failed logos show initials while the full name remains visible. Enter insurer information
as supplied by the hospital; the block does not infer coverage or eligibility.

Theme Settings provides the standard section background, borders, alignment, and padding, plus
1, 2, 3, 4, or 6 desktop columns and Enable Detail Dialogs. Smaller screens reduce the columns.

Stacked is the default layout, with an introduction above the full-width directory grid. Split places
section content beside the directory on desktop. Split Proportion defaults to Balanced (50 / 50);
Directory Focus (40 / 60) and Section Content Focus (60 / 40) are also available. Directory Position
can be Left or Right, and Section Content Vertical Alignment can be Top, Center, or Bottom. Section Content Alignment
controls left/center/right alignment within the header in either layout and also aligns footer actions.
The whole introduction uses the shared `max-w-3xl` (48rem) cap: heading, description, and
section actions follow the selected alignment. It fills narrower split columns, while the directory
keeps its allocated width.
Section actions stay with the header; footer actions follow the entire composition. Compact screens
always stack the header before the grid. Column selection is a maximum: split panels reduce their
column count according to the available panel width. Without any header content, Split falls back to
a full-width grid.

Item Layout applies to every tile independently of the section layout. Block (the default) places
the logo above text; Inline places a compact logo beside text. Item Alignment selects Left or Center
for the logo and name together, independently of Section Content Alignment. Long names wrap
without shrinking the logo. A one-column selection stays one column; two columns fit inside the
directory panel when space allows and collapse on narrow screens.

Directory Style selects Bordered Grid (the default) or Ruled. Ruled shows horizontal and vertical
dividers between items without an outer container border. Both styles support all column counts,
item layouts, and alignments.

With dialogs enabled, only entries with details or valid actions
become buttons. Disabling dialogs leaves every tile static. Dialogs support keyboard navigation,
Escape dismissal, and focus restoration. Links use the existing Page, Custom URL, or Media action fields.
The block is adapted from `@shadcnblocks/integration23`; its SaaS OAuth demo is replaced by editorial details.

## Logo Marquee (Logos 20)

Add **Logo Marquee** from **Advanced Library**. The Content tab owns the optional heading, eyebrow,
italic accent, description, section/footer actions, and a single **Logo Rows** list.
Click **Add Row**, then **Add Logo** inside that row. Drag any row or logo to reorder it.
Collapsed row labels show the row number and logo count; collapsed logo entries show the organisation name.
There is no fixed row-count limit; each row supports up to 40 logos. Each logo requires an
organisation name and a Media image. Rows alternate left and right by their saved position.
Existing Top/Bottom/Additional content is combined into the new editor when read and saved in the
unified format on the next edit. Clearing every row stays empty even when legacy fields still exist.
Empty rows and incomplete draft entries are omitted; an entirely empty block renders nothing.
Failed images fall back to the organisation name.

Theme Settings provides standard section appearance, left/center/right content alignment and padding,
plus scrolling on/off, Slow/Normal/Fast speed, logo height, optional organisation labels, and grayscale.
The section always stacks the full-width heading above its logo rows; it has no Split layout.
The description is capped at `max-w-3xl` (48rem) and follows the selected section alignment;
logo rows continue to span the full container.
The **Show Pause / Play Control** setting defaults on and displays an icon-only button for all rows.
Its size follows Section Padding: None/Compact 44px, Default 48px, Comfortable 56px. Hidden controls
leave scrolling active. Visitors can hover to pause an individual row. Reduced-motion preferences
and disabled scrolling show all logos as wrapping static rows. Screen readers receive each authored
name once rather than the repeated animation copies. Logos do not navigate; section/footer actions
use the shared Page, Custom URL, and Media link controls.

## Related Guides

- [Pages](./pages.md)
- [Reusable Sections](./reusable-sections.md)
- [Gallery Albums](./gallery-albums.md)
- [Office Locations](./office-locations.md)
- [News & Events](./news-events.md)
