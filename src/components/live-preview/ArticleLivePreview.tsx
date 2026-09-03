'use client'

import { RefreshRouteOnSave, useLivePreview } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'

import { ArticlePage } from '@/components/articles/ArticlePage'
import type { Article } from '@/payload-types'

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export function ArticleLivePreview({ initialData }: { initialData: Article }) {
  const router = useRouter()
  const { data } = useLivePreview<Article>({ depth: 2, initialData, serverURL })

  return (
    <>
      <ArticlePage article={data} relatedArticles={[]} />
      <RefreshRouteOnSave depth={2} refresh={() => router.refresh()} serverURL={serverURL} />
    </>
  )
}
