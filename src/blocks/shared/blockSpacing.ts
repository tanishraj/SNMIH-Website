export type RegularBlockSize = 'comfortable' | 'compact' | 'default' | 'none'

export const regularBlockContainerClasses = 'mx-auto w-full max-w-screen-2xl px-4'

export const regularBlockMobilePaddingClasses = {
  none: '',
  compact: 'py-8 md:py-10',
  default: 'py-12 md:py-16',
  comfortable: 'py-20 md:py-28',
} as const satisfies Record<RegularBlockSize, string>
