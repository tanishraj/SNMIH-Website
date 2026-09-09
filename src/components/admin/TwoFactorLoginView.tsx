import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import { getSafeRedirect } from 'payload/shared'
import { Logo } from '@payloadcms/next/rsc'

import { TwoFactorAuthForm } from './TwoFactorAuthForm'

export function TwoFactorLoginView({ initPageResult, searchParams, params }: AdminViewServerProps) {
  const redirectTo = getSafeRedirect({
    fallbackTo: '/admin',
    redirectTo: searchParams?.redirect ?? '/admin',
  })
  if (initPageResult.req.user) redirect(redirectTo)
  const { locale, permissions, req } = initPageResult
  return (
    <>
      <div className="login__brand">
        <Logo
          i18n={req.i18n}
          locale={locale}
          params={params}
          payload={req.payload}
          permissions={permissions}
          searchParams={searchParams}
          user={req.user ?? undefined}
        />
      </div>
      <TwoFactorAuthForm redirectTo={redirectTo} />
    </>
  )
}
