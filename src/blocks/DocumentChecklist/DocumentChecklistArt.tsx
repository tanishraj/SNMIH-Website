import { cn } from '@/lib/utils'

type DocumentChecklistArtProps = {
  sealCaption?: string
  sealLabel: string
  title: string
}

const paperClasses =
  'absolute rounded-[6px] shadow-[0_1px_0_rgb(0_0_0/0.04),0_30px_50px_-28px_rgb(11_28_69/0.5)]'

/** Decorative stack of certificates with a verification seal for the Composition presentation. */
export function DocumentChecklistArt({ sealCaption, sealLabel, title }: DocumentChecklistArtProps) {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto h-80 w-full max-w-md sm:h-[26rem]"
      data-document-checklist-art="true"
    >
      <div
        className={cn(paperClasses, 'top-10 left-[6%] h-[78%] w-[58%] -rotate-[8deg] bg-[#f3f0e8]')}
      />
      <div
        className={cn(paperClasses, 'top-2 left-[30%] h-[78%] w-[58%] rotate-[4deg] bg-[#f7f5ef]')}
      />
      <div
        className={cn(
          paperClasses,
          'top-14 left-[16%] z-10 flex h-[78%] w-[58%] -rotate-1 flex-col gap-2.5 bg-[#fbfaf6] px-7 py-7',
        )}
      >
        <span className="mb-2 size-9 rounded-full border-[1.5px] border-[#11275a]/45" />
        <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#11275a]">
          {title}
        </span>
        <span className="mt-3 h-1.5 w-full rounded-full bg-[#e6e1d4]" />
        <span className="h-1.5 w-[85%] rounded-full bg-[#e6e1d4]" />
        <span className="h-1.5 w-[92%] rounded-full bg-[#e6e1d4]" />
        <span className="h-1.5 w-[60%] rounded-full bg-[#e6e1d4]" />
        <span className="mt-5 h-1.5 w-[88%] rounded-full bg-[#e6e1d4]" />
        <span className="h-1.5 w-[70%] rounded-full bg-[#e6e1d4]" />
      </div>
      <div className="absolute top-[68%] left-[58%] z-20 size-24 sm:size-28">
        <span className="absolute top-[74%] left-[24%] -z-10 h-16 w-6 rotate-[14deg] bg-[#2a6b3c] [clip-path:polygon(0_0,100%_0,100%_100%,50%_80%,0_100%)]" />
        <span className="absolute top-[74%] left-[50%] -z-10 h-16 w-6 -rotate-[14deg] bg-[#23593a] [clip-path:polygon(0_0,100%_0,100%_100%,50%_80%,0_100%)]" />
        <span className="flex size-full flex-col items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#3f9b5a,#2a6b3c_70%)] text-center font-mono text-[10px] leading-snug font-semibold tracking-[0.14em] text-white uppercase shadow-[0_14px_24px_-12px_rgb(0_0_0/0.5),inset_0_0_0_6px_rgb(255_255_255/0.14)]">
          <span>{sealLabel}</span>
          {sealCaption ? <span>· {sealCaption} ·</span> : null}
        </span>
      </div>
    </div>
  )
}
