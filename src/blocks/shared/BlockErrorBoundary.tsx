'use client'
import React from 'react'

type Props = {
  blockType: string
  children: React.ReactNode
}

type State = {
  hasError: boolean
  error?: Error
}

export class BlockErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[BlockErrorBoundary] Block "${this.props.blockType}" failed to render:`, error)
    }
  }

  render() {
    if (this.state.hasError) {
      if (process.env.NODE_ENV === 'development') {
        return (
          <div className="mx-auto w-full max-w-screen-2xl px-4 py-8">
            <div className="rounded-card border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <strong>Block error:</strong> &ldquo;{this.props.blockType}&rdquo; failed to render.
              {this.state.error ? (
                <pre className="mt-2 overflow-auto text-xs opacity-75">{this.state.error.message}</pre>
              ) : null}
            </div>
          </div>
        )
      }
      // In production, fail silently — one broken block should not affect the rest of the page.
      return null
    }

    return this.props.children
  }
}
