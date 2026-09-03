import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

import { getMediaRemotePattern } from './src/config/mediaPublicURL'
import { SERVER_ACTION_BODY_SIZE_LIMIT } from './src/config/uploadLimits'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
const mediaRemotePattern = getMediaRemotePattern(process.env.S3_PUBLIC_URL)

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

export const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: SERVER_ACTION_BODY_SIZE_LIMIT,
    },
  },
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  images: {
    minimumCacheTTL: 86400,
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    remotePatterns: mediaRemotePattern ? [mediaRemotePattern] : [],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
