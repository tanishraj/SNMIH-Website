# Block System

## Registries 

[blockCatalog.ts](../../../../src/blocks/blockCatalog.ts) is the server-only canonical Payload schema catalog for Page-compatible blocks. It assigns native Admin groups in this order: Start, Explain, Explore, Prove, Convert, and Advanced Library. The first five groups contain the client-approved 21-block vocabulary; all remaining Page-compatible blocks stay registered under Advanced Library. Pages expose 63 blocks and Reusable Sections expose the 62 non-recursive choices.

Partner Directory (`integration23`) adapts Shadcnblocks Integration 23 into an editorial insurer/partner
directory in Advanced Library. The shared client-safe adapter normalizes up to 100 ordered entries
for production and preview. Names are required; Media logos, descriptions, and shared actions are
optional. Missing or failed logos show initials. Only entries with descriptions or resolved actions
open accessible Radix dialogs, and Theme Settings can disable all dialogs. There is no OAuth or
insurance-eligibility logic. The bordered grid uses 1, 2, 3, 4, or 6 desktop columns, responsive compact
columns and shared semantic appearance, padding, and actions. The complete introduction uses
`contentIntroClasses` with its 48rem (`max-w-3xl`) cap and left/center/right grid alignment. It fills
narrower split columns; the directory retains its allocated width.
Stacked remains the default and fallback. Split defaults to a reversible 50/50 desktop composition,
with optional 40% content / 60% directory or 60% content / 40% directory proportions and independent
horizontal and vertical section-content alignment. Its directory uses
container queries to reduce columns within narrower panels. Mobile reading order is always content
then directory. Footer actions follow the complete composition; header actions stay with the content.
A split block without any header content returns to the full-width stacked grid.
Item Layout independently selects Block (logo above text, the default) or Inline (compact logo beside
wrapping text). Item Alignment selects Left or Center for the complete logo/name group independently
of section-content alignment. Both apply equally to static tiles and dialog triggers. Directory Style
selects Bordered Grid (the default) or Ruled: horizontal and vertical separators between items
without an outer container border. Right and bottom perimeter strokes are clipped at the grid edge. One- and two-column choices work in both section layouts.

Logo Strip’s scrolling mode uses the same transparent 8% edge mask as Logo Marquee on both sides,
so the fade blends with any section surface. Its static grid remains unmasked.

Logo Marquee (`logos20`) adapts Shadcnblocks Logos 20 into independently authored logo rows
moving in alternating directions. A single Logo Rows array contains nested Logos arrays with
native Add Row/Add Logo and drag-to-reorder controls. Row labels show position and logo count;
logo labels use organisation names. There is no fixed row-count limit, and every row permits 40 logos.
The client-safe `rows.ts` normalizer supplies both the adapter and the field afterRead/beforeValidate
hooks. Hidden legacy Top/Bottom/Additional fields remain readable: missing unified rows are hydrated
from those fields and saved on the next edit. Explicit empty arrays or null suppress legacy fallback,
so clearing the block never resurrects old logos. Scroll directions follow saved row positions,
including empty positions. It belongs to Advanced Library, uses a full-width stacked introduction
only, and shares section/footer actions, typography, appearance, alignment, and padding. Its
description has a 48rem (`max-w-3xl`) width cap with left/center/right alignment while logo rows
span the full container. Editors can
set scrolling speed, disable scrolling, choose logo height, show organisation names, and apply
grayscale. Show Pause / Play Control defaults on and uses the shared icon-only MotionToggle
with accessible Play/Pause labels. Section Padding selects the control size: None/Compact 44px,
Default 48px, Comfortable 56px. Disabling the control keeps scrolling active, including a previously
paused live preview. Other MotionToggle consumers keep their existing 44px default. Hover pauses
the hovered row. Reduced-motion preferences
render complete static wrapping lists, including during SSR, with preference changes handled live.
Animated duplicates are decorative while each authored name appears once per row for assistive
technology. Missing/incomplete entries are omitted; failed images fall back to organisation names.
Empty rows disappear, and a block with no valid logos renders nothing. Production and live preview
share the same client-safe adapter and presentation component.

Calendar is an Explore block backed only by selected active Event-behavior News & Events classifications. Editors choose one to five ordered classifications, while each classification centrally owns its semantic Calendar color. The complete toolbar, month/timeline panel, and Upcoming panel inherit the selected section surface; framed Tabs and Select controls share a true 44px height, and adjacent-month dates can be muted or hidden. The server renders the configured `Asia/Kolkata`-first current month and stable next-four Upcoming snapshot; visitor times remain timezone-correct but omit technical GMT/UTC suffixes. Desktop starts with a Sunday-first six-week grid, phones receive Timeline-first output, and `/api/calendar-events` supplies validated public or authenticated-draft month projections. Multi-day/all-day ranges are inclusive, day cells cap at two links before `+N more`, filtering never changes Upcoming, and production/live preview share the same serializable presentation contract. Editors may configure one sidebar action targeting a Page, Custom URL, or File and choose Button or Link presentation, while the existing document label remains the panel heading. Upcoming, its legend, and the action share one semantic sidebar; the rail matches the desktop calendar height and pins the action region to its bottom, while compact layouts keep natural source order and height. The sidebar action remains outside the month snapshot and cache identity.

Annual Calendar is the twelve-month Explore companion to Calendar. It uses the same strict one-to-five active Event-classification scope, site timezone, semantic calendar tones, section appearance/actions/alignment/spacing, and next-four Upcoming semantics. Editors use either the current calendar year or two day-only date pickers whose selected months define exactly twelve consecutive inclusive months; selected days are ignored. One shared normalizer owns production query bounds, persistent cache keys, authenticated preview scopes, the derived period label, and twelve month keys, while invalid custom periods fail closed before querying News & Events. Visitors receive a chronological Year Stream with a semantic spine, 10px square month markers, inset semantic month dividers, compact Current and event-count metadata, linked event cards, and lightweight empty-month copy. Coming Next remains independent of the selected period and stays beside the stream on desktop and below it on smaller screens. Calendar and Annual Calendar share one sidebar Download Panel field composer and resolver. The visible PDF Document Label remains `calendarPdfTitle`, while one canonical shared action supports Page, Custom URL, File View, or File Download destinations and Button or editorial Link presentation. Explicit variants, new-tab behavior, navigation arrows, and download-icon settings pass through unchanged. A non-empty new action is authoritative; rows saved by the preceding restricted schema use Button only as their missing-mode compatibility fallback. Hidden legacy PDF Media/label fields remain a no-migration fallback only when the new action is empty. The semantic panel stays at the bottom of the full-height desktop sidebar and renders through the canonical shared Content Actions system. Embedded Upcoming/action regions avoid nested landmarks and borders, and Annual Calendar intentionally gives up its former sticky sidebar to satisfy this full-height contract. Compact layouts retain natural flow, long labels wrap within the 20rem rail, and unresolved destinations produce no public link. Event queries, response snapshots, and cache identity remain unchanged. The block intentionally exposes no visitor navigation, view, filter, or pagination controls, and the uncommitted Month/Year controls require no migration.

