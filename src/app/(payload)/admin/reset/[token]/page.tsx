import type { Metadata } from 'next'

import { TwoFactorAuthForm } from '@/components/admin/TwoFactorAuthForm'

export const metadata: Metadata = {
  title: 'Reset password',
  robots: { index: false, follow: false },
}

// This explicit route extends the native reset form with the second factor. Both forms
// submit to Payload's native operation, which enforces the same beforeLogin hook.
export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return (
    <main className="two-factor-reset">
      <TwoFactorAuthForm resetToken={token} />
    </main>
  )
}
