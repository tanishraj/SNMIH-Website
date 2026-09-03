/**
 * Website theme registry.
 *
 * Each theme preset lives in its own file: `src/styles/themes/theme-<name>.css`.
 * A preset file holds two scoped variable blocks:
 *   :root[data-theme-color='<name>']        { ... }  // light mode
 *   :root[data-theme-color='<name>'].dark   { ... }  // dark mode
 *
 * To add a new website theme:
 * 1. Create `src/styles/themes/theme-<name>.css` with those two blocks.
 * 2. Import it in `src/styles/globals.css` (alongside the other theme imports).
 * 3. Add one entry here with a stable `value` (matching the attribute) and an
 *    admin-facing `label`.
 *
 * Payload Theme Settings (the `themeColor` select) and the frontend runtime
 * validation both read from this file, so the two stay in sync automatically.
 */
export const websiteThemes = [
  { label: 'SNMIH-Green', value: 'snmih-green' },
  { label: 'SNMIH-Blue', value: 'snmih-blue' },
] as const

export type WebsiteThemeValue = (typeof websiteThemes)[number]['value']

export const defaultWebsiteTheme: WebsiteThemeValue = 'snmih-blue'

export const websiteThemeValues = websiteThemes.map(
  ({ value }) => value,
) as readonly WebsiteThemeValue[]

export const websiteThemeOptions = websiteThemes.map(({ label, value }) => ({
  label,
  value,
}))

export function isWebsiteTheme(value: string): value is WebsiteThemeValue {
  return websiteThemeValues.includes(value as WebsiteThemeValue)
}

const legacyWebsiteThemeAliases = {
  default: 'snmih-green',
  snmih: 'snmih-blue',
} as const satisfies Record<string, WebsiteThemeValue>

export function normalizeWebsiteTheme(value: unknown): WebsiteThemeValue {
  if (typeof value !== 'string') return defaultWebsiteTheme
  if (isWebsiteTheme(value)) return value

  return (
    legacyWebsiteThemeAliases[value as keyof typeof legacyWebsiteThemeAliases] ??
    defaultWebsiteTheme
  )
}
