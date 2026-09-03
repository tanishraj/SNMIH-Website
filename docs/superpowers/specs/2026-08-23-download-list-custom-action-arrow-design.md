# Download List Custom Action Arrow Design

## Goal

Replace the configurable icon on new Download List Custom Button actions with the shared optional
trailing-arrow behavior used by other project actions.

## Scope

This change applies only to `downloads[].documentActions[]` in the Download List block. It does not
change shared section actions, footer actions, other block components, hidden legacy action fields,
or the fixed icons used by Download and View document actions.

## Authoring Contract

- Remove the current **Button Icon** field from Document Actions.
- Add a **Show Arrow** checkbox with a saved default of `false`.
- Show the checkbox only when **Action Type** is **Custom** and **Display As** is **Button**.
- Use the established help text: “Adds a trailing arrow when this action is displayed as a button.”
- Keep Custom destination, new-tab, display mode, and Button Variant controls unchanged.
- Remove the validation rule that requires a Custom Button icon.

This is an intentional hard removal. Existing `documentActions[].icon` values receive no migration,
are no longer part of the Payload schema or generated type, and are ignored by runtime rendering.

## Runtime Contract

- Download actions remain buttons with their fixed animated Download icon.
- View actions remain buttons with their fixed Eye icon.
- Custom Links remain visible underlined text links without icons or arrows.
- Custom Buttons always render their text label.
- A Custom Button renders the shared animated trailing arrow only when `showArrow` is `true`.
- Missing, `null`, or invalid `showArrow` values resolve to `false`.
- Button variant, destination, target, and accessibility behavior remain unchanged.

## Compact Presentation

Inline List and Grid Icon-only normally compact button actions to icon controls. Custom Buttons are
the exception after icon removal: they remain labelled buttons so a false Show Arrow value can never
produce an empty control. When enabled, the arrow follows the visible label. Download and View retain
their compact icon-only presentation in these layouts.

## Compatibility

This change deliberately does not preserve the visual output of existing Custom Buttons that used a
configured icon. Those buttons become labelled text buttons with no arrow unless editors enable Show
Arrow. No database migration or compatibility field is added. Other blocks are unaffected because
the removed icon field belongs only to Download List Document Actions.

## Testing

Focused Download List tests will verify:

- Button Icon is absent from the Document Actions schema and generated Payload type.
- Show Arrow has the correct default and Custom Button-only Admin condition.
- Custom Button validation no longer requires an icon.
- Resolution no longer reads an icon and normalizes Show Arrow to a boolean.
- Labelled Custom Buttons render without an arrow by default and with the shared arrow when enabled.
- Custom Buttons remain labelled in Inline and Grid Icon-only layouts.
- Download/View fixed icons and Custom Link presentation remain unchanged.
- Existing icon input is ignored at runtime.

Payload types, focused block tests, theme/rendering contracts, TypeScript, lint, formatting, and the
project-context check will be run during implementation. The previously denied context updater will
not be retried without separate explicit approval. No files will be staged or committed.
