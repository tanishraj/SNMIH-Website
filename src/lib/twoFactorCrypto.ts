import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto'
import { Secret, TOTP } from 'otpauth'

const key = (secret: string) =>
  Buffer.from(hkdfSync('sha256', secret, '', 'payload-two-factor-v1', 32))

export const encryptTwoFactorSecret = (value: string, secret: string, userID: string): string => {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(secret), iv)
  cipher.setAAD(Buffer.from(userID))
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return [
    'v1',
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.')
}

export const decryptTwoFactorSecret = (value: string, secret: string, userID: string): string => {
  const [version, iv, tag, encrypted] = value.split('.')
  if (version !== 'v1' || !iv || !tag || !encrypted) throw new Error('Invalid two-factor secret.')
  const decipher = createDecipheriv('aes-256-gcm', key(secret), Buffer.from(iv, 'base64url'))
  decipher.setAAD(Buffer.from(userID))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

export const createAuthenticator = (secret: string, email = '') =>
  new TOTP({
    issuer: 'SNMIH CMS',
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  })

export const createTwoFactorSecret = () => new Secret({ size: 20 }).base32

export const matchTwoFactorStep = (
  secret: string,
  code: string,
  now = Date.now(),
): number | null => {
  if (!/^\d{6}$/.test(code)) return null
  const delta = createAuthenticator(secret).validate({ token: code, timestamp: now, window: 1 })
  return delta === null ? null : Math.floor(now / 30_000) + delta
}

export const normalizeRecoveryCode = (value: string) => value.replace(/[\s-]/g, '').toLowerCase()
export const hashRecoveryCode = (value: string) =>
  createHash('sha256').update(normalizeRecoveryCode(value)).digest('hex')
export const createRecoveryCodes = () =>
  Array.from({ length: 10 }, () =>
    randomBytes(16)
      .toString('hex')
      .match(/.{1,8}/g)!
      .join('-'),
  )