[Pages.ts](../../../../src/collections/Pages.ts) consumes the complete 63-block Page registry. [ReusableSections.ts](../../../../src/collections/ReusableSections.ts) consumes the same registry without `reusableSection`, preventing direct recursion. [NewsEventsDetailTemplate.ts](../../../../src/globals/NewsEventsDetailTemplate.ts) consumes the Page registry plus `newsEventsContent`, which appears first under Template Core. The [block operator guide](../../../../docs/guides/blocks.md) owns the editor-facing group membership and per-deployment customization instructions.

The catalog imports schema config only. Production and live-preview renderer switches remain explicit and separate so server/client boundaries are not mixed.

Contact Form binds a published general/lead Form with the exact core fields `name` (Text), `email`
(Email), `subject` (Select), and `message` (Textarea). An optional exact-name `phone` field using the
Phone type renders as an international-friendly telephone input and may be required; Forms without it
retain the existing four-field presentation. Client and submission-route validation share the same
phone rule. The controlled input removes unsupported characters while typing or pasting, accepts a
single leading `+` plus common phone-number separators, and caps values at 15 digits and 25 total
characters. When present, Phone and Topic stack in that order on phones and share the second equal-width
form row from the small-screen breakpoint upward; Topic remains full-width when Phone is absent. Review
Submission retains its fixed review-field experience, and review-intent Form validation rejects
additional required fields that this renderer cannot display.

## Page Creation Recipes

[pageRecipes.ts](../../../../src/page-recipes/pageRecipes.ts) defines the two code-owned full-page creation recipes. Blank produces an empty layout. Landing produces `pageHeader` followed by `breadcrumb`; it copies the Page title into Page Header, selects an empty eyebrow as its top content to suppress the header's built-in breadcrumb, and configures the standalone Breadcrumb for automatic hierarchy resolution.

Recipes create editable drafts and never restrict the canonical 56-block registry. After creation, editors can remove or reorder recipe blocks and add any Page block. The guided setup replaces only full-page Page creation; relationship-drawer creation delegates to Payload's native form so the parent relationship workflow remains intact.

Restricted shell/system registries are separate:

- Headers: `headerNavbar12`.
- Footers: `footer56`, `footerMinimal`.
- System Pages: `system404`, `systemMaintenance`, `systemComingSoon`; exactly one block must match the selected system-page type.

Use [project-inventory.json](project-inventory.json) for generated paths, interfaces, files, and coverage rather than manually counting.

## Complete Block Change Contract

A Page block normally touches all of these surfaces:

1. `src/blocks/<Block>/config.ts` with a unique slug and explicit interface name.
2. `src/blocks/<Block>/Component.tsx`, plus optional client/presentation/preview modules.
3. Pages and Reusable Sections registration when the block is reusable.
4. [renderPageBlocks.tsx](../../../../src/blocks/renderPageBlocks.tsx).
5. [renderLivePreviewPageBlocks.tsx](../../../../src/blocks/renderLivePreviewPageBlocks.tsx).
6. Thumbnail definition, production-component fixture, and 1600×900 JPEG.
7. Generated Payload types.
8. Focused schema/rendering tests plus registration, preview, thumbnail, theme, and documentation contracts.
9. The maintained [block operator guide](../../../../docs/guides/blocks.md) and [feature inventory](../../../../docs/architecture/feature-inventory.md).

Production Page blocks are wrapped in `BlockErrorBoundary`, so one broken block does not crash the remaining layout. The production renderer assigns `preload` with high fetch priority only to the first renderable Hero Banner image in document order, sharing one assignment state through Reusable Section recursion and skipping heroes without usable media. Live preview does not assign that production preload or high priority. Reusable Section rendering stops after depth 10. Keep production/live-preview case coverage equal.

## Shared Configuration and Presentation

- `blockAppearanceFields.ts` and `blockAppearance.ts`: page/subtle/brand surfaces, gradients, borders, legacy normalization, and foreground resolution.
- `blockAnchor.ts` and `BlockAnchorWrapper.tsx`: the centrally decorated optional Section Anchor ID,
  URL-safe validation, direct-layout uniqueness, document-order duplicate suppression across
  Reusable Sections, and matching production/live-preview fragment markup. Custom URL actions use
  `#anchor-id` on the current Page or `/page-path#anchor-id` across Pages.
- `blockSpacing.ts`: regular container and responsive vertical spacing contracts.
- `cardThemeFields.ts` and `cardSurface.ts`: Default/Primary/Secondary/Muted/Accent card semantics.
- `contentActionsFields.ts` and `BlockFooterActions.tsx`: per-action links/buttons, variants, arrows, and footer actions. Shared actions support Page, Custom URL, and Media File destinations. File actions choose View or Download independently from Button/Link presentation; View has a file-specific new-tab preference, while Download forwards the Media filename through the anchor `download` attribute and routes absolute Media URLs through the shared `/api/media-download/[id]` attachment endpoint. The endpoint requires published Media and a configured trusted asset origin; relative local files retain direct URLs. Download List uses the same URL helper for its automatic and legacy actions. Download defaults to an animated Lucide down arrow on the left, which editors can move right or hide without changing File View or navigation-arrow behavior. Keep schema changes in `contentActionsFields.ts`, destination resolution in `src/lib/cmsLinks.ts`, and rendering semantics in `src/components/ContentActions.tsx` plus guarded specialized consumers.
- `FeeDocumentDownload.tsx`: canonical official fee-document panel, Link/Button presentation, download semantics, and brand-surface contrast shared by Fee Structure and PG Fee Structure.
- `contentStyles.ts`: shared section/card typography and link classes.
- `src/styles/globals.css`: the public semantic radius contract. Block cards and media frames use
  `rounded-card`, standard interactive controls use `rounded-control`, and small square details use
  `rounded-compact`; only intentional pills and circles use `rounded-full`. These roles derive from
  the active theme radius, cap card/control corners at 12px and compact corners at 4px, and do not
  apply to Payload Admin.
