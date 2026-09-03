import { System404View } from '@/components/system-pages/System404View'
import { resolveSystemPageAction } from '@/lib/systemPageActions'
import type { System404Block as System404BlockData } from '@/payload-types'

export function System404BlockComponent(props: System404BlockData) {
  const primaryAction = resolveSystemPageAction(props.primaryAction)
  const secondaryAction = resolveSystemPageAction(props.secondaryAction)

  return (
    <System404View
      appearance={props.appearance}
      badge={props.badge}
      description={props.description}
      heading={props.heading}
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
      statusDisplay={props.badge || '404'}
      supportingNote={props.supportingNote}
    />
  )
}
