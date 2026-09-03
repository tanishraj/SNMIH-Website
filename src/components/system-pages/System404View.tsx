import { SystemPageActions } from '@/components/system-pages/primitives/SystemPageActions'
import { SystemPageShell } from '@/components/system-pages/primitives/SystemPageShell'
import type { SystemPageViewProps } from '@/components/system-pages/types'

export function System404View(props: SystemPageViewProps) {
  const statusValue = props.statusDisplay || '404'
  const showEyebrow = Boolean(props.badge && props.badge !== statusValue)

  return (
    <SystemPageShell
      appearance={props.appearance}
      variant="notFound"
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
          {showEyebrow ? (
            <p className="animate-[fade-in_.7s_ease-out_both] font-mono text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {props.badge}
            </p>
          ) : null}
          <div className="flex flex-col items-center gap-4">
            <div className="animate-[fade-in_.7s_ease-out_both] select-none text-[clamp(4rem,15vw,7rem)] font-semibold leading-none text-foreground/10 motion-safe:animate-[float_14s_ease-in-out_infinite] motion-reduce:animate-none">
              {statusValue}
            </div>
            <h1 className="max-w-2xl animate-[fade-in_.7s_ease-out_.12s_both] text-balance text-[clamp(1.8rem,7vw,3.25rem)] font-semibold leading-[0.95] text-foreground">
              {props.heading}
            </h1>
            {props.description ? (
              <p className="max-w-2xl animate-[fade-in_.7s_ease-out_.2s_both] text-balance text-[clamp(1rem,1.6vw,1.125rem)] leading-7 text-muted-foreground">
                {props.description}
              </p>
            ) : null}
          </div>
        </div>
        <SystemPageActions
          primaryAction={props.primaryAction}
          secondaryAction={props.secondaryAction}
        />
      </div>
    </SystemPageShell>
  )
}
