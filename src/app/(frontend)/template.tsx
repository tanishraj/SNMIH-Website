import { RouteTransitionCommitSignal } from '@/components/global/RouteTransitionScrollGuard'

export default function FrontendTemplate({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <RouteTransitionCommitSignal />
    </>
  )
}
