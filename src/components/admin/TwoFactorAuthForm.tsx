'use client'

import { useState, type FormEvent } from 'react'

import './TwoFactor.scss'

export function TwoFactorAuthForm({
  redirectTo = '/admin',
  resetToken,
}: {
  redirectTo?: string
  resetToken?: string
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const isReset = resetToken !== undefined

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const password = String(values.get('password') ?? '')
    if (isReset && password !== values.get('confirmPassword')) {
      setError('The passwords do not match. Enter the same password in both fields.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/users/${isReset ? 'reset-password' : 'login'}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isReset ? { token: resetToken } : { email: values.get('email') }),
          password,
          twoFactorCode: values.get('twoFactorCode'),
        }),
      })
      if (!response.ok) {
        const body = await response.json()
        throw new Error(
          body.errors?.[0]?.message ?? 'Unable to sign in. Check your details and try again.',
        )
      }
      window.location.assign(redirectTo)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to connect. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="two-factor two-factor--auth">
      <h1>{isReset ? 'Reset password' : 'Log in'}</h1>
      <form onSubmit={submit}>
        <fieldset disabled={busy} className="two-factor__fields">
          {!isReset && (
            <label>
              Email
              <input name="email" type="email" autoComplete="username" required />
            </label>
          )}
          <label>
            {isReset ? 'New password' : 'Password'}
            <input
              name="password"
              type="password"
              autoComplete={isReset ? 'new-password' : 'current-password'}
              required
            />
          </label>
          {isReset && (
            <label>
              Confirm new password
              <input name="confirmPassword" type="password" autoComplete="new-password" required />
            </label>
          )}
          <label>
            Two-factor code (if enabled)
            <input
              name="twoFactorCode"
              type="text"
              autoComplete="one-time-code"
              maxLength={80}
              spellCheck={false}
              autoCapitalize="none"
              aria-describedby="two-factor-login-help"
            />
          </label>
          <p id="two-factor-login-help" className="two-factor__help">
            Enter the six-digit code from your authenticator app or an unused recovery code. Leave
            this blank if you have not enabled two-factor authentication.
          </p>
          {error && (
            <p role="alert" className="two-factor__error">
              {error}
            </p>
          )}
          <button className="two-factor__button" type="submit">
            {busy ? 'Please wait…' : isReset ? 'Reset password and log in' : 'Log in'}
          </button>
        </fieldset>
      </form>
      <a href={isReset ? '/admin/login' : '/admin/forgot'}>
        {isReset ? 'Back to login' : 'Forgot password?'}
      </a>
    </div>
  )
}
