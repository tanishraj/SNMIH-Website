/**
 * Only one celebration may open per page. Hosts with an active celebration register here; the
 * highest priority wins (a page's Celebration block outranks the site-wide host), and ties go to
 * the host that registered first.
 */
export const CELEBRATION_PRIORITY = { page: 2, site: 1 } as const
export type CelebrationPriority = keyof typeof CELEBRATION_PRIORITY

const hosts = new Map<string, { order: number; priority: number }>()
const listeners = new Set<() => void>()
let order = 0

const notify = () => listeners.forEach((listener) => listener())

export const subscribeCelebrationSlot = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getCelebrationSlotWinner = (): string | null => {
  let winner: string | null = null
  let best: { order: number; priority: number } | null = null

  for (const [id, entry] of hosts) {
    if (
      !best ||
      entry.priority > best.priority ||
      (entry.priority === best.priority && entry.order < best.order)
    ) {
      winner = id
      best = entry
    }
  }

  return winner
}

export const registerCelebrationHost = (id: string, priority: CelebrationPriority) => {
  hosts.set(id, { order: order++, priority: CELEBRATION_PRIORITY[priority] })
  notify()

  return () => {
    hosts.delete(id)
    notify()
  }
}
