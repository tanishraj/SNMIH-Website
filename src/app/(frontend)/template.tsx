import { RouteTransitionCommitSignal } from '@/components/global/RouteTransitionScrollGuard'
import { Suspense } from 'react'

export default function FrontendTemplate({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <RouteTransitionCommitSignal />
      </Suspense>
    </>
  )
}
