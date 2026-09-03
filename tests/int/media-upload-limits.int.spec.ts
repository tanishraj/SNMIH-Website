import { describe, expect, it } from 'vitest'

import { nextConfig } from '../../next.config'
import {
  MAX_MEDIA_UPLOAD_BYTES,
  payloadUploadConfig,
  SERVER_ACTION_BODY_SIZE_LIMIT,
} from '@/config/uploadLimits'

describe('media upload limits', () => {
  it('allows multipart overhead above the editor-facing file limit', () => {
    expect(SERVER_ACTION_BODY_SIZE_LIMIT).toBe('12mb')
    expect(nextConfig.experimental?.serverActions).toMatchObject({
      bodySizeLimit: SERVER_ACTION_BODY_SIZE_LIMIT,
    })
  })

  it('rejects Payload uploads above exactly 10 MiB', () => {
    expect(MAX_MEDIA_UPLOAD_BYTES).toBe(10 * 1024 * 1024)
    expect(payloadUploadConfig).toEqual({
      abortOnLimit: true,
      limits: { fileSize: MAX_MEDIA_UPLOAD_BYTES },
    })
  })
})
