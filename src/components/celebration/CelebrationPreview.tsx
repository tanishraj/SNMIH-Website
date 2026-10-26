'use client'

import type { CelebrationView } from '@/lib/celebrations/view'
import { cn } from '@/lib/utils'

import styles from './celebration.module.css'
import { getCelebrationWidth, CelebrationCard } from './CelebrationCard'

const formatWindow = (view: CelebrationView) =>
  view.startKey === view.endKey ? view.startKey : `${view.startKey} – ${view.endKey}`

/**
 * Static stand-in for live preview and block thumbnails: the celebration card as it will look,
 * with a note on when it appears, instead of opening a modal over the editor.
 */
export function CelebrationPreview({ view }: { view: CelebrationView }) {
  return (
    <section className="mx-auto w-full max-w-screen-2xl px-4 py-8" data-celebration-preview="true">
      <p className="mb-3 text-center font-mono text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        Celebration modal · appears {formatWindow(view)}
      </p>
      <div className={cn(styles.root, styles.preview)}>
        <div
          className={cn(styles.root, styles.content)}
          style={{ ['--cel-width' as string]: `${getCelebrationWidth(view)}px` }}
        >
          <CelebrationCard view={view} />
        </div>
      </div>
    </section>
  )
}