- `contentTabRail.ts`: Contained, Pill, and Underline tab geometry with light/brand surface-aware
  foreground, active, hover, and focus states. Contained applies the semantic `rounded-control` role
  to both its framed rail and triggers, Pill remains intentionally `rounded-full`, and Underline stays
  square. Underline uses a two-pixel active border that overlaps the rail divider so selection remains
  visible. Horizontally overflowing content-tab rails use one shared client viewport that measures
  native scroll position and shows radius-clipped inline-start/inline-end fades only while more tabs
  remain. Tabs Content maps its legacy Boxed, Pills, Segmented, and Underline values into this contract
  without changing saved content.
- `components/ui/tabs.tsx`: shared framed Tabs use the active website theme's Primary surface and
  paired foreground; line Tabs keep a transparent selected surface and use Primary text plus rule.
- `iconField.ts` and `resolveLucideIcon.ts`: icon authoring and safe runtime resolution.
- `mediaOverlayFields.ts` and `mediaOverlayPresentation.ts`: tone, strength, direction, coverage, and
  text contrast, including the theme-specific foreground for white Light overlays in both website modes.
- `breadcrumbFields.ts`: manual/automatic breadcrumb authoring.
- `bannerCtaFields.ts` and `bannerCtaPresentation.ts`: banner layout controls and class resolution.
- `siteSocialLinks.ts`: normalized CMS social destinations.

About Section content uses the full width available in its layout. Split variants fill their text
column without an additional reading-width cap; centered and text-only variants fill the regular
block container. Edge-to-edge layouts retain their outer alignment boundary and existing padding.

## Automatic Motion

Hero Carousel, Rotating Announcement, and Marquee Announcement share one visitor-facing automatic
motion policy. Reduced-motion preference always disables automatic behavior and hides Pause/Play;
otherwise, a visible component-local control persists the visitor's choice while pointer hover and
keyboard focus pause motion temporarily and independently.

Hero slide advancement follows its Autoplay setting, while background video remains an independent
motion source. Editors may enable a centered Pause/Play control; the option defaults off and missing
legacy values remain off. When meaningful motion exists, the control appears on Hero hover or
focus-within and remains available on no-hover touch devices. Reduced motion hides the redundant
control and leaves automatic motion stopped. Explicit Pause stops autoplay and video and locks drag,
Arrow-key, arrow-button, and dot-button slide selection without disabling Hero links or actions;
temporary hover/focus pauses automatic motion without locking manual navigation. Only the active
video may play.

Announcement Pause/Play remains visible whenever multiple items can move, and its 44×44 target now
matches the adjacent Dismiss control. Multiple rotating announcements stop their replacement timer
whenever motion is disallowed. Multiple marquee announcements use duplicated visual tracks only
while motion is available; reduced motion and single-item marquees render one static wrapping track.
Zero- and single-item announcements never render a motion control.

Editorial Reasons supports Stacked, Inline, and Three Columns number layouts. Three Columns uses one
outer reasons column so each row can place its generated number, title, and description in separate
large-screen columns; compact screens place the description beneath the title. Selecting it hides
the outer List Columns control without deleting that stored value.

Testimonial Spotlight keeps section appearance independent from its complete image-and-content
container. The inner container supports Match Section/Primary/Secondary/Muted/Accent semantic
surfaces and an optional divider-colored outline; missing legacy values render as Match Section with
no outline. Testimonial copy is optional: present copy uses the existing sans-serif family at a
responsive 18–20px size with one normalized pair of curly double quotation marks and semantic quote
markup, while absent copy leaves the image, title, description, and attribution visible without empty
quotation elements. The person name and designation retain distinct body and metadata sizes.
An optional outer section layer adds prefixed eyebrow/title/description fields, shared section and
footer actions, and Left/Center header alignment without renaming the existing inner message fields.
The outer eyebrow follows the section appearance; the existing inner eyebrow follows the container
surface. Documents without valid outer content retain the legacy render branch.

Q&A Accordion separates composition from proportion. `stacked` places the section introduction above
Q&A and ignores optional supporting content. The introduction fills its available width, with
Left/Center/Right alignment shared by its text and actions; Split supporting content follows the
same alignment. Empty introductions and empty supporting-copy wrappers are omitted.
`split` offers Balanced 50/50, Section Content Focus 60/40, and Q&A Focus 40/60 proportions;
Q&A Position swaps desktop sides while DOM/mobile order
remains section content first. Top, Center, and Bottom align the section-content group within its
flexible large-screen column. Profile and Contact Prompt remain part of that group and are available
only in Split mode. Supporting Actions Position defaults to After Content; Bottom of Column moves
Contact Prompt links and buttons below the flexible content group on desktop. Section-level actions
anchor to the bottom of the Split column independently from the content-group alignment, following
any bottom-positioned supporting actions. These action rows retain minimum spacing and remain in
normal flow as answers expand or collapse; compact layouts retain their natural reading order and
Stacked keeps section actions in its introduction. Long section and supporting action labels wrap
inside their column. The first Split question removes its large-screen top padding so its label
aligns with the section heading; compact layouts and Stacked retain regular row padding. The renderer
normalizes legacy layout values without rewriting stored content.

The generated inventory contains every current export under [src/blocks/shared](../../../../src/blocks/shared).

