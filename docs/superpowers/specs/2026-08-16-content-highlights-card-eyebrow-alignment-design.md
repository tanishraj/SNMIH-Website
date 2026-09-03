# Content Highlights Card Eyebrow Alignment

## Goal

Make the Content Highlights card eyebrow visually identical to the per-item eyebrow/number used by Editorial Reasons.

## Design

Content Highlights will use the existing shared `contentItemMetadataClasses` typography without local overrides. This produces the same established treatment as Editorial Reasons: monospaced extra-small text, medium weight, `0.14em` tracking, and `text-current/65` surface-aware color.

Inline eyebrow placement may retain its existing top-alignment utility because it controls layout rather than typography. Stacked and inline placement, numbered/custom/hidden eyebrow modes, card surfaces, and all Payload configuration remain unchanged.

## Implementation Boundary

- Remove the Content Highlights-only weight, color, casing, and tracking overrides.
- Do not change Editorial Reasons.
- Do not add a new style token or Payload field.
- Preserve `data-section-eyebrow-surface` so theme-specific eyebrow colors continue to work.

## Verification

- Assert Content Highlights card eyebrows render with `contentItemMetadataClasses` and without the removed local overrides.
- Keep the existing Editorial Reasons and Content Highlights integration suites passing.
- Run TypeScript, targeted lint, and the typography detector.
