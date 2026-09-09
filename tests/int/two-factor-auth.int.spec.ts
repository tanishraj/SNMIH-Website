// @vitest-environment node
import { createLocalReq, getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { twoFactorSettingsEndpoint, twoFactorStatusEndpoint } from '@/endpoints/twoFactor'
import {
  readTwoFactor,
  reserveTwoFactorAttempt,
  requireTwoFactorUpdate,
  verifyTwoFactorCode,
} from '@/lib/twoFactor'
import { createAuthenticator, decryptTwoFactorSecret } from '@/lib/twoFactorCrypto'
import { createTestMongoServer } from '../helpers/mongoMemoryServer'

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
}))

let payload: Payload
let stopMongo: (() => Promise<void>) | undefined
let sequence = 0
const password = 'Account-test-password-123!'
const requestURL = 'http://localhost:3011/api/users/two-factor'

const account = async (role: 'admin' | 'siteManager' = 'admin') =>
  payload.create({
    collection: 'users',
    data: { email: `two-factor-${++sequence}@example.test`, password, role },
    overrideAccess: true,
  })
const login = (email: string, code = '') =>
  payload.login({
    collection: 'users',
    data: { email, password },
    req: { headers: new Headers({ 'x-two-factor-code': code }) },
  })
const settings = async (user: object | null, body: object, origin = 'http://localhost:3011') => {
  const req = await createLocalReq(
    {
      user: user as Awaited<ReturnType<typeof account>>,
      req: {
        url: requestURL,
        headers: new Headers({ origin, 'content-type': 'application/json' }),
        json: async () => body,
      },
    },
    payload,
  )
  return twoFactorSettingsEndpoint.handler(req)
}
const enroll = async (user: Awaited<ReturnType<typeof account>>) => {
  const setupResponse = await settings(user, { action: 'setup', password })
  expect(setupResponse.status).toBe(200)
  const setup = await setupResponse.json()
  const enabled = await settings(user, {
    action: 'enable',
    password,
    code: createAuthenticator(setup.secret).generate(),
  })
  expect(enabled.status).toBe(200)
  return {
    secret: setup.secret as string,
    ...((await enabled.json()) as { recoveryCodes: string[] }),
  }
}