Academic Programmes is the canonical programme-directory card block. It retains split/stacked
headers, shared section actions, two-to-four-column editorial grids, semantic card surfaces, and
per-card links while supporting Grid, one-row-per-programme List, and Detailed Cards layouts.
Programme images are optional in Grid and List; text-only cards omit the media region. Optional
badge, duration, and intake fields enrich those layouts, with editor-authored labels for both
metadata values. A block-level Programme Details Position keeps metadata after the description or
aligns the metadata-and-action group to the card bottom. Bottom-positioned details form an
edge-to-edge, top-ruled footer; linked cards place an unruled inline action after their summary and
immediately before the flexible footer space. Detailed Cards instead use an optional dynamically
loaded Lucide programme icon, the existing duration as a compact pill, zero to four ordered
icon/label/value facts in a responsive auto-fit description-list grid, and the existing single
per-card action aligned to the bottom. Grid/List-only media and metadata fields do not leak into this
presentation. Editors can enable accessible Pill filters derived from the existing Study Level /
Category field when at least two distinct categories are present. The server component owns Payload
media/link/text normalization and the shared section shell; its client component owns filter state
and layout selection. Program Grid and Study Pathways have been removed without compatibility
renderers or migrations.

Profile Carousel owns an embedded one-to-twelve-person card set with Text Below Image and Image
Overlay variants. Each profile requires Media and a name and may include Role / Designation and an
editor-authored Department. Runtime trims the optional Department and omits blank values without a
migration. Image Overlay renders Department as compact uppercase mono label metadata above Name and
Role / Designation using the resolved overlay's semantic eyebrow accent. Text Below Image retains
Name, Role / Designation, then Department as compact uppercase mono metadata using the resolved card
or section's semantic eyebrow accent. One to four profiles use the existing responsive static grid;
five or more use the looping manual carousel. Department does not change navigation, filtering, image
positioning, surfaces, overlays, actions, or section settings.

Leadership Profiles owns the static academic, clinical, and administrative leadership directory.
Editors provide one to twenty-four profiles with required Media and names, optional leadership labels,
designations, one qualification, up to three ordered expertise items, and image crop positions.
Standard and Image Overlay are block-wide card layouts. Standard renders every authored metadata field
and applies one shared semantic surface to the complete directory. The hidden per-profile surface field
remains only as a first-profile fallback for saved content. Image Overlay uses a fixed `4:5` portrait,
the shared tone, strength, direction, and coverage controls, and renders only the leadership label,
name, and designation. Qualification and expertise remain saved and reappear when Standard is selected;
existing documents fall back to Standard without a migration.
Runtime trims author text, omits profiles without a usable name or image, removes blank expertise
rows, caps expertise at three, and never invents credentials. The block reuses the shared
split/stacked header, section/footer actions, appearance, and spacing patterns. Its section title is
optional; accent-only titles remain semantic headings, other authored header content remains
available without a title, and an entirely empty header omits its wrapper and grid gap. Profile names
use level-three headings when the section has a title and level-two headings when it does not. Within
each card, the leadership label is a surface-aware content nameplate above the profile name, the
designation uses the same accent family, and qualifications remain visually distinct from the smaller
expertise list. Its grid renders one mobile column, at most two tablet columns, and the selected two,
three, or four desktop columns. Cards remain opaque, equal-height, and non-clickable without profile
links, buttons, hover navigation, or client state.

Department Profiles owns a searchable, department-filtered faculty directory. It stores profiles
inside its ordered block-local department rows. Editors expand a department to manage its ordered
profile list; department and profile row labels expose their names while collapsed. Empty departments
remain valid, at least one profile is required, and the combined block limit is 400 profiles. Profiles
require a name, may include Media and a designation, and retain image crop positioning. The public All
view follows department order and then nested profile order. Search and the department filter are
independently optional. Editors present the filter as Tabs or Dropdown; missing or invalid legacy
values use Tabs. Both presentations derive All followed by populated departments in configured order.
Pill, Underline, and Contained tabs reuse the shared content-tab rail, while Dropdown reuses the
shared shadcn Select and the same department selection state. Search covers name, designation, and
department across the complete normalized list before the selected 12/16/20/24 batch is sliced, so
hidden records remain searchable. Load More increments by the configured batch and disappears at
completion. Static non-clickable cards support
Image Overlay and Inline layouts at Large, Medium, and Small sizes. Image Overlay uses a compact
portrait `4:5` ratio on mobile and a taller `3:4` width-to-height ratio from `sm` upward, preserves
Bottom-to-Top/Full geometry, and exposes only Auto/Dark/Brand tones and Dark/Darker strengths to
protect small-text contrast. Its centered mobile grid caps Large at 320px, Medium at 288px, and Small
at 256px. Inline places a square image beside a stack of
name, optional designation, and department. Boxed separates rounded cards, Framed Grid joins square
cells within a complete outer border, and Ruled Grid uses the same internal dividers with only top and
bottom outer rules. Image Overlay Large remembers two-to-four profiles per row and defaults to four,
Medium remembers three-to-six and defaults to six, and Small remembers four-to-eight and defaults to
eight. Mobile uses one column, small screens cap at two, standard desktop caps at four, and five-to-eight
columns activate at `2xl`. Inline retains the original two-to-four-column control at every size. Missing
or unresolved images use a semantic decorative `UserRound` placeholder in either layout. Existing
documents resolve to Image Overlay Large, four columns, and Boxed. A reversible content migration
covers current and versioned Pages, Reusable Sections, and the News & Events Detail Template, while
runtime temporarily accepts legacy flat department assignments during rollout.
The block reuses shared optional headers, appearance, actions, alignment, padding, and tab patterns.
The department tab rail supports Content Width, Centered Auto Width, and Equal Full Width. Missing or
invalid values use Content Width. Centered Auto Width shrink-wraps and centers the complete themed
frame when intrinsic tabs fit, then constrains it to the available width when they overflow. The frame
remains stationary and fully visible while only its tab contents scroll horizontally from the inline
start without visible scrollbar chrome. Equal Full Width divides the available Search-adjacent rail
evenly, or the full toolbar width when Search is hidden. Its shared overflow affordance shows an end
fade on initial overflow, both fades between edges, and only the start fade at the final scroll
position; fitting rails render no fade. Selecting either Tabs or Dropdown resets the visible batch and
filters Featured Profiles and the directory without changing Search behavior.
Its optional featured area is derived from the same ordered profile rows: editors mark up to twelve
image-backed profiles as Featured, and the shared Profile Carousel collection appears after the shared
search/department toolbar. All shows every featured profile; department tabs filter both featured and
directory profiles; any active search hides the featured area while leaving the full directory search
active. One through four featured profiles use the static responsive row and five through twelve use
the manual looping carousel. When the featured set uses the manual carousel, its semantic subsection
title and Previous/Next controls share one normal-flow header row; static featured sets retain the
title without controls. Featured profiles remain in the directory, and the parent Department Profiles
section continues to own appearance, spacing, actions, and subsection heading hierarchy.

