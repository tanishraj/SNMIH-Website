import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { resendAdapter } from '@payloadcms/email-resend'
import { s3Storage } from '@payloadcms/storage-s3'
import type { Plugin } from 'payload'

import { buildMediaPublicURL } from './mediaPublicURL'
import type { RuntimeConfig } from './runtime'

export const createDatabaseAdapter = (config: RuntimeConfig) => {
  return mongooseAdapter({
    ...(config.database.name
      ? {
          connectOptions: {
            dbName: config.database.name,
          },
        }
      : {}),
    url: config.database.url,
  })
}

export const createEmailAdapter = (config: RuntimeConfig) => {
  if (config.email.provider !== 'resend' || !config.email.apiKey || !config.email.fromAddress) {
    return undefined
  }

  return resendAdapter({
    apiKey: config.email.apiKey,
    defaultFromAddress: config.email.fromAddress,
    defaultFromName: config.email.fromName,
    overrideRecipientAddress: process.env.RESEND_OVERRIDE_TO_EMAIL || undefined,
  })
}

export const createStoragePlugins = (config: RuntimeConfig): Plugin[] => {
  if (config.media.provider !== 's3') {
    return []
  }

  const publicURL = config.media.publicURL
  const storageOptions: Parameters<typeof s3Storage>[0] = {
    bucket: config.media.bucket,
    clientUploads: config.media.clientUploads,
    collections: {
      media: publicURL
        ? {
            disablePayloadAccessControl: true,
            generateFileURL: ({ filename, prefix }) =>
              buildMediaPublicURL({
                filename,
                prefix,
                publicURL,
              }),
          }
        : true,
    },
    config: {
      credentials: {
        accessKeyId: config.media.accessKeyId,
        secretAccessKey: config.media.secretAccessKey,
      },
      endpoint: config.media.endpoint,
      forcePathStyle: config.media.forcePathStyle,
      region: config.media.region,
    },
  }

  if (config.media.acl) {
    storageOptions.acl = config.media.acl
  }

  return [s3Storage(storageOptions)]
}
