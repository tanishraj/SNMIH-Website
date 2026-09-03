import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-mongodb'
import { describe, expect, it, vi } from 'vitest'

import { SKIP_CACHE_REVALIDATION_CONTEXT } from '@/hooks/revalidateCmsContent'
import { migrations } from '@/migrations'
import { down, up } from '@/migrations/20260831_000000_provision_legal_pages'

const createArgs = () => {
  const req = { id: 'legal-pages-migration-request' }
  const session = { id: 'legal-pages-migration-session' }
  const find = vi.fn()
  const create = vi.fn()
  const findGlobal = vi.fn()
  const updateGlobals = vi.fn().mockResolvedValue({ acknowledged: true })
  const updateVersions = vi.fn().mockResolvedValue({ acknowledged: true })
  const payload = {
    create,
    db: {
      globals: { updateMany: updateGlobals },
      versions: {
        'site-settings': { updateMany: updateVersions },
      },
    },
    find,
    findGlobal,
  }
  const args = { payload, req, session } as unknown as MigrateUpArgs

  return {
    args,
    create,
    find,
    findGlobal,
    payload,
    req,
    session,
    updateGlobals,
    updateVersions,
  }
}

describe('SNMIH legal Pages migration', () => {
  it('registers after the theme migration', () => {
    expect(migrations.map((migration) => migration.name)).toEqual([
      '20260829_000000_rename_snmih_theme_values',
      '20260831_000000_provision_legal_pages',
      '20260831_010000_nest_department_profiles',
      '20260902_000000_two_role_feature_permissions',
    ])
  })

  it('creates and publishes missing legal Pages with minimal website-only content', async () => {
    const { args, create, find, findGlobal, req, session, updateGlobals, updateVersions } =
      createArgs()
    find.mockResolvedValue({ docs: [] })
    create
      .mockResolvedValueOnce({ id: 'privacy-page-id' })
      .mockResolvedValueOnce({ id: 'terms-page-id' })
    findGlobal
      .mockResolvedValueOnce({
        privacyPolicyPage: null,
        termsAndConditionsPage: null,
      })
      .mockResolvedValueOnce({
        privacyPolicyPage: null,
        termsAndConditionsPage: null,
      })

    await up(args)

    expect(find).toHaveBeenCalledTimes(2)
    expect(find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: 'pages',
        depth: 0,
        draft: true,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        req,
        where: { slug: { equals: 'privacy-policy' } },
      }),
    )
    expect(find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: 'pages',
        depth: 0,
        draft: true,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        req,
        where: { slug: { equals: 'terms-and-conditions' } },
      }),
    )
    expect(create).toHaveBeenCalledTimes(2)

    for (const [callIndex, slug, title] of [
      [1, 'privacy-policy', 'Privacy Policy'],
      [2, 'terms-and-conditions', 'Terms and Conditions'],
    ] as const) {
      expect(create).toHaveBeenNthCalledWith(
        callIndex,
        expect.objectContaining({
          collection: 'pages',
          context: {
            [SKIP_CACHE_REVALIDATION_CONTEXT]: true,
            systemProvisioning: 'legal-pages-migration',
          },
          data: expect.objectContaining({
            _status: 'published',
            layout: [
              expect.objectContaining({
                appearance: { background: 'none', border: 'none' },
                blockType: 'pageHeader',
                breadcrumbMode: 'automatic',
                subtitle: 'Effective 31 August 2026 · Last updated 31 August 2026',
                title,
                topContent: 'breadcrumb',
                variant: 'minimal',
              }),
              expect.objectContaining({
                appearance: { background: 'none', border: 'none' },
                blockType: 'richText',
                maxWidth: 'prose',
                size: 'compact',
              }),
            ],
            metaDescription: expect.any(String),
            publishedAt: expect.any(String),
            slug,
            title,
          }),
          depth: 0,
          draft: false,
          overrideAccess: true,
          req,
        }),
      )
    }

    const serializedCreates = JSON.stringify(create.mock.calls)
    expect(serializedCreates).toContain('admission@snmih.in')
    expect(serializedCreates).toContain('website only')
    expect(serializedCreates).toContain('clinical patient-record privacy notice')
    expect(serializedCreates).toContain('medical emergency')
    expect(serializedCreates).toContain('Admissions, eligibility, fees, seats')

    expect(findGlobal).toHaveBeenNthCalledWith(1, {
      depth: 0,
      draft: false,
      overrideAccess: true,
      req,
      slug: 'site-settings',
    })
    expect(findGlobal).toHaveBeenNthCalledWith(2, {
      depth: 0,
      draft: true,
      overrideAccess: true,
      req,
      slug: 'site-settings',
    })
    expect(updateGlobals).toHaveBeenCalledWith(
      { globalType: 'site-settings' },
      {
        $set: {
          privacyPolicyPage: 'privacy-page-id',
          termsAndConditionsPage: 'terms-page-id',
        },
      },
      { session },
    )
    expect(updateVersions).toHaveBeenCalledWith(
      { latest: true },
      {
        $set: {
          'version.privacyPolicyPage': 'privacy-page-id',
          'version.termsAndConditionsPage': 'terms-page-id',
        },
      },
      { session },
    )
  })

  it('reuses existing draft Pages and preserves existing legal relationships', async () => {
    const { args, create, find, findGlobal, updateGlobals, updateVersions } = createArgs()
    find
      .mockResolvedValueOnce({
        docs: [{ _status: 'draft', id: 'existing-privacy-page', slug: 'privacy-policy' }],
      })
      .mockResolvedValueOnce({
        docs: [{ _status: 'draft', id: 'existing-terms-page', slug: 'terms-and-conditions' }],
      })
    findGlobal
      .mockResolvedValueOnce({
        privacyPolicyPage: 'editor-selected-privacy-page',
        termsAndConditionsPage: 'editor-selected-terms-page',
      })
      .mockResolvedValueOnce({
        privacyPolicyPage: 'pending-privacy-page',
        termsAndConditionsPage: 'pending-terms-page',
      })

    await up(args)

    expect(create).not.toHaveBeenCalled()
    expect(updateGlobals).not.toHaveBeenCalled()
    expect(updateVersions).not.toHaveBeenCalled()
  })

  it('fills only fields empty in both published and pending Site Identity states', async () => {
    const { args, find, findGlobal, session, updateGlobals, updateVersions } = createArgs()
    find
      .mockResolvedValueOnce({ docs: [{ id: 'existing-privacy-page' }] })
      .mockResolvedValueOnce({ docs: [{ id: 'existing-terms-page' }] })
    findGlobal
      .mockResolvedValueOnce({
        privacyPolicyPage: null,
        termsAndConditionsPage: null,
      })
      .mockResolvedValueOnce({
        privacyPolicyPage: 'pending-privacy-page',
        termsAndConditionsPage: null,
      })

    await up(args)

    expect(updateGlobals).toHaveBeenCalledWith(
      { globalType: 'site-settings' },
      { $set: { termsAndConditionsPage: 'existing-terms-page' } },
      { session },
    )
    expect(updateVersions).toHaveBeenCalledWith(
      { latest: true },
      { $set: { 'version.termsAndConditionsPage': 'existing-terms-page' } },
      { session },
    )
  })

  it('keeps rollback non-destructive', async () => {
    const { args, payload } = createArgs()

    await down(args as unknown as MigrateDownArgs)

    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.find).not.toHaveBeenCalled()
    expect(payload.findGlobal).not.toHaveBeenCalled()
    expect(payload.db.globals.updateMany).not.toHaveBeenCalled()
    expect(payload.db.versions['site-settings'].updateMany).not.toHaveBeenCalled()
  })
})
