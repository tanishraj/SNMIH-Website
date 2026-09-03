# News & Events Classification and Metadata Design

## Goal

Make classification badges and date metadata visually consistent across the News & Events featured carousel, its vertical and mobile rails, and the tabbed News & Events cards.

## Scope

- Give every supported classification the same restrained bluish accent treatment.
- Use the same classification presentation everywhere these News & Events cards appear.
- Add the calendar icon to tabbed-card dates.
- Render carousel and tabbed-card dates with the regular text family, normal weight, and tabular numerals.
- Preserve context-appropriate date sizes: compact cards use `text-xs`, while the feature-image overlay remains `text-sm`.
- Leave the News Event detail sidebar's established label/value typography unchanged.

## Classification Treatment

Classification remains identifiable through the badge label rather than through a category-specific color. Every classification uses the same theme-aware accent structure:

- soft `accent` background;
- one-pixel semantic `border` outline;
- readable `accent-foreground` text;
- no classification-specific fill, border color, or text color.

The same badge treatment is used on card surfaces and over featured images. In the SNMIH theme this produces the requested soft bluish appearance; other themes inherit their own semantic accent pair. Missing or unknown values use the `Other` label with the same accent treatment.

## Architecture

Introduce a News & Events-specific classification presentation boundary instead of adding domain categories to the generic shadcn `Badge` variants. The shared presentation layer will:

- normalize the classification;
- resolve its label;
- apply the shared semantic accent classes;
- render the existing `Badge` primitive.

The featured carousel and tabbed-card components will consume this shared boundary. This avoids duplicated mappings and prevents the two blocks from drifting apart.

The featured highlight view model will carry the normalized classification value rather than relying only on a generic badge variant. Existing automatic collection mapping will populate that value.

## Date Metadata Contract

News & Events list/card dates will share these rules:

- `CalendarDays` icon before the date;
- regular text family rather than the mono family;
- normal font weight, including inside button-based carousel rails;
- normal tracking and tabular numerals;
- semantic `<time>` output when an ISO value is available;
- muted text on cards and the existing overlay-aware text color on feature images.

Explicit font classes will prevent the vertical rail date from inheriting the parent button's semibold weight.

## Compatibility and Fallbacks

- No collection schema, admin configuration, fetching, pagination, carousel behavior, or card layout changes are included.
- Unknown classifications render as `Other` with the shared accent badge style.
- Badge backgrounds, outlines, and text remain legible in light and dark themes and over the featured image overlay.
- The active carousel rail outline and all current interaction behavior remain unchanged.

## Testing

Focused tests will verify:

- every supported classification resolves to the same bluish accent presentation while retaining its label;
- unknown values fall back to `Other`;
- featured and rail badges use the shared classification renderer;
- tabbed cards include the calendar icon;
- rail and tabbed-card dates explicitly use the regular text family and normal weight;
- existing carousel, tab filtering, and load-more behavior remains intact.

Run affected integration tests, TypeScript, targeted lint/format checks, and the project-context update/check loop. No changes will be committed or staged.
