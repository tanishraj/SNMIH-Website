'use client'

import { Copy, Share2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

type ShareStatus = 'copied' | 'error' | null

export function NewsEventShareActions({ title, url }: { title: string; url: string }) {
  const [status, setStatus] = useState<ShareStatus>(null)

  const copyLink = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard access is unavailable.')
      }

      await navigator.clipboard.writeText(url)
      setStatus('copied')
    } catch {
      setStatus('error')
    }
  }

  const share = async () => {
    if (!navigator.share) {
      await copyLink()
      return
    }

    try {
      await navigator.share({ title, url })
      setStatus(null)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          className="border-current/30 text-current hover:border-current/50 hover:bg-current/10"
          onClick={share}
          size="sm"
          type="button"
          variant="outline"
        >
          <Share2 aria-hidden="true" />
          Share
        </Button>
        <Button
          className="border-current/30 text-current hover:border-current/50 hover:bg-current/10"
          onClick={copyLink}
          size="sm"
          type="button"
          variant="outline"
        >
          <Copy aria-hidden="true" />
          Copy Link
        </Button>
      </div>
      <p aria-live="polite" className="min-h-5 text-sm text-current/70" role="status">
        {status === 'copied' ? 'Link copied.' : null}
        {status === 'error' ? 'Unable to share this link. Please copy it from your browser.' : null}
      </p>
    </div>
  )
}
