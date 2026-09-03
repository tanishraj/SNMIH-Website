import { SystemComingSoonView } from '@/components/system-pages/SystemComingSoonView'
import { System404View } from '@/components/system-pages/System404View'
import { SystemMaintenanceView } from '@/components/system-pages/SystemMaintenanceView'

export function SystemModeFallbackPage({
  mode,
}: {
  mode: 'comingSoon' | 'maintenance'
}) {
  if (mode === 'maintenance') {
    return (
      <SystemMaintenanceView
        badge="Maintenance"
        heading="This website is temporarily unavailable"
        description="We are carrying out scheduled updates to improve the website. Please check back shortly."
        statusDisplay="Maintenance"
      />
    )
  }

  return (
    <SystemComingSoonView
      badge="Coming Soon"
      heading="This website is being prepared"
      description="We are finalizing the website and its information. Please check back again soon."
      statusDisplay="Coming Soon"
    />
  )
}

export function DefaultNotFoundPage() {
  return (
    <System404View
      badge="404"
      heading="We couldn't find that page"
      description="It may have been moved, deleted, or the web address might be incorrect."
      primaryAction={{
        label: 'Go to homepage',
        url: '/',
      }}
      statusDisplay="404"
    />
  )
}
