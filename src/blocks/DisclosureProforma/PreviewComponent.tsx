'use client'
import { DisclosurePresentation } from './Presentation'
import type { DisclosureBlockLike } from './shared'
export function DisclosureProformaPreviewBlockComponent(props: DisclosureBlockLike) {
  return <DisclosurePresentation {...props} draft />
}
