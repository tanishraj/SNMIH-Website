import { ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { AdminUserMenu } from '@/components/admin/AdminUserMenu'
import { Button } from '@/components/ui/button'
import { formatCMSRoleLabel, type FrontendSessionUser } from '@/lib/frontendSession'

export function AdminSessionBar({
  user,
}: {
  user: FrontendSessionUser | null
}) {
  if (!user) {
    return null
  }

  const roleLabel = formatCMSRoleLabel(user.role)

  return (
    <div className="fixed inset-x-0 top-0 z-[1100] border-b border-white/10 bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex min-h-10 w-full max-w-screen-2xl items-center justify-between gap-3 px-4 py-2">
        <div className="flex min-w-0 items-center">
          <Link
            href="/admin"
            className="inline-flex shrink-0 items-center gap-2 text-zinc-50/90 transition-opacity hover:opacity-80"
            aria-label="Open Payload admin"
            target="_blank"
            rel="noreferrer"
          >
            <Image
              src="/brands/payload-icon-white.svg"
              alt="Payload"
              width={22}
              height={25}
              className="h-[18px] w-auto"
              priority
            />
            <span className="text-xs font-semibold tracking-tight text-zinc-100">
              Payload
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            size="xs"
            variant="ghost"
            className="h-8 rounded-full px-2.5 text-zinc-300 hover:bg-white/8 hover:text-white"
          >
            <Link href="/admin" target="_blank" rel="noreferrer">
              Open Admin
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
          <AdminUserMenu
            email={user.email}
            roleLabel={roleLabel}
          />
        </div>
      </div>
    </div>
  )
}
