import { describe, expect, it } from 'vitest'
import { Secret, TOTP } from 'otpauth'

import {
  createRecoveryCodes,
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
  hashRecoveryCode,
  matchTwoFactorStep,
} from '@/lib/twoFactorCrypto'

describe('two-factor cryptography', () => {
  it('matches the RFC 6238 SHA-1 vector with six-digit truncation and a bounded clock window', () => {
    const secret = Secret.fromUTF8('12345678901234567890').base32
    expect(matchTwoFactorStep(secret, '287082', 59_000)).toBe(1)
    expect(matchTwoFactorStep(secret, '287082', 89_000)).toBe(1)
    expect(matchTwoFactorStep(secret, '287082', 120_000)).toBeNull()
    expect(matchTwoFactorStep(secret, ' 287082', 59_000)).toBeNull()
    expect(matchTwoFactorStep(secret, '1287082', 59_000)).toBeNull()
  })

  it('encrypts with a random nonce and binds ciphertext to the account and deployment secret', () => {
    const encrypted = encryptTwoFactorSecret('private-seed', 'deployment-secret', 'user-one')
    expect(encrypted).not.toContain('private-seed')
    expect(encrypted).not.toBe(
      encryptTwoFactorSecret('private-seed', 'deployment-secret', 'user-one'),
    )
    expect(decryptTwoFactorSecret(encrypted, 'deployment-secret', 'user-one')).toBe('private-seed')
    expect(() => decryptTwoFactorSecret(encrypted, 'deployment-secret', 'user-two')).toThrow()
    expect(() => decryptTwoFactorSecret(encrypted, 'another-secret', 'user-one')).toThrow()
    const parts = encrypted.split('.')
    parts[3] = Buffer.from('tampered').toString('base64url')
    expect(() => decryptTwoFactorSecret(parts.join('.'), 'deployment-secret', 'user-one')).toThrow()
  })

  it('generates ten distinct 128-bit recovery codes and normalizes their formatting', () => {
    const codes = createRecoveryCodes()
    expect(new Set(codes).size).toBe(10)
    for (const code of codes) {
      expect(code).toMatch(/^[a-f0-9]{8}(-[a-f0-9]{8}){3}$/)
      expect(hashRecoveryCode(code)).toBe(hashRecoveryCode(code.toUpperCase().replaceAll('-', ' ')))
      expect(hashRecoveryCode(code)).not.toContain(code)
    }
    expect(new TOTP().secret.base32).toBeTruthy()
  })
})
