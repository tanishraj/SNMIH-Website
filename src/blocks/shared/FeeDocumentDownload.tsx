import { FileText } from 'lucide-react'
import { resolveBlockAppearanceClasses } from '@/blocks/shared/blockAppearance'
import { resolveCardSurface } from '@/blocks/shared/cardSurface'
import { ContentActions } from '@/components/ContentActions'
import { cn } from '@/lib/utils'
import type { ResolvedFeeDocumentDownload } from './feeDocumentAction'

export { resolveFeeDocumentButtonVariant } from './feeDocumentAction'
export type {
  FeeDocumentDownloadActionMode,
  FeeDocumentDownloadButtonVariant,
  ResolvedFeeDocumentDownload,
} from './feeDocumentAction'

export function FeeDocumentDownload({ download }: { download: ResolvedFeeDocumentDownload }) {
  const appearance = resolveBlockAppearanceClasses(download.appearance)
  const background =
    appearance.background === 'none' ? download.sectionBackground : appearance.background
  const surface = resolveCardSurface('default', background ?? undefined)
  const isBrand = background === 'brand' || background === 'gradient-brand'
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-card border border-current/15 p-5 sm:flex-row sm:items-center sm:justify-between',
        appearance.className,
      )}
      data-fee-document="true"
      data-fee-download-background={appearance.background}
    >
      <div className="flex items-center gap-3">
        <FileText aria-hidden="true" className="size-5" />
        <p className="font-semibold">Official fee structure</p>
      </div>
      <ContentActions
        actions={[download.action]}
        className="sm:w-auto [&_a]:max-w-full [&_a]:whitespace-normal"
        data-fee-download-mode={download.action.mode}
        buttonClassNames={{
          ...surface.button,
          ...(isBrand
            ? { outline: 'border-current/70 text-current hover:border-current hover:bg-current/10' }
            : {}),
        }}
        linkClassName={surface.link}
      />
    </div>
  )
}