Program Matrix keeps its introduction before the matrix and footer actions in document order. Editors
can use a stacked layout or a large-screen 40/60 split with the introduction on either visual side
and aligned to the top, center, or bottom of its column. Its one-to-four Columns setting renders one
column on mobile, caps tablet layouts at two, and uses the selected count on desktop; seamless divider
geometry follows the effective count at each breakpoint. Each card owns at most one optional Link or
Button action; hidden legacy link and block-wide action fields remain registered only for saved-content
compatibility.

Download List offers Boxed Card Grid, Open Grid, Framed Grid, and Inline List presentations. The
shared Columns control supports one to eight configured wide-screen columns with responsive caps and
defaults or falls back to three in every mode. Open Grid has top/bottom outer rules and internal
dividers while its left/right edges remain open; Framed Grid adds one complete square outer border;
only Boxed Card Grid consumes independent semantic item backgrounds. Every boxed-family item fixes
the file-type badge at the top right while the block-level icon position places the Small, Medium, or
Large optional main document icon Above Title or Left of Content. Show File Icon defaults on across
all presentations. File Type Label is an optional PDF/DOC/DOCX/XLS/XLSX/CSV/PPT/PPTX/ZIP preset
override; empty values auto-detect from uploaded Media, while historical explicit values remain
readable in uppercase. Document categories and category filtering are no longer part of this block.
Inline List never renders a file-type badge. Its ruled items place the optional file icon at the
upper-left, a flexible wrapping content column, a permanent vertical divider, and compact button
actions at the far right at every width. The inner item grid fills each equalized row height so the
divider spans the complete card. Each document owns an ordered `documentActions` list with at most
two Download, View, or Custom rows. Download and View are fixed-icon buttons. Custom uses an internal
Page or Custom URL and renders as either a visible text Link without an icon or a semantic Button with
an optional shared animated trailing arrow. Show Arrow is authored only for Custom
Buttons and defaults to off. Duplicate Download/View rows and duplicate Custom destinations are
invalid. Labelled boxed-family grids show Download/View labels plus their fixed icons; Grid Icon-only
and Inline compact only Download/View to accessible icon controls. Custom Button remains visibly
labelled in every layout, while Custom Link remains textual without an icon or arrow.
A non-empty new list is authoritative even if its rows cannot resolve. Without it, hidden compatibility
data resolves the current Custom Action beside available automatic actions, then older valid manual
actions as a replacement, then automatic fallback. Historical visual-action properties are ignored
without a migration. Every presentation uses sans-serif document titles. Existing `compact` values
fall back to Inline List and the shared Columns value without a migration and are no longer selectable
in Admin.

Fee Structure models exactly one programme and one academic session per block. Editors configure one
to four fee categories with one to six ordered academic-period columns, one to thirty fee rows,
editor-authored text cells, manual total emphasis, category-owned fee notes, and an optional Media
download. New rows validate one cell per configured column. Runtime normalization trims text, omits
invalid categories and rows, maps empty or missing cells to an em dash, ignores extra cells, and never
calculates totals, converts currencies, or infers missing values. The schema intentionally has no bank
or payment-account fields. One category renders directly; multiple categories use accessible tabs.
Table & Mobile Cards is the saved default and runtime fallback: tablet and desktop use a semantic
horizontally scrollable table with a sticky fee-head column, while mobile uses one card per academic
period from the same normalized data. Programme Cost Atlas is an optional 50/50 Primary/Card
editorial composition at large breakpoints and a single stacked flow below them. Its left summary
shows programme/session/category facts, up to four additional authored programme details, the first
normalized Total row as Annual totals, category notes, and a required category-owned Complete
programme expense entered exactly as published. Its right statement renders every remaining fee head
once with all authored period values; additional Total rows remain on the right. The statement header
preserves the authored category label verbatim beneath the fixed `Statement breakdown` eyebrow. Atlas performs no
calculation, parsing, grouping, currency conversion, or value inference. It uses standard sans-serif
titles, left-aligned period labels and values, and semantic Primary/Card colors. Right-side fee-head
chapters use the shared compact content-item and metadata rhythm while left-side Annual totals retain
their roomier summary spacing.
New blocks initialize Additional Programme Details with one editable `Programme Duration` / `4.5 Years`
row; existing documents are not backfilled and runtime never invents a missing duration.
Multiple categories reuse the shared Contained, Pill, and Underline content-tab presentation while
preserving the Fee Structure `boxed`, `pills`, and `underline` saved values through runtime mapping.
Light sections use semantic card surfaces; Brand and Gradient Brand sections use
primary-foreground overlays, borders, and text for the table and mobile cards. Every fee-value cell
is right-aligned, including em-dash placeholders, while numeric values alone receive tabular
numerals. Category tabs support intrinsic Content Width, Centered Auto Width, or Equal Full Width.
Centered Auto Width shrink-wraps and centers the tabs when they fit, then returns them to the inline
start inside the existing horizontal scroller when long labels or narrow viewports overflow.
The table layout's programme/session band follows the shared `max-w-3xl` introduction measure. Standard desktop
fee-name cells use normal weight, Total rows are bold, and every body-row cell shares the same opaque
Card/Accent or Primary/Primary Foreground base and hover surface so the sticky fee-name column remains
visually continuous and follows the active theme. The
optional `feeDocumentAction` uses the shared File action schema and presenter in both fee blocks,
including View/Download, new-tab behavior, Link/Button styling, and file icons. Editors can apply
the shared section backgrounds to its outlined container. `feeDocumentActionFields` hydrates
legacy fee document, label, mode, and variant fields on read/validation; explicit empty actions
remain empty so clearing cannot resurrect a legacy download. The table layout
places it after the categories; Atlas places it at the bottom of the active left summary.

