export type OverlayDisplayMode = 'always' | 'hover'

export const normalizeOverlayDisplayMode = (
  value: unknown,
  fallback: OverlayDisplayMode,
): OverlayDisplayMode => (value === 'always' || value === 'hover' ? value : fallback)
