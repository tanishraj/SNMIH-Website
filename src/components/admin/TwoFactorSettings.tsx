'use client'

import { useAuth, useDocumentInfo } from '@payloadcms/ui'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

import './TwoFactor.scss'

type Status = { enabled: boolean; recoveryCodesRemaining: number }
type Setup = { secret: string; uri: string }

export function TwoFactorSettings() {
  const { user } = useAuth()
  const { id } = useDocumentInfo()
  const inputID = useId()
  const isOwnAccount = Boolean(user?.id && id && String(user.id) === String(id))
  const [status, setStatus] = useState<Status | null>(null)
  const [setup, setSetup] = useState<Setup | null>(null)
  const [codes, setCodes] = useState<string[] | null>(null)
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [signedOut, setSignedOut] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)
  const setupHeadingRef = useRef<HTMLHeadingElement>(null)
  const recoveryHeadingRef = useRef<HTMLHeadingElement>(null)
  const continueRef = useRef<HTMLAnchorElement>(null)

  const loadStatus = useCallback(() => {
    return fetch('/api/users/two-factor', {
      cache: 'no-store',
      credentials: 'same-origin',
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load account security. Try again.')
        setStatus(await response.json())
        setError('')
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Unable to connect. Try again.')
      })
  }, [])

  useEffect(() => {
    if (isOwnAccount) void loadStatus()
  }, [isOwnAccount, loadStatus])

  useEffect(() => {
    if (codes) recoveryHeadingRef.current?.focus()
    else if (signedOut) continueRef.current?.focus()
    else if (setup) setupHeadingRef.current?.focus()
  }, [codes, signedOut, setup])

  const act = async (action: 'setup' | 'enable' | 'disable' | 'regenerate') => {
    if (!password) {
      setError('Enter your current password.')
      return
    }
    if (action !== 'setup' && !code) {
      setError('Enter an authenticator code or an unused recovery code.')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/users/two-factor', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, password, code }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message ?? 'Unable to update account security.')
      if (action === 'setup') {
        setSetup(body)
        setCode('')
      } else {
        setSetup(null)
        setPassword('')
        setCode('')
        setCodes(body.recoveryCodes ?? null)
        setSignedOut(true)
        setStatus({
          enabled: body.enabled,
          recoveryCodesRemaining: body.recoveryCodes?.length ?? 0,
        })
        setMessage(
          action === 'disable'
            ? 'Two-factor authentication is off. Sign in again to continue.'
            : 'Your security settings have been saved. Save your recovery codes, then sign in again.',
        )
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to connect. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const downloadCodes = () => {
    const blob = new Blob(
      [
        `SNMIH CMS recovery codes\n${user?.email ?? ''}\n\n${codes!.join('\n')}\n\nEach code can be used once. Store this file securely.\n`,
      ],
      { type: 'text/plain' },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'snmih-cms-recovery-codes.txt'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  if (!isOwnAccount) return null
  return (
    <section
      className="two-factor two-factor--settings"
      aria-labelledby={`${inputID}-heading`}
      aria-busy={busy}
      onKeyDown={(event) => {
        // This UI field lives inside Payload's document form. Security inputs must
        // never submit that surrounding form when the user presses Enter.
        if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
          event.preventDefault()
          if (!busy && status && !status.enabled) void act(setup ? 'enable' : 'setup')
        }
      }}
    >
      <h2 id={`${inputID}-heading`}>Two-factor authentication</h2>
      <p className="two-factor__help">
        Add an authenticator code to your password when signing in. This is optional for your
        account.
      </p>
      {!status && !error && <p role="status">Loading account security…</p>}
      {status && (
        <p>
          <strong>{status.enabled ? 'Enabled' : 'Not enabled'}</strong>
          {status.enabled && !signedOut
            ? ` · ${status.recoveryCodesRemaining} recovery codes remaining`
            : ''}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {error && (
        <p role="alert" className="two-factor__error">
          {error}
        </p>
      )}
      {!status && error && (
        <button type="button" className="two-factor__button" onClick={loadStatus}>
          Try again
        </button>
      )}
      {codes && (
        <div className="two-factor__recovery">
          <h3 ref={recoveryHeadingRef} tabIndex={-1}>
            Save your recovery codes
          </h3>
          <p>
            These codes are shown only once. Each replaces one authenticator code if you lose access
            to your app. Keep them somewhere safe, separate from your password.
          </p>
          <ul>
            {codes.map((value) => (
              <li key={value}>
                <code>{value}</code>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="two-factor__button two-factor__button--secondary"
            onClick={downloadCodes}
          >
            Download recovery codes
          </button>
        </div>
      )}
      {signedOut ? (
        // A full navigation discards Payload's authenticated client context after revocation.
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <a ref={continueRef} className="two-factor__continue" href="/admin/login">
          {codes ? 'I’ve saved my codes — sign in' : 'Sign in again'}
        </a>
      ) : (
        status && (
          <div className="two-factor__fields">
            <label htmlFor={`${inputID}-password`}>Current password</label>
            <input
              ref={passwordRef}
              id={`${inputID}-password`}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={busy}
            />
            {setup && (
              <div className="two-factor__setup">
                <h3 ref={setupHeadingRef} tabIndex={-1}>
                  Connect your authenticator app
                </h3>
                <p>
                  Scan this QR code with your authenticator app, then enter its six-digit code
                  below. Setup expires after ten minutes.
                </p>
                <div className="two-factor__qr">
                  <QRCodeSVG
                    value={setup.uri}
                    size={192}
                    marginSize={4}
                    title="Scan to set up your SNMIH CMS authenticator"
                  />
                </div>
                <details>
                  <summary>Can’t scan the code?</summary>
                  <p>Enter this setup key in your app:</p>
                  <code className="two-factor__secret">{setup.secret}</code>
                </details>
              </div>
            )}
            {(status.enabled || setup) && (
              <>
                <label htmlFor={`${inputID}-code`}>
                  {setup ? 'Authenticator code' : 'Authenticator or recovery code'}
                </label>
                <input
                  id={`${inputID}-code`}
                  autoComplete="one-time-code"
                  inputMode={setup ? 'numeric' : 'text'}
                  maxLength={80}
                  spellCheck={false}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  disabled={busy}
                />
                <p className="two-factor__help">
                  Use a fresh code. A code you just used to sign in cannot be used again.
                </p>
              </>
            )}
            <div className="two-factor__actions">
              {!status.enabled && !setup && (
                <button
                  type="button"
                  className="two-factor__button"
                  disabled={busy}
                  onClick={() => act('setup')}
                >
                  {busy ? 'Please wait…' : 'Set up two-factor authentication'}
                </button>
              )}
              {setup && (
                <>
                  <button
                    type="button"
                    className="two-factor__button"
                    disabled={busy}
                    onClick={() => act('enable')}
                  >
                    {busy ? 'Please wait…' : 'Verify and enable'}
                  </button>
                  <button
                    type="button"
                    className="two-factor__button two-factor__button--secondary"
                    disabled={busy}
                    onClick={() => {
                      setSetup(null)
                      setCode('')
                      setPassword('')
                      setError('')
                      passwordRef.current?.focus()
                    }}
                  >
                    Cancel setup
                  </button>
                </>
              )}
              {status.enabled && (
                <>
                  <button
                    type="button"
                    className="two-factor__button two-factor__button--secondary"
                    disabled={busy}
                    onClick={() => act('regenerate')}
                  >
                    Replace recovery codes
                  </button>
                  <button
                    type="button"
                    className="two-factor__button two-factor__button--secondary"
                    disabled={busy}
                    onClick={() => act('disable')}
                  >
                    Turn off two-factor authentication
                  </button>
                </>
              )}
            </div>
            <p className="two-factor__help">
              Enabling, disabling, or replacing recovery codes signs you out on all devices.
              Replacing codes invalidates your previous recovery codes.
            </p>
          </div>
        )
      )}
    </section>
  )
}
