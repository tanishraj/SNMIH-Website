import { APIError, type Endpoint, type PayloadRequest } from 'payload'

import { recordOperationalAuditEvent } from '@/lib/operationalAudit'
import {
  confirmTwoFactorPassword,
  readTwoFactor,
  requireTwoFactorUpdate,
  reserveTwoFactorAttempt,
} from '@/lib/twoFactor'
import {
  createAuthenticator,
  createRecoveryCodes,
  createTwoFactorSecret,
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
  hashRecoveryCode,
  matchTwoFactorStep,
} from '@/lib/twoFactorCrypto'

const json = (body: object, status = 200) =>
  Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
  })

const audit = async (req: PayloadRequest, action: string) => {
  try {
    await recordOperationalAuditEvent({
      req,
      action,
      entityType: 'user',
      entityId: String(req.user!.id),
      entityTitle: `User #${req.user!.id}`,
      summary: `Account two-factor authentication: ${action}.`,
    })
  } catch {
    // A successfully enabled account must still receive its one-time recovery codes.
    req.payload.logger.error('Unable to record a two-factor settings audit event.')
  }
}

export const twoFactorStatusEndpoint: Endpoint = {
  path: '/two-factor',
  method: 'get',
  handler: async (req) => {
    if (!req.user || req.user.collection !== 'users')
      return json({ message: 'Sign in to manage your account.' }, 401)
    const record = await readTwoFactor(req.payload, String(req.user.id))
    return json({
      enabled: record?.state.enabled ?? false,
      recoveryCodesRemaining: record?.state.recoveryHashes?.length ?? 0,
    })
  },
}

export const twoFactorSettingsEndpoint: Endpoint = {
  path: '/two-factor',
  method: 'post',
  handler: async (req) => {
    if (!req.user || req.user.collection !== 'users')
      return json({ message: 'Sign in to manage your account.' }, 401)
    // Require a same-origin JSON request for cookie-authenticated security mutations.
    if (
      !req.url ||
      req.headers.get('origin') !== new URL(req.url).origin ||
      !req.headers.get('content-type')?.startsWith('application/json')
    ) {
      return json({ message: 'This security request must come from the CMS.' }, 403)
    }
    let body: Record<string, unknown>
    try {
      const value = await req.json!()
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error()
      body = value
    } catch {
      return json({ message: 'Enter valid security settings.' }, 400)
    }
    const { action } = body
    if (!['setup', 'enable', 'disable', 'regenerate'].includes(String(action)))
      return json({ message: 'Unknown security action.' }, 400)
    const password = typeof body.password === 'string' ? body.password : ''
    const code = typeof body.code === 'string' ? body.code.trim() : ''
    if (!password || password.length > 1024 || code.length > 80)
      return json({ message: 'Enter your current password and a valid code.' }, 400)

    const userID = String(req.user.id)
    try {
      await reserveTwoFactorAttempt(req.payload, userID)
      const record = await confirmTwoFactorPassword(req.payload, req.user.email!, password, code)
      if (record.userID !== userID)
        return json({ message: 'Your account changed. Sign in again.' }, 401)
      const { state } = record

      if (action === 'setup') {
        if (state.enabled)
          return json({ message: 'Two-factor authentication is already enabled.' }, 409)
        const secret = createTwoFactorSecret()
        await requireTwoFactorUpdate(req.payload, record, {
          ...state,
          pendingSecret: encryptTwoFactorSecret(secret, req.payload.secret, userID),
          pendingExpiresAt: Date.now() + 600_000,
        })
        return json({ secret, uri: createAuthenticator(secret, req.user.email!).toString() })
      }

      if (action === 'enable') {
        if (state.enabled || !state.pendingSecret || (state.pendingExpiresAt ?? 0) <= Date.now()) {
          return json({ message: 'Setup expired or changed. Start setup again.' }, 409)
        }
        const secret = decryptTwoFactorSecret(state.pendingSecret, req.payload.secret, userID)
        const step = matchTwoFactorStep(secret, code)
        if (step === null)
          return json(
            { message: 'The authenticator code is incorrect. Try the current six-digit code.' },
            400,
          )
        const recoveryCodes = createRecoveryCodes()
        await requireTwoFactorUpdate(req.payload, record, {
          enabled: true,
          secret: state.pendingSecret,
          recoveryHashes: recoveryCodes.map(hashRecoveryCode),
          lastStep: step,
          sessionsValidAfter: Date.now(),
          attempts: state.attempts,
          windowUntil: state.windowUntil,
        })
        await audit(req, 'two_factor_enabled')
        return json({ enabled: true, recoveryCodes, signedOut: true })
      }

      if (!state.enabled) return json({ message: 'Two-factor authentication is not enabled.' }, 409)
      const recoveryCodes = action === 'regenerate' ? createRecoveryCodes() : undefined
      await requireTwoFactorUpdate(
        req.payload,
        record,
        action === 'disable'
          ? {
              enabled: false,
              sessionsValidAfter: Date.now(),
              attempts: state.attempts,
              windowUntil: state.windowUntil,
            }
          : {
              ...state,
              recoveryHashes: recoveryCodes!.map(hashRecoveryCode),
              sessionsValidAfter: Date.now(),
            },
      )
      await audit(
        req,
        action === 'disable' ? 'two_factor_disabled' : 'two_factor_recovery_regenerated',
      )
      return json({ enabled: action !== 'disable', recoveryCodes, signedOut: true })
    } catch (error) {
      if (error instanceof APIError) return json({ message: error.message }, error.status)
      req.payload.logger.error('Unable to complete an account two-factor request.')
      return json({ message: 'Unable to update security settings. Please try again.' }, 500)
    }
  },
}