describe('optional two-factor authentication with real Payload and MongoDB', () => {
  beforeAll(async () => {
    const mongo = await createTestMongoServer()
    stopMongo = mongo.stop
    process.env.MONGODB_URI = mongo.uri
    delete process.env.DATABASE_NAME
    process.env.EMAIL_PROVIDER = 'none'
    process.env.MEDIA_PROVIDER = 'localDisk'
    process.env.PAYLOAD_SECRET = 'isolated-two-factor-test-secret-32-characters'
    const { default: config } = await import('@/payload.config')
    payload = await getPayload({ config })
    await Promise.all(Object.values(payload.db.collections).map((model) => model.init()))
    await account()
  }, 120_000)

  afterAll(async () => {
    await payload?.destroy()
    await stopMongo?.()
  }, 30_000)

  it('preserves password-only login for accounts that do not opt in', async () => {
    const user = await account('siteManager')
    expect((await login(user.email)).token).toBeTruthy()
    expect(await readTwoFactor(payload, user.id)).toBeNull()
  })

  it('requires a password for enrollment, protects internal credentials, and rejects cross-origin changes', async () => {
    const user = await account()
    expect((await settings(null, { action: 'setup', password })).status).toBe(401)
    expect(
      (await settings(user, { action: 'setup', password }, 'https://elsewhere.test')).status,
    ).toBe(403)
    expect((await settings(user, { action: 'setup', password: 'wrong' })).status).toBe(401)
    const setup = await settings(user, { action: 'setup', password })
    expect(setup.status).toBe(200)
    const state = await readTwoFactor(payload, user.id)
    const body = await setup.json()
    expect(state!.state.pendingSecret).not.toContain(body.secret)
    expect(decryptTwoFactorSecret(state!.state.pendingSecret!, payload.secret, user.id)).toBe(
      body.secret,
    )
    for (const actingUser of [user, null]) {
      await expect(
        payload.find({
          collection: 'two-factor-credentials',
          user: actingUser,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
      await expect(
        payload.update({
          collection: 'two-factor-credentials',
          id: state!.id,
          data: { state: { enabled: false } },
          user: actingUser,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    }
    expect(await payload.findByID({ collection: 'users', id: user.id })).not.toHaveProperty(
      'twoFactorSettings',
    )
  })

  it('requires a valid code, blocks replay, consumes recovery codes once, and invalidates old sessions', async () => {
    const user = await account('siteManager')
    const oldLogin = await login(user.email)
    const { secret, recoveryCodes } = await enroll(user)
    await expect(login(user.email)).rejects.toThrow('authenticator code')
    await expect(login(user.email, 'bad-code')).rejects.toThrow('Invalid or already used')
    await expect(login(user.email, createAuthenticator(secret).generate())).rejects.toThrow(
      'Invalid or already used',
    )
    expect(
      (await payload.auth({ headers: new Headers({ Authorization: `JWT ${oldLogin.token}` }) }))
        .user,
    ).toBeNull()
    const recovered = await login(user.email, recoveryCodes[0])
    expect(recovered.token).toBeTruthy()
    expect(
      (await payload.auth({ headers: new Headers({ Authorization: `JWT ${recovered.token}` }) }))
        .user?.id,
    ).toBe(user.id)
    await expect(login(user.email, recoveryCodes[0])).rejects.toThrow('Invalid or already used')
    expect((await readTwoFactor(payload, user.id))!.state.recoveryHashes).toHaveLength(9)
  })

  it('accepts a fresh TOTP and atomically rejects concurrent reuse of a recovery code', async () => {
    const user = await account()
    const { secret, recoveryCodes } = await enroll(user)
    // The allowed next timestep avoids waiting for a wall-clock boundary.
    const token = createAuthenticator(secret).generate({ timestamp: Date.now() + 30_000 })
    expect((await login(user.email, token)).token).toBeTruthy()
    const state = (await readTwoFactor(payload, user.id))!
    const results = await Promise.allSettled([
      verifyTwoFactorCode(payload, state, recoveryCodes[0]),
      verifyTwoFactorCode(payload, state, recoveryCodes[0]),
    ])
    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    expect((await readTwoFactor(payload, user.id))!.state.recoveryHashes).toHaveLength(9)
  })

  it('persists the attempt budget across failed login rollbacks', async () => {
    const user = await account()
    await enroll(user)
    const before = (await readTwoFactor(payload, user.id))!.state.attempts!
    await expect(login(user.email, '000000-invalid')).rejects.toThrow()
    expect((await readTwoFactor(payload, user.id))!.state.attempts).toBe(before + 1)
    for (let i = before + 1; i < 10; i++) await reserveTwoFactorAttempt(payload, user.id)
    await expect(login(user.email, '000000-invalid')).rejects.toThrow('Too many security attempts')
    const limited = (await readTwoFactor(payload, user.id))!
    await requireTwoFactorUpdate(payload, limited, {
      ...limited.state,
      windowUntil: Date.now() - 1,
    })
    expect((await reserveTwoFactorAttempt(payload, user.id)).state.attempts).toBe(1)
  })

  it('requires the second factor during password reset and preserves enrollment', async () => {
    const user = await account()
    const { recoveryCodes } = await enroll(user)
    const token = 'isolated-password-reset-token'
    await payload.db.updateOne({
      collection: 'users',
      id: user.id,
      data: {
        resetPasswordToken: token,
        resetPasswordExpiration: new Date(Date.now() + 60_000).toISOString(),
      },
    })
    await expect(
      payload.resetPassword({
        collection: 'users',
        data: { password: 'changed-password-123', token },
        overrideAccess: true,
      }),
    ).rejects.toThrow('authenticator code')
    const result = await payload.resetPassword({
      collection: 'users',
      data: { password: 'changed-password-123', token },
      overrideAccess: true,
      req: { headers: new Headers({ 'x-two-factor-code': recoveryCodes[0] }) },
    })
    expect(result.token).toBeTruthy()
    expect((await readTwoFactor(payload, user.id))!.state.enabled).toBe(true)
  })

  it('requires password and factor to replace codes or disable, and keeps the choice account-local', async () => {
    const user = await account('siteManager')
    const other = await account('siteManager')
    const { recoveryCodes } = await enroll(user)
    expect((await settings(user, { action: 'disable', password })).status).toBe(401)
    const replaced = await settings(user, {
      action: 'regenerate',
      password,
      code: recoveryCodes[0],
    })
    expect(replaced.status).toBe(200)
    const nextCodes = (await replaced.json()).recoveryCodes
    expect(nextCodes).toHaveLength(10)
    await expect(login(user.email, recoveryCodes[1])).rejects.toThrow()
    const off = await settings(user, { action: 'disable', password, code: nextCodes[0] })
    expect(off.status).toBe(200)
    expect((await readTwoFactor(payload, user.id))!.state.secret).toBeUndefined()
    expect((await login(user.email)).token).toBeTruthy()
    expect(await readTwoFactor(payload, other.id)).toBeNull()
  })

  it('expires incomplete enrollment and exposes only status through the account endpoint', async () => {
    const user = await account()
    const setup = await (await settings(user, { action: 'setup', password })).json()
    const record = (await readTwoFactor(payload, user.id))!
    await requireTwoFactorUpdate(payload, record, {
      ...record.state,
      pendingExpiresAt: Date.now() - 1,
    })
    expect(
      (
        await settings(user, {
          action: 'enable',
          password,
          code: createAuthenticator(setup.secret).generate(),
        })
      ).status,
    ).toBe(409)
    const response = await twoFactorStatusEndpoint.handler(await createLocalReq({ user }, payload))
    expect(await response.json()).toEqual({ enabled: false, recoveryCodesRemaining: 0 })
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
})
