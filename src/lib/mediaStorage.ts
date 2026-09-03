import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { Payload, PayloadRequest } from 'payload'

import type { RuntimeConfig } from '@/config/runtime'
import { getRuntimeConfig } from '@/config/runtime'
import { recordOperationalAuditEvent } from '@/lib/operationalAudit'

export type MediaStorageStatus = 'unchecked' | 'healthy' | 'missing' | 'check_failed' | 'local_only'

export type MediaStorageDoc = {
  filename?: string | null
  id?: number | string
  isCriticalAsset?: boolean | null
  storageCheckedAt?: string | null
  storageIssue?: string | null
  storageMissingSince?: string | null
  storageStatus?: MediaStorageStatus | null
  title?: string | null
  url?: string | null
}

type ReconcileMediaStorageArgs = {
  media?: MediaStorageDoc[]
  payload: Payload
  req?: PayloadRequest
}

type ReconcileMediaStorageResult = {
  checkFailed: number
  healthy: number
  localOnly: number
  missing: number
  scanned: number
  updated: number
}

const buildS3Client = (config: Extract<RuntimeConfig['media'], { provider: 's3' }>) =>
  new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    region: config.region,
  })

const getRequestLike = ({
  payload,
  req,
}: {
  payload: Payload
  req?: PayloadRequest
}): PayloadRequest =>
  req ??
  ({
    context: {},
    payload,
    user: null,
  } as PayloadRequest)

const getMediaTitle = (media: MediaStorageDoc): string =>
  media.title?.trim() || media.filename?.trim() || `Media ${media.id ?? 'asset'}`

export const getMediaStorageObjectKey = ({
  bucket,
  media,
}: {
  bucket: string
  media: Pick<MediaStorageDoc, 'filename' | 'url'>
}): string | null => {
  const filename = media.filename?.trim()

  if (filename) {
    return filename
  }

  const rawURL = media.url?.trim()

  if (!rawURL) {
    return null
  }

  try {
    const parsed = new URL(rawURL, 'https://placeholder.invalid')
    const segments = parsed.pathname.split('/').filter(Boolean)

    if (segments.length === 0) {
      return null
    }

    if (segments[0] === bucket && segments.length > 1) {
      return segments.slice(1).join('/')
    }

    return segments.join('/')
  } catch {
    return null
  }
}

const isNotFoundStorageError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as {
    $metadata?: { httpStatusCode?: number }
    Code?: string
    code?: string
    name?: string
  }

  return (
    candidate.$metadata?.httpStatusCode === 404 ||
    candidate.code === 'NotFound' ||
    candidate.code === 'NoSuchKey' ||
    candidate.Code === 'NoSuchKey' ||
    candidate.name === 'NotFound'
  )
}

const getStorageErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return 'Storage verification failed.'
}

export const reconcileMediaStorage = async ({
  media,
  payload,
  req,
}: ReconcileMediaStorageArgs): Promise<ReconcileMediaStorageResult> => {
  const runtimeConfig = getRuntimeConfig()
  const requestLike = getRequestLike({
    payload,
    req,
  })
  const result: ReconcileMediaStorageResult = {
    checkFailed: 0,
    healthy: 0,
    localOnly: 0,
    missing: 0,
    scanned: 0,
    updated: 0,
  }

  if (runtimeConfig.media.provider === 'localDisk') {
    const docs =
      media ??
      (
        await payload.find({
          collection: 'media',
          depth: 0,
          limit: 1000,
          overrideAccess: true,
          req: requestLike,
        })
      ).docs

    for (const doc of docs as MediaStorageDoc[]) {
      result.scanned += 1
      result.localOnly += 1

      if (
        doc.id == null ||
        (doc.storageStatus === 'local_only' &&
          !doc.storageIssue &&
          doc.storageCheckedAt &&
          !doc.storageMissingSince)
      ) {
        continue
      }

      await payload.update({
        collection: 'media',
        id: doc.id,
        data: {
          storageCheckedAt: new Date().toISOString(),
          storageIssue: null,
          storageMissingSince: null,
          storageStatus: 'local_only',
        },
        overrideAccess: true,
        req: requestLike,
      })

      result.updated += 1
    }

    return result
  }

  const mediaDocs =
    media ??
    (
      await payload.find({
        collection: 'media',
        depth: 0,
        limit: 1000,
        overrideAccess: true,
        req: requestLike,
      })
    ).docs
  const client = buildS3Client(runtimeConfig.media)

  for (const doc of mediaDocs as MediaStorageDoc[]) {
    if (doc.id == null) {
      continue
    }

    result.scanned += 1
    const objectKey = getMediaStorageObjectKey({
      bucket: runtimeConfig.media.bucket,
      media: doc,
    })

    if (!objectKey) {
      result.checkFailed += 1

      if (
        doc.storageStatus === 'check_failed' &&
        doc.storageIssue?.includes('storage object key')
      ) {
        continue
      }

      await payload.update({
        collection: 'media',
        id: doc.id,
        data: {
          storageCheckedAt: new Date().toISOString(),
          storageIssue: 'Could not derive the storage object key from the media record.',
          storageStatus: 'check_failed',
        },
        overrideAccess: true,
        req: requestLike,
      })

      result.updated += 1
      continue
    }

    let nextStatus: MediaStorageStatus = 'healthy'
    let nextIssue: string | null = null
    let missingSince: string | null = null

    try {
      await client.send(
        new HeadObjectCommand({
          Bucket: runtimeConfig.media.bucket,
          Key: objectKey,
        }),
      )
    } catch (error) {
      if (isNotFoundStorageError(error)) {
        nextStatus = 'missing'
        nextIssue = `The expected object "${objectKey}" was not found in bucket "${runtimeConfig.media.bucket}".`
        missingSince = doc.storageMissingSince ?? new Date().toISOString()
      } else {
        nextStatus = 'check_failed'
        nextIssue = getStorageErrorMessage(error)
      }
    }

    if (nextStatus === 'healthy') {
      result.healthy += 1
    } else if (nextStatus === 'missing') {
      result.missing += 1
    } else {
      result.checkFailed += 1
    }

    const previousStatus = doc.storageStatus ?? 'unchecked'
    const nextCheckedAt = new Date().toISOString()
    const shouldUpdate =
      previousStatus !== nextStatus ||
      (doc.storageIssue ?? null) !== nextIssue ||
      (doc.storageMissingSince ?? null) !== missingSince ||
      !doc.storageCheckedAt

    if (!shouldUpdate) {
      continue
    }

    await payload.update({
      collection: 'media',
      id: doc.id,
      data: {
        storageCheckedAt: nextCheckedAt,
        storageIssue: nextIssue,
        storageMissingSince: missingSince,
        storageStatus: nextStatus,
      },
      overrideAccess: true,
      req: requestLike,
    })

    result.updated += 1
    const title = getMediaTitle(doc)

    if (previousStatus !== 'missing' && nextStatus === 'missing') {
      await recordOperationalAuditEvent({
        action: 'media_storage_missing',
        entityId: String(doc.id),
        entityTitle: title,
        entityType: 'media',
        feature: 'media',
        req: requestLike,
        summary: `${title} is missing from object storage. The expected object key "${objectKey}" was not found.`,
      })
    }

    if (previousStatus === 'missing' && nextStatus === 'healthy') {
      await recordOperationalAuditEvent({
        action: 'media_storage_restored',
        entityId: String(doc.id),
        entityTitle: title,
        entityType: 'media',
        feature: 'media',
        req: requestLike,
        summary: `${title} is available in object storage again.`,
      })
    }
  }

  return result
}
