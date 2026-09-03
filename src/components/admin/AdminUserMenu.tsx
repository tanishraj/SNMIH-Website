'use client'

import { ChevronDown, LogOut, UserRound } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'

type AdminUserMenuProps = {
  email?: string | null
  roleLabel: string
}

const toInitial = (email?: string | null) => {
  if (!email) {
    return 'U'
  }

  return email.trim().charAt(0).toUpperCase() || 'U'
}

export function AdminUserMenu({
  email,
  roleLabel,
}: AdminUserMenuProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const handleLogout = () => {
    startTransition(async () => {
      const response = await fetch('/api/users/logout', {
        credentials: 'include',
        method: 'POST',
      })

      if (!response.ok) {
        window.location.assign('/admin')
        return
      }

      window.location.reload()
    })
  }

  return (
    <div ref={rootRef} className="relative flex items-center">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open user menu"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-8 items-center gap-2 rounded-full border border-white/10 px-2.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/8 hover:text-white"
      >
        <span className="inline-flex size-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-zinc-100">
          {toInitial(email)}
        </span>
        <span className="hidden sm:inline">{roleLabel}</span>
        <ChevronDown className="size-3.5" />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[1200] w-56 rounded-2xl border border-white/10 bg-zinc-950 p-2 shadow-2xl shadow-black/40">
          <div className="border-b border-white/10 px-3 py-2">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-100">
              <UserRound className="size-4 text-zinc-400" />
              <span>{roleLabel}</span>
            </div>
            {email ? (
              <p className="mt-1 truncate text-xs text-zinc-400">{email}</p>
            ) : null}
          </div>

          <div className="pt-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              disabled={isPending}
              className="w-full justify-start text-zinc-200 hover:bg-white/8 hover:text-white"
            >
              <LogOut className="size-4" />
              {isPending ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
