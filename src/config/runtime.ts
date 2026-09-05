import { normalizeMediaPublicURL } from './mediaPublicURL'

export type RuntimeConfig = {
  database: {
    name: string | null
    url: string
  }
  deployment: {
    isProduction: boolean
    isVercel: boolean
  }
  email: {
    provider: 'resend' | 'none'
    apiKey: string | null
    fromAddress: string | null
    fromName: string
  }
  media:
    | {
        provider: 'localDisk'
      }
    | {
        provider: 's3'
        acl: 'private' | 'public-read' | null
        bucket: string
        clientUploads: boolean
        endpoint: string
        forcePathStyle: boolean
        publicURL: string | null
        region: string
        accessKeyId: string
        secretAccessKey: string
      }
  payload: {
    secret: string
  }
}

const isMongoConnectionString = (value: string): boolean =>
  value.startsWith('mongodb://') || value.startsWith('mongodb+srv://')

const MONGODB_SYSTEM_DATABASES = new Set(['admin', 'config', 'local'])

const parseDatabaseName = (value: string | undefined): string | null => {
  const databaseName = value?.trim() || ''

  if (!databaseName) return null

  if (databaseName.length > 63 || !/^[A-Za-z0-9_-]+$/.test(databaseName)) {
    throw new Error(
      'Invalid DATABASE_NAME. Use at most 63 letters, numbers, hyphens, or underscores.',
    )
  }

  if (MONGODB_SYSTEM_DATABASES.has(databaseName.toLowerCase())) {
    throw new Error('Invalid DATABASE_NAME. Do not use the admin, config, or local system database.')
  }

  return databaseName
}

const parseBooleanEnv = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value == null || value.trim() === '') {
    return defaultValue
  }

  const normalized = value.trim().toLowerCase()

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false
  }

  throw new Error(`Invalid boolean value "${value}". Use true/false.`)
}

const getMediaProvider = (env: NodeJS.ProcessEnv): 'localDisk' | 's3' => {
  if (!env.MEDIA_PROVIDER || env.MEDIA_PROVIDER === 'localDisk') {
    return 'localDisk'
  }

  if (env.MEDIA_PROVIDER === 's3') {
    return 's3'
  }

  throw new Error('Unsupported MEDIA_PROVIDER. Use "localDisk" or "s3".')
}

export const getRuntimeConfig = (env: NodeJS.ProcessEnv = process.env): RuntimeConfig => {
  const mediaProvider = getMediaProvider(env)
  const isProduction = env.NODE_ENV === 'production'
  const isVercel = Boolean(env.VERCEL)
  const databaseName = parseDatabaseName(env.DATABASE_NAME)
  const mongodbURI = env.MONGODB_URI?.trim() || ''
  const payloadSecret = env.PAYLOAD_SECRET?.trim() || ''

  if (!payloadSecret) {
    throw new Error('Missing PAYLOAD_SECRET. Set a unique secret for this environment.')
  }

  const placeholderSecrets = new Set([
    'YOUR_PAYLOAD_CMS_SECRET_HERE',
    'change-me',
    'changeme',
  ])

  if (isProduction && (payloadSecret.length < 32 || placeholderSecrets.has(payloadSecret))) {
    throw new Error(
      'Invalid production PAYLOAD_SECRET. Use at least 32 non-placeholder characters.',
    )
  }

  if (!mongodbURI) {
    throw new Error('Missing MongoDB MONGODB_URI. Set MONGODB_URI to a MongoDB connection string.')
  }

  if (!isMongoConnectionString(mongodbURI)) {
    throw new Error(
      'Invalid MongoDB MONGODB_URI. Use a connection string starting with "mongodb://" or "mongodb+srv://".',
    )
  }

  const emailProvider =
    env.EMAIL_PROVIDER === 'none'
      ? 'none'
      : env.EMAIL_PROVIDER === 'resend' || (env.RESEND_API_KEY && env.RESEND_FROM_EMAIL)
        ? 'resend'
        : 'none'

  if (emailProvider === 'resend' && (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL)) {
    throw new Error(
      'Incomplete Resend configuration. Set RESEND_API_KEY and RESEND_FROM_EMAIL or use EMAIL_PROVIDER=none.',
    )
  }

  const media =
    mediaProvider === 's3'
      ? (() => {
          const bucket = env.S3_BUCKET?.trim() || ''
          const endpoint = env.S3_ENDPOINT?.trim() || ''
          const region = env.S3_REGION?.trim() || ''
          const accessKeyId = env.S3_ACCESS_KEY_ID?.trim() || ''
          const secretAccessKey = env.S3_SECRET_ACCESS_KEY?.trim() || ''
          const rawACL = env.S3_ACL?.trim() || 'none'

          if (!bucket || !endpoint || !region || !accessKeyId || !secretAccessKey) {
            throw new Error(
              'Incomplete S3 media configuration. Set S3_BUCKET, S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.',
            )
          }

          let acl: 'private' | 'public-read' | null

          if (rawACL === 'none') {
            acl = null
          } else if (rawACL === 'public-read' || rawACL === 'private') {
            acl = rawACL
          } else {
            throw new Error('Unsupported S3_ACL. Use "none", "public-read", or "private".')
          }

          return {
            provider: 's3' as const,
            acl,
            accessKeyId,
            bucket,
            clientUploads: parseBooleanEnv(env.S3_CLIENT_UPLOADS, false),
            endpoint,
            forcePathStyle: parseBooleanEnv(env.S3_FORCE_PATH_STYLE, true),
            publicURL: normalizeMediaPublicURL(env.S3_PUBLIC_URL),
            region,
            secretAccessKey,
          }
        })()
      : {
          provider: 'localDisk' as const,
        }

  return {
    database: {
      name: databaseName,
      url: mongodbURI,
    },
    deployment: {
      isProduction,
      isVercel,
    },
    email: {
      provider: emailProvider,
      apiKey: env.RESEND_API_KEY || null,
      fromAddress: env.RESEND_FROM_EMAIL || null,
      fromName: env.RESEND_FROM_NAME || 'Website',
    },
    media,
    payload: {
      secret: payloadSecret,
    },
  }
}
