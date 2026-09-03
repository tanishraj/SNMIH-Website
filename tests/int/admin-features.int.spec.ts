import { describe, expect, it } from 'vitest'

import { ADMIN_FEATURES, ADMIN_FEATURE_KEYS, getFeatureForResource } from '@/access/adminFeatures'
import { hasDependencyRead, hasFeature, hideUnlessFeature, isAdmin } from '@/access/featureAccess'

describe('admin feature registry', () => {
  it('defines the complete 29-destination permission contract once', () => {
    expect(ADMIN_FEATURE_KEYS).toHaveLength(29)
    expect(new Set(ADMIN_FEATURE_KEYS).size).toBe(29)
    expect(Object.keys(ADMIN_FEATURES)).toEqual([...ADMIN_FEATURE_KEYS])

    for (const feature of Object.values(ADMIN_FEATURES)) {
      expect(feature.label).toBeTruthy()
      expect(feature.description).toBeTruthy()
      expect(feature.group).toBeTruthy()
      expect(feature.policyKind).toBeTruthy()
      expect(feature.resource.slug).toBeTruthy()
      expect(getFeatureForResource(feature.resource)).toBe(feature.key)
    }
  })

  it('gives admins implicit access and site managers explicit access only', () => {
    expect(isAdmin({ role: 'admin' })).toBe(true)
    expect(hasFeature({ role: 'admin' }, 'maintenanceModes')).toBe(true)
    expect(hasFeature({ role: 'siteManager', features: { pages: true } }, 'pages')).toBe(true)
    expect(hasFeature({ role: 'siteManager', features: { pages: true } }, 'articles')).toBe(false)
  })

  it('fails closed for missing, legacy, and malformed identities', () => {
    expect(hasFeature(null, 'pages')).toBe(false)
    expect(hasFeature({ role: 'contentManager', features: { pages: true } }, 'pages')).toBe(false)
    expect(hasFeature({ role: 'siteManager', features: ['pages'] }, 'pages')).toBe(false)
    expect(hasFeature({ role: 'siteManager', features: { pages: 'true' } }, 'pages')).toBe(false)
  })

  it('keeps dependency reads separate from destination visibility', () => {
    const pageManager = { role: 'siteManager', features: { pages: true } }

    expect(hasDependencyRead(pageManager, 'media')).toBe(true)
    expect(hasFeature(pageManager, 'media')).toBe(false)
    expect(hideUnlessFeature('media')({ user: pageManager })).toBe(true)
  })
})
