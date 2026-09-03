import {
  FORM_HONEYPOT_FIELD_NAME,
  FORM_RATE_LIMIT_MAX_SUBMISSIONS,
  FORM_RATE_LIMIT_WINDOW_MS,
  type FormSubmissionValues,
} from '@/lib/forms'

const submissionAttemptsByKey = new Map<string, number[]>()

const pruneExpiredAttempts = (timestamps: number[], now: number): number[] => {
  return timestamps.filter((timestamp) => now - timestamp < FORM_RATE_LIMIT_WINDOW_MS)
}

const getRateLimitKey = ({
  formSlug,
  ipAddress,
}: {
  formSlug: string
  ipAddress: string
}): string => {
  return `${ipAddress}:${formSlug}`
}

export const getClientIPAddress = (request: Request): string => {
  const forwardedFor = request.headers.get('x-forwarded-for')

  if (forwardedFor) {
    const firstForwardedIP = forwardedFor.split(',')[0]?.trim()

    if (firstForwardedIP) {
      return firstForwardedIP
    }
  }

  const realIP = request.headers.get('x-real-ip')?.trim()

  if (realIP) {
    return realIP
  }

  return 'unknown'
}

export const isSpamHoneypotTriggered = (values: FormSubmissionValues): boolean => {
  const honeypotValue = values[FORM_HONEYPOT_FIELD_NAME]

  return typeof honeypotValue === 'string' && honeypotValue.trim().length > 0
}

export const isRateLimited = ({
  formSlug,
  ipAddress,
}: {
  formSlug: string
  ipAddress: string
}): boolean => {
  const now = Date.now()
  const key = getRateLimitKey({
    formSlug,
    ipAddress,
  })
  const recentAttempts = pruneExpiredAttempts(submissionAttemptsByKey.get(key) ?? [], now)

  submissionAttemptsByKey.set(key, recentAttempts)

  return recentAttempts.length >= FORM_RATE_LIMIT_MAX_SUBMISSIONS
}

export const recordSubmissionAttempt = ({
  formSlug,
  ipAddress,
}: {
  formSlug: string
  ipAddress: string
}): void => {
  const now = Date.now()
  const key = getRateLimitKey({
    formSlug,
    ipAddress,
  })
  const recentAttempts = pruneExpiredAttempts(submissionAttemptsByKey.get(key) ?? [], now)

  recentAttempts.push(now)
  submissionAttemptsByKey.set(key, recentAttempts)
}