Document Checklist (`documentChecklist`) is an Advanced Library block for admission and
verification document lists. The server component normalizes 1–60 ordered items (required label,
optional condition tag and details; keyed by Payload row id) and 0–6 notes in the client-safe
`normalizeDocumentChecklist.ts`, renders the shared intro (eyebrow, title, accent title, description,
actions with Left/Center/Right alignment), and returns nothing without a heading and one valid item.
`DocumentChecklistTracker.tsx` is the client island: optional visitor tracking uses Radix checkboxes
and `useSyncExternalStore` over `localStorage` key `document-checklist:<block id>`, keeps unknown keys
out of the count, falls back to in-visit state when storage is unavailable, and never sends data to
the server. The sidebar (progress, Print, Clear ticks, notes) uses `resolveCardSurface` with
`sidebarBackground` (default Primary). Layout Mode follows Partner Directory: Stacked, or Split with
proportion, checklist position, and vertical alignment (Top is sticky). `showProgressPanel` hides the
sidebar; progress, Print, and Clear then render in the list header and notes below the list.
`presentation` selects Tracker (bordered card) or Editorial Ledger (no card; per-column hairline
rules from `ledgerItem`, gutters instead of vertical rules, italic display numerals, footnote notes,
surface-aware accents and checkbox fill). Both share the same state, grid, and panel behaviour.
Composition (`presentation: 'composition'`) renders a container-query hero (header beside the
server-only `DocumentChecklistArt` certificate stack and seal) above a ruled icon list using
`ledgerItem` rules. Item `icon` names resolve with `resolveLucideIcon` in the server component
(falling back to `FileText`) and reach the client tracker as rendered nodes, so the client bundle
never imports the full Lucide map. Ticking uses a visually hidden native checkbox whose `peer`
state colours the icon square. Composition ignores Layout Mode and the progress panel.
`getChecklistGridLayout` provides one/two/three columns in both layouts with container queries
(`@xl` two, `@3xl` three) and `grid-flow-col` with per-breakpoint row counts, so reading order stays
top-to-bottom while rows align; each item computes its own bottom/left rules per active column count.

Celebration (`celebration`) is an Advanced Library block with one required relationship to a published
celebration (`filterOptions` on `_status`). Production renders `CelebrationBlockComponent`, which resolves the
celebration (fetching by id when unpopulated) and mounts a page-priority `CelebrationHost`; it adds nothing to the
layout. Live preview renders `CelebrationBlockPreview`, a static card with its date window instead of a modal.

Contact Numbers (`contactNumbers`) is an Advanced Library block for helplines and desk numbers.
`normalizeContactNumbers.ts` (client-safe) trims 1–24 contacts, drops rows without a dialable
number, builds `tel:` links from "+" and digits, optional `wa.me` links, and validates HH:MM hours;
a schedule needs days and a closing time after its opening time. Layout selects one of five
presentations from the same data: Switchboard (ruled rows), Call Desk (card of tap-to-call rows),
Desk Cards (2–4 columns), Help Ribbon (compact chips), and Department Directory (tabs from the
Directory Group field, using the shared content tab rail, only when more than one group exists).
Switchboard, Call Desk, and Directory place section content left, right, or above. Client islands
in `ContactNumbersClient.tsx` provide clipboard copy with a polite live region and an "Open now"
badge computed through `useSyncExternalStore` against the block's Hours Timezone; it renders nothing
on the server so cached pages never show stale status. The block reads its timezone from its own
field rather than Site Settings so it stays synchronous for thumbnails and live preview.

PG Fee Structure independently models department-based postgraduate fees without changing Fee
Structure or its saved content. Each block owns one programme and academic session plus one to four
categories. Every category owns one to six ordered fee columns, one to thirty departments, and
category notes. A column either changes by department or provides one shared category value. Each
department supplies values only for changing columns, in their displayed order; validation rejects
duplicate labels, missing shared values, and mismatched variable-value counts. Runtime normalization
trims authored text and expands shared/department values into one ordered row, using an em dash only
for a missing draft value. It never parses, totals, formats, converts, or otherwise reinterprets
currency strings. Visitors receive one responsive 50/50 Primary/Card department atlas. The Primary
summary contains programme/session context, active category, department count, category-shared
charges, notes, and the optional shared fee-document Link or Button panel; the Card statement renders
one complete chapter per department and repeats shared values for self-contained reading. Its
statement heading repeats the active category label unchanged. An active category with up to four
departments renders at natural height. At five or more, `lg` layouts use a
676px atlas whose summary and statement header remain independent while only the department chapter
list scrolls; below `lg`, every region returns to normal document flow and the page itself carries all
department scrolling. Below `lg`, every department
chapter presents fee values in the Fee Structure Atlas two-column ruled pattern, including full-width
odd final items. At `lg`, compact row rules are removed and the existing adaptive value grid remains
in effect. Compact layouts stack summary then statement, and container-aware fee grids reflow without
page-level horizontal scrolling. Multiple categories reuse Contained, Pill, and Underline tabs with
the same width behavior as Fee Structure and switch the complete frame. From the fifth department
the statement list scrolls inside a fixed-height atlas through `DepartmentScrollRegion`, which fades
the clipped edge and shows a "More departments" / "Back to top" pill once measured in the browser
(server markup has no hint). PG Fee Structure
intentionally has no alternate layout selector, calculated totals, department relationship, public
filtering, payment-account fields, or migration.

Bank Details independently models one to six ordered official payment accounts, each owned by one
unique visitor-facing payment purpose. Purpose, account holder, account number, and IFSC code are
required; bank name, Branch & Type, UPI ID, and instructions are optional. Normalization trims only
outer whitespace, preserves internal banking characters, removes rows missing a core field, and keeps
the first valid case-insensitive purpose in source order. One account renders directly. Multiple
accounts reuse the shared Contained, Pill, and Underline tab rail with Content Width, Centered Auto
Width, or Equal Full Width. Theme Settings owns Text/Scanner mode and the reversible desktop panel
side; no visitor mode switch is rendered. Mirrored `9fr/16fr` and `16fr/9fr` desktop tracks keep the
Primary context at 36% and the white ledger at 64% on either side. Compact layouts always stack
contextual content before the ledger, without an internal scroller, and retain explicit space before
the Text notice. Payment Purpose supplies both the account tab and the white-ledger eyebrow without
additional suffix text. Content owns one optional `ledgerText` group for the ledger title,
verification text, credential labels, and Copy all label. Runtime resolves every missing, malformed,
or whitespace-only nested value independently to its code-owned default, so historical records
require no migration; transient clipboard and QR messages remain code-owned. The
context title is upright display type, the ledger title is upright sans, and shared surface-aware
green accents own the eyebrow and credential-label contrast. The fixed-white ledger keeps the
light-overlay foreground contract in every color scheme, and compact Copy controls retain touch-sized
targets while Copy all uses smaller type. Every visible credential uses
`navigator.clipboard.writeText`; Copy all and QR consume one optional-line-aware credentials payload
that excludes Payment Purpose and instructions. Success clears after two seconds or account change,
clipboard failure leaves selectable values in place with an accessible manual-copy message, and QR
generation makes no external request. The block has no fee calculations, masking, payment
processing, migration, or fallback clipboard mutation.

