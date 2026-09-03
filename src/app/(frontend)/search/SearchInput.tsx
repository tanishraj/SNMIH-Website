'use client'

import { useState } from 'react'

import { Input } from '@/components/ui/input'

export function SearchInput({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue)

  return (
    <div className="relative flex-1">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>

      <Input
        type="text"
        name="q"
        id="search-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search…"
        aria-label="Search query"
        autoFocus
        autoComplete="off"
        className="h-10 rounded-control pl-9 pr-8"
      />

      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-compact text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg
            aria-hidden="true"
            className="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
