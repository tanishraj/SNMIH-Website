import { NextResponse } from 'next/server'

import { getCurrentCMSUser } from '@/lib/cmsSession'
import type { FrontendSessionResponse } from '@/lib/frontendSession'

export const dynamic = 'force-dynamic'

const responseInit = {
  headers: { 'Cache-Control': 'private, no-store, max-age=0' },
}

export async function GET() {
  try {
    const user = await getCurrentCMSUser()
    const body: FrontendSessionResponse = {
      user: user
        ? {
            email: user.email,
            role: user.role ?? null,
          }
        : null,
    }

    return NextResponse.json(body, responseInit)
  } catch {
    return NextResponse.json<FrontendSessionResponse>({ user: null }, responseInit)
  }
}
