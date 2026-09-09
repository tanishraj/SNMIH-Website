import {
  APIError,
  type CollectionAfterDeleteHook,
  type CollectionAfterReadHook,
  type CollectionBeforeLoginHook,
  type Payload,
} from 'payload'

import {
  decryptTwoFactorSecret,
  hashRecoveryCode,
  matchTwoFactorStep,
  normalizeRecoveryCode,
} from './twoFactorCrypto'

export type TwoFactorState = {
  enabled: boolean
  secret?: string
  pendingSecret?: string
  pendingExpiresAt?: number
  recoveryHashes?: string[]
  lastStep?: number
  attempts?: number
  windowUntil?: number
  sessionsValidAfter?: number
}
export type TwoFactorRecord = {
  id: string
  userID: string
  revision: number
  state: TwoFactorState
}

export const readTwoFactor = async (
  payload: Payload,
  userID: string,
): Promise<TwoFactorRecord | null> =>
  payload.db.findOne({
    collection: 'two-factor-credentials',
    where: { userID: { equals: userID } },
  }) as Promise<TwoFactorRecord | null>

export const ensureTwoFactor = async (
  payload: Payload,
  userID: string,
): Promise<TwoFactorRecord> => {
  const existing = await readTwoFactor(payload, userID)
  if (existing) return existing
  try {
    return (await payload.db.create({
      collection: 'two-factor-credentials',
      data: { userID, revision: 0, state: { enabled: false } },
    })) as TwoFactorRecord
  } catch (error) {
    const raced = await readTwoFactor(payload, userID)
    if (raced) return raced
    throw error
  }
}

// These compare-and-swap writes intentionally commit independently of the Users login
// transaction: rolling back a failed login must not roll back attempts or consumed codes.
// Keeping this state in a separate collection also avoids locking the session document.
export const updateTwoFactor = async (
  payload: Payload,
  record: TwoFactorRecord,
  state: TwoFactorState,
): Promise<TwoFactorRecord | null> =>
  payload.db.updateOne({
    collection: 'two-factor-credentials',
    where: { and: [{ id: { equals: record.id } }, { revision: { equals: record.revision } }] },
    data: { revision: record.revision + 1, state },
  }) as unknown as Promise<TwoFactorRecord | null>

const conflict = () => new APIError('Your security settings changed. Please try again.', 409)
export const requireTwoFactorUpdate = async (
  payload: Payload,
  record: TwoFactorRecord,
  state: TwoFactorState,
) => {
  const updated = await updateTwoFactor(payload, record, state)
  if (!updated) throw conflict()
  return updated
}

export const reserveTwoFactorAttempt = async (
  payload: Payload,
  userID: string,
): Promise<TwoFactorRecord> => {
  for (let retry = 0; retry < 8; retry++) {
    const record = await ensureTwoFactor(payload, userID)
    const now = Date.now()
    const activeWindow = (record.state.windowUntil ?? 0) > now
    const attempts = activeWindow ? (record.state.attempts ?? 0) : 0
    if (attempts >= 10)
      throw new APIError('Too many security attempts. Wait five minutes and try again.', 429)
    const updated = await updateTwoFactor(payload, record, {
      ...record.state,
      attempts: attempts + 1,
      windowUntil: activeWindow ? record.state.windowUntil : now + 300_000,
    })
    if (updated) return updated
  }
  throw conflict()
}

export const verifyTwoFactorCode = async (
  payload: Payload,
  record: TwoFactorRecord,
  code: string,
): Promise<TwoFactorRecord> => {
  const { state } = record
  if (!state.enabled || !state.secret)
    throw new APIError('Two-factor authentication is not enabled.', 400)
  const secret = decryptTwoFactorSecret(state.secret, payload.secret, record.userID)
  const step = matchTwoFactorStep(secret, code)
  let next: TwoFactorState | null = null
  if (step !== null && step > (state.lastStep ?? -1)) next = { ...state, lastStep: step }
  if (!next && /^[a-f0-9]{32}$/.test(normalizeRecoveryCode(code))) {
    const hash = hashRecoveryCode(code)
    if (state.recoveryHashes?.includes(hash)) {
      next = { ...state, recoveryHashes: state.recoveryHashes.filter((value) => value !== hash) }
    }
  }
  if (!next)
    throw new APIError(
      'Invalid or already used code. Use a new authenticator code or an unused recovery code.',
      401,
    )
  return requireTwoFactorUpdate(payload, record, next)
}

// An instance cannot be supplied through REST or GraphQL JSON. Throwing from beforeLogin
// verifies the password through Payload but rolls back its temporary session issuance.
export class TwoFactorReauthentication {
  record?: TwoFactorRecord
}
export class TwoFactorReauthenticated extends Error {}

export const enforceTwoFactorLogin: CollectionBeforeLoginHook = async ({ context, req, user }) => {
  const proof = context.twoFactorReauthentication
  const code =
    typeof req.data?.twoFactorCode === 'string'
      ? req.data.twoFactorCode.trim()
      : (req.headers.get('x-two-factor-code')?.trim() ?? '')
  let record = await readTwoFactor(req.payload, String(user.id))
  if (record?.state.enabled) {
    if (!code)
      throw new APIError('Enter your authenticator code or a recovery code to continue.', 401)
    if (!(proof instanceof TwoFactorReauthentication))
      record = await reserveTwoFactorAttempt(req.payload, String(user.id))
    record = await verifyTwoFactorCode(req.payload, record, code)
  }
  if (proof instanceof TwoFactorReauthentication) {
    proof.record = record ?? undefined
    throw new TwoFactorReauthenticated()
  }
  return user
}

export const confirmTwoFactorPassword = async (
  payload: Payload,
  email: string,
  password: string,
  code: string,
): Promise<TwoFactorRecord> => {
  const proof = new TwoFactorReauthentication()
  try {
    await payload.login({
      collection: 'users',
      data: { email, password },
      overrideAccess: false,
      context: { twoFactorReauthentication: proof },
      req: { headers: new Headers({ 'x-two-factor-code': code }) },
    })
  } catch (error) {
    if (error instanceof TwoFactorReauthenticated && proof.record) return proof.record
    throw error
  }
  throw new APIError('Unable to verify your password.', 401)
}

// JWTAuthentication reads users through this hook before matching its session ID.
// A cutoff also rejects a password-only login that was already in flight at enrollment.
export const filterTwoFactorSessions: CollectionAfterReadHook = async ({ doc, req }) => {
  if (!Array.isArray(doc.sessions) || !doc.sessions.length) return doc
  const record = await readTwoFactor(req.payload, String(doc.id))
  const cutoff = record?.state.sessionsValidAfter
  if (!cutoff) return doc
  return {
    ...doc,
    sessions: doc.sessions.filter(
      (session: { createdAt?: string | Date }) =>
        session.createdAt && new Date(session.createdAt).getTime() > cutoff,
    ),
  }
}

export const deleteTwoFactorCredentials: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await req.payload.db.deleteMany({
    collection: 'two-factor-credentials',
    where: { userID: { equals: String(doc.id) } },
    req,
  })
  return doc
}
