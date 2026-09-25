import { icons, type LucideIcon } from 'lucide-react'

const normalizeLucideIconName = (value: string) =>
  value
    .trim()
    .replace(/icon$/i, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()

const iconLookup = new Map<string, LucideIcon>(
  Object.entries(icons).map(([name, Icon]) => [
    normalizeLucideIconName(name),
    Icon as LucideIcon,
  ]),
)

const iconAliases = new Map<string, string>([
  ['usergroup', 'users'],
])

export function resolveLucideIcon(name?: string | null): LucideIcon | undefined {
  if (typeof name !== 'string') {
    return undefined
  }

  const normalizedName = normalizeLucideIconName(name)
  const resolvedName = iconAliases.get(normalizedName) ?? normalizedName

  return resolvedName ? iconLookup.get(resolvedName) : undefined
}
