import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMediaStorageObjectKey, reconcileMediaStorage } from '@/lib/mediaStorage'

const sendMock = vi.fn()

vi.mock('@aws-sdk/client-s3', () => ({
  HeadObjectCommand: vi.fn(function HeadObjectCommand(input: unknown) {
    return {
      input,
    }
  }),
  S3Client: vi.fn(function S3Client() {
    return {
      send: sendMock,
    }
  }),
}))

describe('media storage helpers', () => {
  beforeEach(() => {
    sendMock.mockReset()
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/payload-cms-starter-kit'
    process.env.EMAIL_PROVIDER = 'none'
    process.env.MEDIA_PROVIDER = 's3'
    process.env.S3_BUCKET = 'snmih'
    process.env.S3_ENDPOINT = 'https://s3.ap-northeast-1.idrivee2.com'
    process.env.S3_REGION = 'ap-northeast-1'
    process.env.S3_ACCESS_KEY_ID = 'test-access-key'
    process.env.S3_SECRET_ACCESS_KEY = 'test-secret-key'
  })

  it('derives the object key from filename first', () => {
    expect(
      getMediaStorageObjectKey({
        bucket: 'snmih',
        media: {
          filename: 'uploads/banner.png',
          url: 'https://cdn.example.com/ignored.png',
        },
      }),
    ).toBe('uploads/banner.png')
  })

  it('derives the object key from a path-style bucket url', () => {
    expect(
      getMediaStorageObjectKey({
        bucket: 'snmih',
        media: {
          url: 'https://s3.ap-northeast-1.idrivee2.com/snmih/site/logo.png',
        },
      }),
    ).toBe('site/logo.png')
  })
})

describe('reconcileMediaStorage', () => {
  beforeEach(() => {
    sendMock.mockReset()
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/payload-cms-starter-kit'
    process.env.EMAIL_PROVIDER = 'none'
    process.env.MEDIA_PROVIDER = 's3'
    process.env.S3_BUCKET = 'snmih'
    process.env.S3_ENDPOINT = 'https://s3.ap-northeast-1.idrivee2.com'
    process.env.S3_REGION = 'ap-northeast-1'
    process.env.S3_ACCESS_KEY_ID = 'test-access-key'
    process.env.S3_SECRET_ACCESS_KEY = 'test-secret-key'
  })

  it('marks missing media, updates the document, and records an audit event', async () => {
    sendMock.mockRejectedValueOnce({
      $metadata: {
        httpStatusCode: 404,
      },
      name: 'NotFound',
    })

    const payload = {
      create: vi.fn(async () => ({})),
      update: vi.fn(async () => ({})),
    }

    const result = await reconcileMediaStorage({
      media: [
        {
          filename: 'hero.png',
          id: '1',
          storageStatus: 'healthy',
          title: 'Hero',
        },
      ],
      payload: payload as never,
    })

    expect(result).toMatchObject({
      missing: 1,
      scanned: 1,
      updated: 1,
    })
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'media',
        data: expect.objectContaining({
          storageIssue: 'The expected object "hero.png" was not found in bucket "snmih".',
          storageStatus: 'missing',
        }),
        id: '1',
      }),
    )
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'operational-audit-events',
        data: expect.objectContaining({
          action: 'media_storage_missing',
          entityId: '1',
          feature: 'media',
        }),
      }),
    )
  })

  it('records restoration when a previously missing object becomes available again', async () => {
    sendMock.mockResolvedValueOnce({})

    const payload = {
      create: vi.fn(async () => ({})),
      update: vi.fn(async () => ({})),
    }

    const result = await reconcileMediaStorage({
      media: [
        {
          filename: 'hero.png',
          id: '1',
          storageIssue: 'Previously missing.',
          storageMissingSince: '2026-07-10T00:00:00.000Z',
          storageStatus: 'missing',
          title: 'Hero',
        },
      ],
      payload: payload as never,
    })

    expect(result).toMatchObject({
      healthy: 1,
      scanned: 1,
      updated: 1,
    })
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'media',
        data: expect.objectContaining({
          storageIssue: null,
          storageMissingSince: null,
          storageStatus: 'healthy',
        }),
        id: '1',
      }),
    )
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'operational-audit-events',
        data: expect.objectContaining({
          action: 'media_storage_restored',
          entityId: '1',
        }),
      }),
    )
  })
})
