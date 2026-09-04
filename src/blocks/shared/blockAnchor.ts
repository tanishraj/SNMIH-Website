import type { TextField } from 'payload'

export const BLOCK_ANCHOR_ID_MAX_LENGTH = 80

const BLOCK_ANCHOR_ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
const RESERVED_BLOCK_ANCHOR_IDS = new Set(['main-content'])

export const normalizeBlockAnchorID = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined

  const anchorID = value.trim()

  return anchorID &&
    anchorID.length <= BLOCK_ANCHOR_ID_MAX_LENGTH &&
    BLOCK_ANCHOR_ID_PATTERN.test(anchorID) &&
    !RESERVED_BLOCK_ANCHOR_IDS.has(anchorID)
    ? anchorID
    : undefined
}

export const validateBlockAnchorID = (value: unknown): true | string => {
  if (value === null || value === undefined || value === '') return true
  if (typeof value !== 'string' || value.trim() !== value) {
    return 'Use lowercase letters, numbers, and single hyphens without spaces.'
  }
  if (RESERVED_BLOCK_ANCHOR_IDS.has(value)) {
    return `“${value}” is reserved by the site layout. Choose another anchor ID.`
  }

  return (
    normalizeBlockAnchorID(value) !== undefined ||
    'Start with a lowercase letter and use only lowercase letters, numbers, and single hyphens.'
  )
}

export const createBlockAnchorField = (): TextField => ({
  name: 'anchorId',
  label: 'Section Anchor ID',
  type: 'text',
  maxLength: BLOCK_ANCHOR_ID_MAX_LENGTH,
  validate: validateBlockAnchorID,
  admin: {
    description:
      'Optional stable link target. Enter a value such as admissions, then link to #admissions on this page or /page-path#admissions from another page.',
    placeholder: 'admissions',
  },
})

export const validateUniqueBlockAnchorIDs = (value: unknown): true | string => {
  if (!Array.isArray(value)) return true

  const usedAnchorIDs = new Set<string>()

  for (const block of value) {
    const anchorID = normalizeBlockAnchorID(
      typeof block === 'object' && block !== null && 'anchorId' in block
        ? block.anchorId
        : undefined,
    )

    if (!anchorID) continue
    if (usedAnchorIDs.has(anchorID)) {
      return `Section Anchor ID “${anchorID}” is used more than once in this layout. Choose a unique value.`
    }

    usedAnchorIDs.add(anchorID)
  }

  return true
}

export const claimBlockAnchorID = (
  value: unknown,
  usedAnchorIDs: Set<string>,
): string | undefined => {
  const anchorID = normalizeBlockAnchorID(value)
  if (!anchorID || usedAnchorIDs.has(anchorID)) return undefined

  usedAnchorIDs.add(anchorID)
  return anchorID
}
