import type { Config } from 'payload'

export const MAX_MEDIA_UPLOAD_BYTES = 10 * 1024 * 1024
export const SERVER_ACTION_BODY_SIZE_LIMIT = '12mb' as const

export const payloadUploadConfig = {
  abortOnLimit: true,
  limits: {
    fileSize: MAX_MEDIA_UPLOAD_BYTES,
  },
} satisfies NonNullable<Config['upload']>
