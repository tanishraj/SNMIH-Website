'use client'

import Link from 'next/link'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        500
      </p>
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-[clamp(1.8rem,7vw,3.25rem)] font-semibold leading-[0.95]">
          Something went wrong
        </h1>
        <p className="max-w-sm text-[clamp(1rem,1.6vw,1.125rem)] leading-7 text-muted-foreground">
          An unexpected error occurred. Please try again or come back later.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-control bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center rounded-control border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          Go to homepage
        </Link>
      </div>
    </div>
  )
}
