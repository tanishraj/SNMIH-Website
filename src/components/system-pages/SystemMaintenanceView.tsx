import { SystemPageActions } from '@/components/system-pages/primitives/SystemPageActions'
import { SystemPageCopy } from '@/components/system-pages/primitives/SystemPageCopy'
import { SystemPageShell } from '@/components/system-pages/primitives/SystemPageShell'
import { SystemPageStatus } from '@/components/system-pages/primitives/SystemPageStatus'
import type { SystemPageViewProps } from '@/components/system-pages/types'

export function SystemMaintenanceView(props: SystemPageViewProps) {
  return (
    <SystemPageShell
      appearance={props.appearance}
      variant="maintenance"
      className="relative min-h-dvh overflow-hidden py-16 md:py-20"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/7 blur-3xl motion-safe:animate-[float_14s_ease-in-out_infinite] motion-reduce:animate-none" />
          <div className="absolute left-1/2 top-1/2 h-112 w-md -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/60" />
        </div>
      </div>
      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-5">
        <div className="flex flex-col items-center gap-5">
          <SystemPageStatus className="text-[clamp(4rem,15vw,7rem)] motion-safe:animate-[float_14s_ease-in-out_infinite] motion-reduce:animate-none">
            {props.statusDisplay || props.badge || 'Maintenance'}
          </SystemPageStatus>
          <SystemPageCopy description={props.description} heading={props.heading} />
        </div>
        <SystemPageActions
          primaryAction={props.primaryAction}
          secondaryAction={props.secondaryAction}
        />
        {props.supportingNote ? (
          <p className="max-w-lg animate-[fade-in_.7s_ease-out_.38s_both] text-[clamp(0.875rem,2.2vw,1rem)] leading-6 text-muted-foreground">
            {props.supportingNote}
          </p>
        ) : null}
      </div>
    </SystemPageShell>
  )
}
