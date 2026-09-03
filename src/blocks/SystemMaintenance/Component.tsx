import { SystemMaintenanceView } from '@/components/system-pages/SystemMaintenanceView'
import { resolveSystemPageAction } from '@/lib/systemPageActions'
import type { SystemMaintenanceBlock as SystemMaintenanceBlockData } from '@/payload-types'

export function SystemMaintenanceBlockComponent(props: SystemMaintenanceBlockData) {
  const primaryAction = resolveSystemPageAction(props.primaryAction)
  const secondaryAction = resolveSystemPageAction(props.secondaryAction)

  return (
    <SystemMaintenanceView
      appearance={props.appearance}
      badge={props.badge}
      description={props.description}
      heading={props.heading}
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
      statusDisplay={props.badge || 'Maintenance'}
      supportingNote={props.supportingNote}
    />
  )
}
