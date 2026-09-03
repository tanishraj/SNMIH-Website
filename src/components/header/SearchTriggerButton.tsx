'use client'

type Props = { size?: 'compact' | 'default' | 'large' }

const sizeClasses = {
  compact: 'size-9',
  default: 'size-10',
  large: 'size-11',
}

export function SearchTriggerButton({ size = 'default' }: Props) {
  const openSearch = () => {
    window.dispatchEvent(new Event('open-search-dialog'))
  }

  return (
    <button
      type="button"
      aria-label="Open site search (⌘K)"
      title="Search (⌘K)"
      onClick={openSearch}
      className={`inline-flex items-center justify-center rounded-control text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${sizeClasses[size]}`}
    >
      <svg aria-hidden="true" className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    </button>
  )
}
