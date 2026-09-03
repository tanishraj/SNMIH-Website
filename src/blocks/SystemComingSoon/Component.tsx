import { SystemComingSoonView } from '@/components/system-pages/SystemComingSoonView'
import { resolveSystemPageAction } from '@/lib/systemPageActions'
import type { SystemComingSoonBlock as SystemComingSoonBlockData } from '@/payload-types'

export function SystemComingSoonBlockComponent(props: SystemComingSoonBlockData) {
  const primaryAction = resolveSystemPageAction(props.primaryAction)
  const secondaryAction = resolveSystemPageAction(props.secondaryAction)

  return (
    <SystemComingSoonView
      appearance={props.appearance}
      badge={props.badge}
      description={props.description}
      heading={props.heading}
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
      statusDisplay={props.badge || 'Coming Soon'}
      supportingNote={props.supportingNote}
    />
  )
}