Event Gallery renders selected Gallery Albums in their resolved manual or latest-event-date order.
Each selected album contributes its first valid image as one cover tile, while the accessible card
button opens every image in that album through the shared full-screen viewer. Enable Album Slideshow
defaults on, including for legacy documents; disabling it retains identical images and overlays on
static, non-focusable tiles. The section title is optional: albums render without any header content,
and the header wrapper and its grid gap are omitted when eyebrow, title, description, and section
actions are all absent. Overlay Display supports Always Visible and Reveal on Hover; Event Gallery
defaults and legacy documents resolve to Always Visible. Hover mode reveals on keyboard focus and
remains visible on touch/coarse-pointer devices, independently of slideshow interaction. The count-aware
rectangular quilt uses one phone, two tablet, three laptop, and four wide-desktop columns, bounded by
the number of rendered albums. The first few tiles span two rows only when required to fill the active
grid exactly, so every album count ends on a straight boundary without horizontal spans, dense
backfilling, or an oversized lead card. Card details are optional. When enabled,
every overlay position stacks the image icon and numeric count, event date, and a clamped text-family
title. Bottom Left aligns the stack left; Bottom Center and Center — Vertical & Horizontal center it.
Missing or disabled metadata rows close naturally. The shared overlay tone, strength, direction, and
coverage fields control the presentation. Disabling Show Album Details Overlay produces image-only
cards and hides its dependent metadata, position, and overlay controls in Admin.

Gallery Album Tabs renders explicitly selected Gallery Albums as a collection-backed image
directory. All is fixed first and initially active; its label is configurable, while every remaining
tab label follows the current album title. Albums use the shared manual/latest-event-date ordering
resolver. All preserves resolved album and image order while de-duplicating repeated Media IDs;
album-specific tabs keep every image. The client reveals 6, 9, or 12 images per action, remembers
visible progress independently per tab, and opens the complete active-tab image set in the shared
slideshow at the selected index. Contained, Pill, and Underline variants share semantic theme tokens;
Underline is the saved default and runtime fallback. Each tab sizes to its label while the rail spans
the block container; the compact single-row rail scrolls horizontally when its intrinsic content
overflows. Tiles use the count-aware rectangular quilt and do
not render captions outside the slideshow. Production loads only selected published albums, while
authenticated Page and News/Event detail previews use their server-provided draft album snapshot.

Image Mosaic supports Manual Images and Gallery Albums sources. Missing or invalid source values
retain the legacy Manual Images behavior, including one-to-eight uploaded images, crop positions,
titles, and independent actions. Gallery Albums mode accepts up to eight explicitly selected albums,
uses the shared manual/latest-event-date ordering utility, and contributes one first-valid-image cover
tile per album. Album overlays share Event Gallery's numeric count, UTC Event Date, sans title, and
Bottom Left, Bottom Center, or Center — Vertical & Horizontal positions while retaining Image Mosaic's
existing overlay resolver and grid geometry. Overlay Display supports Always Visible and Reveal on
Hover for both content sources; Image Mosaic defaults and legacy documents resolve to Reveal on
Hover. Hover mode reveals on keyboard focus and remains visible on touch/coarse-pointer devices.
Album slideshow interaction defaults on and can be
disabled without changing presentation; manual images never open the album viewer. Production loads
only selected published albums. Authenticated Page and News/Event detail previews discover album
dependencies through supported populated Reusable Sections, load draft albums on the server, and use
the client-safe Image Mosaic preview adapter without importing the Payload-backed loader.

