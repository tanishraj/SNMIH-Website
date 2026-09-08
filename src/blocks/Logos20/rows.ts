export type LogoItems = { id?: string | null; name?: string | null; image?: unknown }[] | null

export type LogoRow = { id?: string | null; logos?: LogoItems }

export type LogoRowsData = {
  rows?: LogoRow[] | null
  topRow?: LogoItems
  bottomRow?: LogoItems
  additionalRows?: LogoRow[] | null
}

// An explicitly empty new list is authoritative, so deleted rows never return from legacy fields.
export function resolveLogoRows({
  rows,
  topRow,
  bottomRow,
  additionalRows,
}: LogoRowsData): LogoRow[] {
  if (rows !== undefined) return rows ?? []
  if (!topRow?.length && !bottomRow?.length && !additionalRows?.length) return []
  return [{ logos: topRow ?? [] }, { logos: bottomRow ?? [] }, ...(additionalRows ?? [])]
}
