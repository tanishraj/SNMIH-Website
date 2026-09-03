import Link from 'next/link'

import type { Article } from '@/payload-types'

export function ArticleArchivePage({
  archiveLabel,
  articles,
  archiveType,
}: {
  archiveLabel: string
  archiveType: 'category' | 'tag'
  articles: Article[]
}) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Article {archiveType}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          {archiveLabel}
        </h1>
      </header>
      {articles.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="flex flex-col gap-3 rounded-card border bg-background p-6 transition-colors hover:border-foreground/30"
            >
              <h2 className="text-xl font-semibold text-foreground">{article.title}</h2>
              <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">
                {article.excerpt}
              </p>
              <span className="text-sm font-medium text-foreground">Read article</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-card border border-dashed bg-background/70 p-8 text-sm text-muted-foreground">
          No published articles are assigned to this {archiveType} yet.
        </div>
      )}
    </section>
  )
}
