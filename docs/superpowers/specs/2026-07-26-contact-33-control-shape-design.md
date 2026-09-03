# Contact 33 Control Shape Correction

## Goal

Align Contact 33 form controls with the established Review Submission form treatment.

## Approved changes

- Name and Email inputs use `h-11 rounded-md`.
- The Subject select trigger uses `h-11 w-full rounded-md`.
- The Message textarea uses `min-h-32 rounded-md`.

## Constraints

- Apply overrides only within Contact 33.
- Do not modify shared shadcn Input, Select, Textarea, Field, or Button primitives.
- Preserve current field spacing, validation behavior, semantic colors, button styling, responsive
  layout, and Payload form integration.

## Verification

- Static rendering tests assert the approved control classes.
- Contact 33 interaction tests continue to pass.
- Feature-scoped lint remains clean.
