import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const layoutSource = readFileSync('src/app/(frontend)/layout.tsx', 'utf8')
const pageDataSource = readFileSync('src/app/(frontend)/pageData.ts', 'utf8')

describe('cacheable public frontend shell', () => {
  it('does not opt the root layout into request-time cookies or CMS authentication', () => {
    expect(layoutSource).not.toContain("from 'next/headers'")
    expect(layoutSource).not.toContain("export const dynamic = 'force-dynamic'")
    expect(layoutSource).not.toContain('getCurrentCMSUser')
    expect(layoutSource).toContain('<DeferredAdminSessionBar />')
  })

  it('uses one client-controlled toolbar offset throughout the shell', () => {
    expect(layoutSource).toContain("const cmsToolbarOffset = 'var(--cms-toolbar-offset, 0px)'")
    expect(layoutSource).toContain("'--cms-toolbar-offset': '0px'")
    expect(layoutSource).toContain('paddingTop: cmsToolbarOffset')
    expect(layoutSource).toContain('stickyTopOffset={cmsToolbarOffset}')
  })

  it('does not authenticate public system-mode resolution', () => {
    expect(pageDataSource).not.toContain('isCurrentCMSAdmin')
    expect(pageDataSource).not.toContain('canCurrentRequestBypassSystemModes')
  })
})
