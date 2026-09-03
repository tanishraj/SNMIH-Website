import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { blockThumbnailDefinitions } from '@/block-thumbnails/definitions'
import {
  blockThumbnailAssetPaths,
  blockThumbnailFixtures,
  getBlockThumbnailFixture,
} from '@/block-thumbnails/fixtures'

describe('block thumbnail fixtures', () => {
  it('renders one production-component fixture for every definition', () => {
    expect(Object.keys(blockThumbnailFixtures)).not.toContain('programGrid')
    expect(Object.keys(blockThumbnailFixtures)).not.toContain('studyPathways')
    expect(Object.keys(blockThumbnailFixtures).sort()).toEqual(
      blockThumbnailDefinitions.map(({ slug }) => slug).sort(),
    )

    for (const definition of blockThumbnailDefinitions) {
      let html = ''

      try {
        html = renderToStaticMarkup(getBlockThumbnailFixture(definition.slug))
      } catch (error) {
        throw new Error(`Failed to render ${definition.slug} thumbnail fixture.`, {
          cause: error,
        })
      }

      expect(html.length).toBeGreaterThan(100)
      expect(html).not.toContain('Replace this file')
    }
  })

  it('uses the consolidated Academic Programmes capabilities in its fixture', () => {
    const html = renderToStaticMarkup(getBlockThumbnailFixture('academicProgrammes'))

    expect(html).toContain('data-academic-programmes-view="detailedCards"')
    expect(html).toContain('data-academic-programme-icon="graduation-cap"')
    expect(html).toContain('4.5 Years + 1 Year Internship')
    expect(html).toContain('Eligibility')
    expect(html).toContain('Fee')
    expect(html).toContain('Apply now')
  })

  it('renders the approved Leadership Profiles production composition', () => {
    const html = renderToStaticMarkup(getBlockThumbnailFixture('leadershipProfiles'))

    expect(html).toContain('data-leadership-profiles="true"')
    expect(html).toContain('Academic leadership')
    expect(html).toContain('Principal')
    expect(html).toContain('Medical Superintendent')
    expect(html).toContain('Dean, Academics')
    expect(html.match(/data-leadership-profile-card=/g)).toHaveLength(3)
    expect(html).not.toMatch(/<(a|button)\b/)
  })

  it('renders the Annual Calendar production composition', () => {
    const html = renderToStaticMarkup(getBlockThumbnailFixture('annualCalendar'))

    expect(html).toContain('data-annual-calendar-block="true"')
    expect(html.match(/data-annual-calendar-month="true"/g)).toHaveLength(12)
    expect(html).toContain('Academic calendar')
  })

  it('renders the Calendar PDF panel in its production fixture', () => {
    const html = renderToStaticMarkup(getBlockThumbnailFixture('calendar'))

    expect(html).toContain('data-calendar-block="true"')
    expect(html).toContain('data-calendar-pdf-download="true"')
    expect(html).toContain('Academic calendar PDF')
    expect(html).toContain('Download')
  })

  it('renders the Bank Details institutional payment panel fixture', () => {
    const html = renderToStaticMarkup(getBlockThumbnailFixture('bankDetails'))

    expect(html).toContain('data-bank-details="true"')
    expect(html).toContain('data-bank-details-context="true"')
    expect(html).toContain('data-panel-position="right"')
    expect(html).toContain('lg:grid-cols-[minmax(0,16fr)_minmax(0,9fr)]')
    expect(html).toContain('Demo account')
    expect(html).toContain('Preview account')
    expect(html).toContain('Example Medical Institute')
    expect(html).toContain('demo@invalid')
  })

  it('uses repository-local media assets only', () => {
    for (const assetPath of blockThumbnailAssetPaths) {
      expect(assetPath).toMatch(/^\/block-thumbnail-assets\//)
      expect(assetPath).not.toMatch(/^https?:\/\//)
    }
  })
})
