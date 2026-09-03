import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
import {
  BreadcrumbTrail,
  getVisibleBreadcrumbItems,
  type BreadcrumbAlignment,
  type BreadcrumbSeparator,
  type BreadcrumbSize,
} from '@/components/BreadcrumbTrail'
import {
  resolveCustomPageBreadcrumbs,
  type ManualBreadcrumbInput,
  type ResolvedPageBreadcrumb,
} from '@/lib/pageBreadcrumbs'
import { cn } from '@/lib/utils'

type BreadcrumbBlockProps = {
  alignment?: BreadcrumbAlignment | null
  appearance?: BlockAppearance | null
  automaticBreadcrumbs?: ResolvedPageBreadcrumb[]
  breadcrumbMode?: 'automatic' | 'custom' | null
  breadcrumbs?: ManualBreadcrumbInput[] | null
  sectionPadding?: 'compact' | 'default' | 'none' | null
  separator?: BreadcrumbSeparator | null
  showCurrentPage?: boolean | null
  showHome?: boolean | null
  size?: BreadcrumbSize | null
}

export function BreadcrumbBlockComponent({
  alignment = 'left',
  appearance,
  automaticBreadcrumbs = [],
  breadcrumbMode = 'automatic',
  breadcrumbs,
  sectionPadding = 'compact',
  separator = 'chevron',
  showCurrentPage = true,
  showHome = true,
  size = 'default',
}: BreadcrumbBlockProps) {
  const items =
    breadcrumbMode === 'custom' ? resolveCustomPageBreadcrumbs(breadcrumbs) : automaticBreadcrumbs
  const visibility = {
    items,
    showCurrentPage: showCurrentPage !== false,
    showHome: showHome !== false,
  }

  if (getVisibleBreadcrumbItems(visibility).length === 0) return null

  const { className: appearanceClassName, surface } = resolveBlockAppearanceClasses(appearance)

  return (
    <section
      className={cn(
        regularBlockMobilePaddingClasses[sectionPadding ?? 'compact'],
        appearanceClassName,
      )}
      data-block-surface={surface}
      data-breadcrumb-block="true"
    >
      <div className={regularBlockContainerClasses}>
        <BreadcrumbTrail
          alignment={alignment ?? 'left'}
          linkClassName={
            surface === 'light'
              ? 'text-primary hover:text-primary/80'
              : 'text-current hover:text-current/80'
          }
          separator={separator ?? 'chevron'}
          size={size ?? 'default'}
          {...visibility}
        />
      </div>
    </section>
  )
}