News & Events Highlights retains the `newsEventsHighlights` slug and renders one synchronized carousel
from automatically loaded News & Events collection records. It renders only published, non-expired
Events: up to three checked `featuredInHighlights` Events first, followed by up to three unchecked
current or upcoming Events. Each group sorts by `eventStart` ascending and the combined result is
de-duplicated. Timed featured Events require `eventEnd`; all-day eligibility includes the full local
calendar day of `eventEnd`, or `eventStart` when no end is set. Editors can select active Event
classifications in the block Content tab; an empty selection includes every active Event
classification, while a non-empty selection is strict. Production and live preview use the same
classification scope key. Autoplay, Empty State Message, semantic section settings, block-wide
image-position override, and shared media overlay controls remain configurable. Missing overlay values
preserve Dark/Darker/Bottom-to-Top/Full; missing or failed images use the centered bundled SNMIH
fallback. News Grid retains its legacy grid and optional
feature card. It loads all published classifications in published-date order, retains the
current/upcoming Event predicate, uses canonical classification labels, and preserves the stored
`newsActionLabel` field as the Admin-facing Default Action Label for non-event records. Editors can
place the carousel status and previous/next controls above or below the carousel; Bottom remains the
default and legacy fallback.
From tablet widths, the featured panel and vertical rail share a 36rem height. Three equal supporting
cards, separated by consistent gaps, fill that height; card titles use one line and descriptions use
two lines. Each vertical slide, button, and card surface spans its complete allocated width and
height, so sparse supporting content cannot shrink the visible card. The rail centers card content
vertically and keeps end-card outlines inside the viewport. Phone widths retain the horizontal
supporting-card rail below the feature.
The separate News & Events Tabs block renders Card Grid or Editorial List entries with a mandatory
first All tab and an editor-ordered set of active News & Event Classification relationships. Central
classification titles become visitor tab labels; duplicate, inactive, missing, or unusable selected
records are omitted without disturbing the remaining saved order. When no relationships are selected,
the block intentionally renders only All and loads that group from every active classification. All
fetches two prefixes and concatenates them: current/upcoming Events soonest-first, then Stories and
past Events newest-published first (no story/event interleaving). Story tabs sort by publish date
and Event tabs by current/upcoming then past. The
block server-renders page one for each tab as a page-aware public group, with 3, 6, 9, or 12 entries
per batch. When more entries exist, the client appends the next batch through the read-only
`/api/news-events-tabs` route. Selected configurations carry their ordered classification scope for
All requests; All-only configurations omit the scope and resolve all active classifications. The
client retains independent progress for each classification ID until refresh. Load More reaches the
complete published directory. Story classifications use newest-published order. Event classifications
show current/upcoming Events earliest-first, followed by past Events most-recent-first; the manual
Highlights flag does not filter Tabs. Editors can customize the Load More label. The block retains
shared appearance,
alignment, spacing, header actions, and footer actions, and uses only semantic theme surfaces. Card
Grid is the admin default and legacy runtime fallback; its Cards Per Row control remains 2–4 and is
shown only for that layout under Theme Settings. Editorial List uses full-row detail links with a
date-only first column, classification above the title in the second column, excerpt, and the shared
animated arrow. The title and excerpt use equal-width tracks, the arrow receives a wider trailing
track, and one equal horizontal gutter separates every desktop column. The date and arrow center
vertically while the badge/title and excerpt remain top-aligned, then stack on smaller screens. Both
variants use the theme-scale `text-xl` token for semibold titles and retain the
`text-base` token for normal-weight descriptions with bounded line lengths. News & Events Tabs uses
the same Contained, Pill, and Underline presentation contract as Gallery Album Tabs; Underline is the
saved default and runtime fallback. Tabs size to their labels inside a full-width rail and remain in
configured order on one horizontally scrollable row when their intrinsic content overflows.
The loader resolves ordered active relationship records before querying entries, then uses each
classification ID and Story/Event behavior for filtering and ordering. It rejects unknown, inactive,
out-of-scope, malformed, or oversized pagination scopes before querying entries. Preview snapshots
discover relationship scopes, including the empty All-only scope, through populated Reusable Sections
with cycle/depth guards and key groups by ordered IDs plus item limit, preventing equal-count blocks
with different selections from sharing data.

NewsEventsDetailTemplate is a Page-compatible ordered block layout with one additional global-only
`newsEventsContent` block. That dynamic block is deliberately excluded from Pages and Reusable
Sections. Drafts may contain an incomplete layout; publishing requires exactly one dynamic block.
The renderer preserves saved order, sends standard blocks through the normal Page render path, and
injects the current record only into `newsEventsContent`. The content block renders a configurable
featured-image ratio with classification and title in a fixed bottom-left overlay, followed by the
excerpt and styled Lexical body in the main column. Story metadata and optional sharing use the
right sticky sidebar, which occupies a fixed `30rem` desktop grid column. Overlay Tone, Strength,
Direction, and Coverage reuse the shared media fields and fall back to
Dark/Darker/Bottom-to-Top/Full; missing entry media uses the centered bundled SNMIH image. Automatic
Breadcrumb blocks receive Home, News & Events, and the current entry in production and in the
dedicated client-safe live-preview renderer.

Every project-owned Lexical field uses the same complete, always-visible fixed toolbar and reserves
H1 for the surrounding page or entry title while exposing H2–H6. `richTextStyles.ts` owns the
client-safe shared presentation: Article, News/Event, and Rich Text content use the long-form
preset, while Q&A answers retain the compact preset; toolbar consistency does not change stored
content or public typography. Both presets style
Payload's semantic paragraph, list, checklist, blockquote, emphasis, link, code, image, and
horizontal-rule output using theme tokens; rich-text headings use the text-family token rather than
the display family. Long-form H2–H6 use a compact descending text-family scale, with H2 capped by the
shared 28px editorial token, plus tuned heading, paragraph, list, quote, code, image, and rule rhythm.
Long-form paragraphs, list items, and blockquotes share the responsive `text-base sm:text-lg`,
`leading-7`, and excerpt-aligned `text-current/80` tone. Lexical H1–H6 use `text-current/90`;
other ordinary long-form and compact content, including blockquotes, uses `text-current/80`. Primary links,
card-surface preformatted blocks, and softer completed/struck states retain their semantic
exceptions. The shared preset suppresses
Payload's empty `<p><br></p>` output. News/Event Story Details keeps regular mono labels while values
use the normal text family; only date values use tabular numerals.

## Required Commands

After block schema or Admin changes, run the applicable generators:

```bash
pnpm generate:types
pnpm generate:importmap
pnpm generate:block-thumbnails
```

Run focused block tests, then the Page block, live preview, thumbnail, and theme contracts. Finish with:

```bash
pnpm project-context:update
pnpm project-context:check
```


## Disclosure Proforma

`disclosureProforma` is an Explore block with configurable ordered sidebar sections and keyed groups
of facts, metrics or table columns. Content owns its dataset relationship, optional shared introduction
and actions, sections and empty/archive labels; Theme Settings owns semantic appearance/padding,
introduction alignment, Split/Stacked header layout, sidebar width, section numbers, density,
missing-value style (chip/footnote/text) and a page size capped at ten rows (`PAGE_SIZES`). It uses
shared typography and containers, a square Primary selection edge with a sticky divided section list, a date-only Updated badge, Show in sidebar section toggles with a hidden row label, and one outline `Panel` per group (title plus row/item count): metric tiles, a label/value facts list, and tables with a tinted column header, a row-end Details toggle that expands an inline detail row, and a numbered footer pager; plus a pulse loader and icon empty state,
a joined search and shadcn Popover period picker, and semantic table surfaces.
Three separate collections retain periods and individual rows; Page layouts contain no growing data
arrays. Production renders the active section's first batches on the server. The client-safe live
preview fetches authenticated draft projections through `/api/disclosure-data`; public requests use
published data and no-store responses. Both paths validate scope and limits. Every group paginates
independently; periods have a searchable 20-item batch selector. Rows support explicit missing/N/A
states and expandable named details. Native Page/Reusable Section/template hooks stamp block
publication credits, combined with a dataset revision for linked publications and unpublications.
The production-component thumbnail uses supplied September 2026 statistics. Operator instructions
are in `docs/guides/disclosure-proforma.md`.
