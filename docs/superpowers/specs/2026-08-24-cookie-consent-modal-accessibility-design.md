# Cookie Consent Modal Accessibility Design

## Goal

Make the Cookie Consent Modal a complete keyboard-accessible modal while preserving the current
appearance, content model, consent cookie, and behavior of the Bottom Bar, Floating Card, and Corner
Badge variants.

## Scope

This change applies only when `Cookie Consent Banner > Banner Style` is `Modal`. It does not add CMS
fields or change Payload-generated types.

## Interaction Contract

- Opening the modal moves focus to `Reject non-essential`. The privacy-preserving action receives
  initial focus so an accidental Enter press cannot grant analytics consent.
- Tab and Shift+Tab remain inside the modal while it is open. The privacy-policy link, when present,
  and both consent buttons remain reachable.
- Escape has the same result as selecting `Reject non-essential`: it stores
  `analytics_consent=denied` for one year and closes the modal.
- Selecting `Accept all` stores `analytics_consent=granted`, closes the modal, and preserves the
  existing router refresh that activates configured analytics.
- Clicking the backdrop does not close the modal because closing without a stored decision would be
  ambiguous.
- After either decision, focus returns to the element that was active before the modal opened when
  that element is still connected to the document. If no restorable element exists, the browser's
  normal document focus is left intact.
- Background content is unavailable to keyboard and assistive-technology interaction while the
  modal is open, and body scrolling is locked by the dialog primitive.

## Architecture

`CookieConsentBanner.tsx` will use the existing Radix Dialog primitive directly for the Modal
variant. This keeps the change local and avoids creating a shared UI abstraction with only one
consumer.

The modal will render a controlled, always-open Dialog Root for as long as consent is required. A
request to close from Escape will call the existing rejection callback. Pointer-down outside the
content will be prevented. Radix will own focus containment and modal background isolation.

The current heading and message will become Radix Dialog Title and Description elements, preserving
the existing fallback copy and visual classes. A ref will place initial focus on the reject button.
The element active before mount will be captured and restored during modal teardown.

No new dependency is required because `radix-ui` is already part of the production dependency graph.

## Error and Edge-Case Behavior

- Escape and the reject button share the same consent-writing path, preventing behavioral drift.
- Repeated close notifications must not produce competing consent decisions.
- A missing privacy-policy destination simply removes that focusable link; focus remains trapped
  between the two consent buttons.
- Focus restoration checks that the previous element is still connected before focusing it.
- Server rendering remains unchanged: the banner stays hidden until the client confirms that no
  consent cookie exists.

## Verification

Add a focused JSDOM integration test for the Modal variant that verifies:

1. the accessible dialog title and description;
2. initial focus on `Reject non-essential`;
3. forward and reverse focus containment;
4. Escape stores denied consent and closes the modal;
5. backdrop interaction does not dismiss or write consent;
6. accept and reject buttons retain their existing cookie behavior;
7. focus restoration after a decision; and
8. non-modal variants do not inherit modal focus behavior.

Run the focused test, TypeScript, lint for the affected files, the project-context update/check loop,
and the broader integration suite in proportion to any shared behavior changed during implementation.

## Documentation

Update `docs/guides/cookie-consent.md` with the Modal keyboard and dismissal behavior. Update the
maintained architecture reference only if implementation changes the documented consent boundary or
client-component ownership. The historical specification remains the decision record for this work.
