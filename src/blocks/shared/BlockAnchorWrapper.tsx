import type { ReactNode } from 'react'

type BlockAnchorWrapperProps = {
  anchorID?: string
  children: ReactNode
}

export function BlockAnchorWrapper({ anchorID, children }: BlockAnchorWrapperProps) {
  if (!anchorID) return children

  return (
    <div data-block-anchor="true" id={anchorID}>
      {children}
    </div>
  )
}
