import type { CSSProperties, ReactNode } from 'react'

import { defaultWebsiteTheme } from '@/lib/themes/websiteThemes'

import '../../styles/globals.css'

export default function BlockThumbnailLayout({ children }: { children: ReactNode }) {
  return (
    <html
      className="light"
      data-color-scheme="light"
      data-theme-color={defaultWebsiteTheme}
      lang="en"
      style={{ colorScheme: 'light' } as CSSProperties}
    >
      <body className="m-0 overflow-hidden bg-background">{children}</body>
    </html>
  )
}
