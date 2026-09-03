# Review Form Browser Hydration Design

## Goal

Prevent Chrome on iPhone, browser autofill helpers, and similar browser integrations from producing a React hydration warning when they add `__gcruniqueid` attributes to the Review Submission form before hydration.

## Confirmed Cause

The attribute is absent from the repository and the server-rendered Home page HTML. The hydration diff shows it only on the browser DOM's form controls, confirming that an external browser layer mutates the markup before React attaches event handlers. The form's rendered content, values, validation, and element structure otherwise match.

## Design

Use React's `suppressHydrationWarning` escape hatch only on the elements observed to receive the external attribute:

- the Review Submission `<form>`;
- the reviewer-name `Input`;
- the reviewer-email `Input`;
- the review-body `Textarea`;
- the hidden honeypot `<input>`.

The suppression is applied directly to each affected element because React limits it to one DOM level. Do not broaden it to the Review Submission section, the shared `Input` or `Textarea` primitives, or additional page blocks. This ensures unrelated hydration mismatches remain visible.

## Rejected Alternatives

- Disabling SSR for the form would remove useful initial HTML and introduce a client-render delay.
- Removing injected attributes with a pre-hydration script would couple the application to an undocumented browser implementation detail and create a timing race.
- Applying suppression globally would conceal genuine application errors.

## Behavior and Data

The change affects warning reporting only. It does not alter Payload configuration, form state, validation, submission data, accessibility, appearance, or the honeypot behavior.

## Verification

- Add focused coverage confirming the five affected elements opt into targeted hydration suppression and no shared form primitive is changed.
- Run the Review Submission render and configuration tests.
- Run ESLint, Prettier, and `git diff --check` on the changed files.
- Verify the Review Submission form remains interactive and the `__gcruniqueid` mismatch no longer appears in Chrome on iPhone.
- Keep all changes unstaged and uncommitted.
