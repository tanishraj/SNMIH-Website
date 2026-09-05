import { afterEach, describe, expect, it } from 'vitest'

import { getRuntimeConfig } from '@/config/runtime'

const ORIGINAL_ENV = { ...process.env }

describe('runtime config', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('reads the mongodb database url for local runtime', () => {
    process.env = {
      ...ORIGINAL_ENV,
      DATABASE_NAME: 'payload-cms-starter-kit',
      MONGODB_URI: 'mongodb://127.0.0.1:27017',
      PAYLOAD_SECRET: 'test-secret',
      EMAIL_PROVIDER: 'none',
      MEDIA_PROVIDER: 'localDisk',
      VERCEL: '',
    }

    const config = getRuntimeConfig(process.env)

    expect(config.database).toEqual({
      name: 'payload-cms-starter-kit',
      url: 'mongodb://127.0.0.1:27017',
    })
    expect(config.deployment).toEqual({
      isProduction: false,
      isVercel: false,
    })
    expect(config.email.provider).toBe('none')
    expect(config.media).toEqual({
      provider: 'localDisk',
    })
  })

  it('accepts mongodb srv urls for hosted deployments', () => {
    process.env = {
      ...ORIGINAL_ENV,
      DATABASE_NAME: 'prod',
      MONGODB_URI: 'mongodb+srv://starter:secret@cluster.example.com',
      NODE_ENV: 'production',
      PAYLOAD_SECRET: '4f3a8db96b7240b4a6fbd84585f9bb21',
      VERCEL: '1',
    }

    const config = getRuntimeConfig(process.env)

    expect(config.database).toEqual({
      name: 'prod',
      url: 'mongodb+srv://starter:secret@cluster.example.com',
    })
    expect(config.deployment).toEqual({
      isProduction: true,
      isVercel: true,
    })
  })

  it('keeps URI database selection when DATABASE_NAME is omitted', () => {
    const config = getRuntimeConfig({
      ...ORIGINAL_ENV,
      DATABASE_NAME: '',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/legacy-database',
      PAYLOAD_SECRET: 'test-secret',
    })

    expect(config.database).toEqual({
      name: null,
      url: 'mongodb://127.0.0.1:27017/legacy-database',
    })
  })

  it('rejects unsafe MongoDB database names', () => {
    const baseEnv = {
      ...ORIGINAL_ENV,
      MONGODB_URI: 'mongodb://127.0.0.1:27017',
      PAYLOAD_SECRET: 'test-secret',
    }

    expect(() => getRuntimeConfig({ ...baseEnv, DATABASE_NAME: 'invalid/name' })).toThrow(
      'Invalid DATABASE_NAME. Use at most 63 letters, numbers, hyphens, or underscores.',
    )
    expect(() => getRuntimeConfig({ ...baseEnv, DATABASE_NAME: 'admin' })).toThrow(
      'Invalid DATABASE_NAME. Do not use the admin, config, or local system database.',
    )
  })

  it('reads s3-compatible media configuration for hosted uploads', () => {
    process.env = {
      ...ORIGINAL_ENV,
      MONGODB_URI: 'mongodb://127.0.0.1:27017/payload-cms-starter-kit',
      PAYLOAD_SECRET: 'test-secret',
      MEDIA_PROVIDER: 's3',
      S3_BUCKET: 'payload-media',
      S3_ENDPOINT: 'https://s3.ap-southeast-1.idrivee2.com',
      S3_REGION: 'ap-southeast-1',
      S3_ACCESS_KEY_ID: 'access-key',
      S3_ACL: 'public-read',
      S3_SECRET_ACCESS_KEY: 'secret-key',
      S3_CLIENT_UPLOADS: 'true',
      S3_FORCE_PATH_STYLE: 'true',
      S3_PUBLIC_URL: '',
    }

    const config = getRuntimeConfig(process.env)

    expect(config.media).toEqual({
      provider: 's3',
      acl: 'public-read',
      accessKeyId: 'access-key',
      bucket: 'payload-media',
      clientUploads: true,
      endpoint: 'https://s3.ap-southeast-1.idrivee2.com',
      forcePathStyle: true,
      publicURL: null,
      region: 'ap-southeast-1',
      secretAccessKey: 'secret-key',
    })
  })

  it('reads R2 public delivery configuration without sending an ACL', () => {
    process.env = {
      ...ORIGINAL_ENV,
      MONGODB_URI: 'mongodb://127.0.0.1:27017/payload-cms-starter-kit',
      PAYLOAD_SECRET: 'test-secret',
      MEDIA_PROVIDER: 's3',
      S3_BUCKET: 'snmih-media',
      S3_ENDPOINT: 'https://account-id.r2.cloudflarestorage.com',
      S3_REGION: 'auto',
      S3_ACCESS_KEY_ID: 'access-key',
      S3_SECRET_ACCESS_KEY: 'secret-key',
      S3_ACL: 'none',
      S3_CLIENT_UPLOADS: 'false',
      S3_FORCE_PATH_STYLE: 'true',
      S3_PUBLIC_URL: 'https://assets.snmih.tanish.im/',
    }

    const config = getRuntimeConfig(process.env)

    expect(config.media).toEqual({
      provider: 's3',
      acl: null,
      accessKeyId: 'access-key',
      bucket: 'snmih-media',
      clientUploads: false,
      endpoint: 'https://account-id.r2.cloudflarestorage.com',
      forcePathStyle: true,
      publicURL: 'https://assets.snmih.tanish.im',
      region: 'auto',
      secretAccessKey: 'secret-key',
    })
  })

  it('defaults a blank S3 ACL to omission', () => {
    const config = getRuntimeConfig({
      ...ORIGINAL_ENV,
      MONGODB_URI: 'mongodb://127.0.0.1:27017/payload-cms-starter-kit',
      PAYLOAD_SECRET: 'test-secret',
      MEDIA_PROVIDER: 's3',
      S3_BUCKET: 'snmih-media',
      S3_ENDPOINT: 'https://account-id.r2.cloudflarestorage.com',
      S3_REGION: 'auto',
      S3_ACCESS_KEY_ID: 'access-key',
      S3_SECRET_ACCESS_KEY: 'secret-key',
      S3_ACL: '',
      S3_PUBLIC_URL: '',
    })

    expect(config.media.provider).toBe('s3')
    if (config.media.provider === 's3') {
      expect(config.media.acl).toBeNull()
      expect(config.media.publicURL).toBeNull()
    }
  })

  it('rejects unsupported S3 ACL values', () => {
    expect(() =>
      getRuntimeConfig({
        ...ORIGINAL_ENV,
        MONGODB_URI: 'mongodb://127.0.0.1:27017/payload-cms-starter-kit',
        PAYLOAD_SECRET: 'test-secret',
        MEDIA_PROVIDER: 's3',
        S3_BUCKET: 'snmih-media',
        S3_ENDPOINT: 'https://account-id.r2.cloudflarestorage.com',
        S3_REGION: 'auto',
        S3_ACCESS_KEY_ID: 'access-key',
        S3_SECRET_ACCESS_KEY: 'secret-key',
        S3_ACL: 'authenticated-read',
      }),
    ).toThrow('Unsupported S3_ACL. Use "none", "public-read", or "private".')
  })

  it('rejects an invalid S3 public origin', () => {
    expect(() =>
      getRuntimeConfig({
        ...ORIGINAL_ENV,
        MONGODB_URI: 'mongodb://127.0.0.1:27017/payload-cms-starter-kit',
        PAYLOAD_SECRET: 'test-secret',
        MEDIA_PROVIDER: 's3',
        S3_BUCKET: 'snmih-media',
        S3_ENDPOINT: 'https://account-id.r2.cloudflarestorage.com',
        S3_REGION: 'auto',
        S3_ACCESS_KEY_ID: 'access-key',
        S3_SECRET_ACCESS_KEY: 'secret-key',
        S3_ACL: 'none',
        S3_PUBLIC_URL: 'http://assets.snmih.tanish.im/private',
      }),
    ).toThrow(
      'Invalid S3_PUBLIC_URL. Use an HTTPS origin without credentials, path, query, or fragment.',
    )
  })

  it('rejects a missing mongodb connection string', () => {
    process.env = {
      ...ORIGINAL_ENV,
      MONGODB_URI: '',
      PAYLOAD_SECRET: 'test-secret',
    }

    expect(() => getRuntimeConfig(process.env)).toThrow(
      'Missing MongoDB MONGODB_URI. Set MONGODB_URI to a MongoDB connection string.',
    )
  })

  it('does not accept DATABASE_URL as a legacy fallback', () => {
    process.env = {
      ...ORIGINAL_ENV,
      MONGODB_URI: '',
      PAYLOAD_SECRET: 'test-secret',
      DATABASE_URL: 'mongodb://127.0.0.1:27017/legacy-database',
      EMAIL_PROVIDER: 'none',
      MEDIA_PROVIDER: 'localDisk',
    }

    expect(() => getRuntimeConfig(process.env)).toThrow(
      'Missing MongoDB MONGODB_URI. Set MONGODB_URI to a MongoDB connection string.',
    )
  })

  it('rejects a non-mongodb connection string', () => {
    process.env = {
      ...ORIGINAL_ENV,
      MONGODB_URI: 'postgres://starter:secret@db.example.com:5432/payload',
      PAYLOAD_SECRET: 'test-secret',
    }

    expect(() => getRuntimeConfig(process.env)).toThrow(
      'Invalid MongoDB MONGODB_URI. Use a connection string starting with "mongodb://" or "mongodb+srv://".',
    )
  })

  it('rejects s3 mode without the required bucket configuration', () => {
    process.env = {
      ...ORIGINAL_ENV,
      MONGODB_URI: 'mongodb://127.0.0.1:27017/payload-cms-starter-kit',
      PAYLOAD_SECRET: 'test-secret',
      MEDIA_PROVIDER: 's3',
      S3_BUCKET: '',
      S3_ENDPOINT: '',
      S3_REGION: '',
      S3_ACCESS_KEY_ID: '',
      S3_SECRET_ACCESS_KEY: '',
    }

    expect(() => getRuntimeConfig(process.env)).toThrow(
      'Incomplete S3 media configuration. Set S3_BUCKET, S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.',
    )
  })

  it('rejects a missing Payload secret', () => {
    process.env = {
      ...ORIGINAL_ENV,
      MONGODB_URI: 'mongodb://127.0.0.1:27017/payload-cms-starter-kit',
      PAYLOAD_SECRET: '',
    }

    expect(() => getRuntimeConfig(process.env)).toThrow(
      'Missing PAYLOAD_SECRET. Set a unique secret for this environment.',
    )
  })

  it('rejects placeholder and weak Payload secrets in production', () => {
    const baseEnv: NodeJS.ProcessEnv = {
      ...ORIGINAL_ENV,
      MONGODB_URI: 'mongodb://127.0.0.1:27017/payload-cms-starter-kit',
      NODE_ENV: 'production',
    }

    for (const secret of ['YOUR_PAYLOAD_CMS_SECRET_HERE', 'change-me', 'too-short']) {
      expect(() => getRuntimeConfig({ ...baseEnv, PAYLOAD_SECRET: secret })).toThrow(
        'Invalid production PAYLOAD_SECRET. Use at least 32 non-placeholder characters.',
      )
    }
  })

  it('exposes a validated high-entropy Payload secret', () => {
    const secret = '4f3a8db96b7240b4a6fbd84585f9bb21'
    const config = getRuntimeConfig({
      ...ORIGINAL_ENV,
      MONGODB_URI: 'mongodb://127.0.0.1:27017/payload-cms-starter-kit',
      NODE_ENV: 'production',
      PAYLOAD_SECRET: secret,
    })

    expect(config.payload.secret).toBe(secret)
  })
})
