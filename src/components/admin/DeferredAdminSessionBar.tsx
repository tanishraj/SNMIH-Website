'use client'

import { useEffect, useState } from 'react'

import { AdminSessionBar } from '@/components/admin/AdminSessionBar'
import {
  isFrontendSessionResponse,
  type FrontendSessionUser,
} from '@/lib/frontendSession'

const TOOLBAR_OFFSET_PROPERTY = '--cms-toolbar-offset'

export function DeferredAdminSessionBar() {
  const [user, setUser] = useState<FrontendSessionUser | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    void fetch('/api/frontend-session', {
      cache: 'no-store',
      credentials: 'include',
      signal: controller.signal,
    })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((value: unknown) => {
        if (!controller.signal.aborted && isFrontendSessionResponse(value)) {
          setUser(value.user)
        }
      })
      .catch(() => undefined)

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (!user) {
      root.style.removeProperty(TOOLBAR_OFFSET_PROPERTY)
      return
    }

    root.style.setProperty(TOOLBAR_OFFSET_PROPERTY, '3rem')
    return () => {
      root.style.removeProperty(TOOLBAR_OFFSET_PROPERTY)
    }
  }, [user])

  return <AdminSessionBar user={user} />
}
