# Appearance Guide

## What This Section Is

`Appearance` controls the SNMIH-Green or SNMIH-Blue theme preset and whether the public site follows the visitor's system preference or forces light or dark mode.

In North Valley Medical College, this is the section you would use when switching the overall website visual theme or deciding whether the site should follow the visitor’s system preference or force a specific light or dark experience.

## When To Use It

Use `Appearance` when you need to:

- switch the site to a different approved theme preset
- choose whether the site follows system, light, or dark color mode

The available institutional palettes are:

- `SNMIH-Blue` is the default and fallback institutional palette. It keeps the established navy action color and square presentation.
- `SNMIH-Green` uses an institutional green action color for buttons, links, active tabs, and focus states, with restrained rounded controls and surfaces.

Do not use this section for editing page content, navigation, or branding assets. This is global presentation control.

## How It Connects To The Website

This global is loaded by the frontend layout on every page. It controls:

- which theme preset is applied site-wide
- whether the site follows `System`, `Light`, or `Dark` color scheme behavior

Because the setting affects the entire public site shell, a theme change can alter how every page feels at once.

Older deployments may still contain the former `default` or `snmih` values. The frontend preserves
their existing appearance until the checked-in reversible migration renames them to `snmih-green`
and `snmih-blue`. Run that migration through the normal deployment workflow rather than editing the
stored value directly.

## Step-By-Step Medical College Example

Switch North Valley Medical College to an approved visual preset:

1. Open `Appearance` in `Settings`.
2. Review the available `Theme Color` presets.
3. Select the approved preset for the institution.
4. Choose the `Color Scheme` behavior that fits the site:
   `System` follows visitor preference, `Light` forces light mode, and `Dark` forces dark mode.
5. Save the global.
6. Check the frontend on desktop and mobile.

Expected website result:

- the selected theme preset and color-scheme behavior apply across the public website

## Best Practices

- treat global theme changes as a design release, not a casual toggle
- check key pages after every theme change
- confirm text contrast and image treatment still feel correct
- align theme changes with the broader brand direction in `Site Identity`

## Common Mistakes And Recovery

- changing the theme without checking real frontend pages
- forcing a color scheme that hurts readability for the chosen design
- using theme settings as a substitute for proper content or layout fixes

If the site suddenly looks wrong everywhere, review `Appearance` first and confirm the chosen preset and color scheme match the expected design direction.

## Related Guides

- [Site Identity](./site-settings.md)
- [Pages](./pages.md)
- [Headers](./headers.md)
- [Footers](./footers.md)
