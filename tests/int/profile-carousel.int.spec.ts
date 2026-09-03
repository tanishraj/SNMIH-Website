import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ProfileCarouselBlockComponent } from '@/blocks/ProfileCarousel/Component'
import { ProfileCarouselBlock } from '@/blocks/ProfileCarousel/config'
import { renderPageBlocks } from '@/blocks/renderPageBlocks'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { Pages } from '@/collections/Pages'
import { ProfileCarousel, type ProfileCarouselProfile } from '@/components/profile-carousel'
import { ProfileCarouselCollection } from '@/components/profile-carousel-collection'

type TestField = {
  admin?: { condition?: (data: unknown, siblingData?: Record<string, unknown>) => boolean }
  defaultValue?: unknown
  fields?: TestField[]
  label?: string
  maxRows?: number
  minRows?: number
  name?: string
  options?: Array<{ value: string }>
  relationTo?: string
  required?: boolean
  type?: string
}

type TestTab = {
  fields: TestField[]
  label: string
}

const getField = (fields: TestField[], name: string) => fields.find((field) => field.name === name)

const profiles: ProfileCarouselProfile[] = [
  {
    department: 'Academic Affairs',
    image: { alt: 'Alex Morgan portrait', src: '/media/alex.jpg' },
    name: 'Alex Morgan',
    role: 'Program Director',
  },
  {
    image: { alt: 'Jordan Lee portrait', src: '/media/jordan.jpg' },
    imagePosition: 'top',
    name: 'Jordan Lee',
    role: 'Student Experience Lead',
  },
  {
    image: { alt: 'Sam Rivera portrait', src: '/media/sam.jpg' },
    imagePosition: 'bottom',
    name: 'Sam Rivera',
    role: 'Faculty Advisor',
  },
  {
    image: { alt: 'Taylor Chen portrait', src: '/media/taylor.jpg' },
    imagePosition: 'left',
    name: 'Taylor Chen',
    role: 'Research Coordinator',
  },
  {
    image: { alt: 'Jamie Patel portrait', src: '/media/jamie.jpg' },
    imagePosition: 'right',
    name: 'Jamie Patel',
    role: 'Community Partner',
  },
]

describe('Profile Carousel', () => {
  it('defines the canonical schema and preserves the shared two-action default', () => {
    expect(ProfileCarouselBlock.slug).toBe('profileCarousel')
    expect(ProfileCarouselBlock.interfaceName).toBe('ProfileCarouselBlock')
    expect(ProfileCarouselBlock.labels).toEqual({
      plural: 'Profile Carousels',
      singular: 'Profile Carousel',
    })

    const tabsField = ProfileCarouselBlock.fields[0] as unknown as {
      tabs: TestTab[]
      type: string
    }
    const contentTab = tabsField.tabs.find(({ label }) => label === 'Content')
    const layoutTab = tabsField.tabs.find(({ label }) => label === 'Theme Settings')
    const actionsField = getField(contentTab?.fields ?? [], 'actions')
    const profilesField = getField(contentTab?.fields ?? [], 'profiles')
    const profileCardTabs = profilesField?.fields?.[0] as unknown as
      { tabs: TestTab[]; type: string } | undefined
    const profileContentTab = profileCardTabs?.tabs?.find(({ label }) => label === 'Content')
    const profileThemeTab = profileCardTabs?.tabs?.find(({ label }) => label === 'Theme Settings')
    const imageField = getField(profileContentTab?.fields ?? [], 'image')
    const nameField = getField(profileContentTab?.fields ?? [], 'name')
    const roleField = getField(profileContentTab?.fields ?? [], 'role')
    const departmentField = getField(profileContentTab?.fields ?? [], 'department')
    const imagePositionField = getField(profileThemeTab?.fields ?? [], 'imagePosition')
    const appearanceField = getField(layoutTab?.fields ?? [], 'appearance')
    const actionsTabsField = actionsField?.fields?.[0] as unknown as
      { tabs: TestTab[]; type: string } | undefined
    const actionsThemeTab = actionsTabsField?.tabs?.find(({ label }) => label === 'Theme Settings')
    const actionModeField = getField(actionsThemeTab?.fields ?? [], 'mode')
    const contentAlignmentField = getField(layoutTab?.fields ?? [], 'contentAlignment')
    const sizeField = getField(layoutTab?.fields ?? [], 'size')
    const cardVariantField = getField(layoutTab?.fields ?? [], 'cardVariant')
    const overlayAlignmentField = getField(layoutTab?.fields ?? [], 'overlayAlignment')
    const themeModeField = getField(layoutTab?.fields ?? [], 'themeMode')
    const overlayStyleField = getField(layoutTab?.fields ?? [], 'overlayStyle')
    const overlayDirectionField = getField(layoutTab?.fields ?? [], 'overlayDirection')
    const overlayCoverageField = getField(layoutTab?.fields ?? [], 'overlayCoverage')

    expect(tabsField.type).toBe('tabs')
    expect(tabsField.tabs.map(({ label }) => label)).toEqual(['Content', 'Theme Settings'])
    expect(getField(contentTab?.fields ?? [], 'eyebrow')?.type).toBe('text')
    expect(getField(contentTab?.fields ?? [], 'title')?.type).toBe('text')
    expect(actionsField?.maxRows).toBe(1)
    expect(createContentActionsField().maxRows).toBe(2)
    expect(profilesField).toMatchObject({ maxRows: 12, minRows: 1, type: 'array' })
    expect(imageField).toMatchObject({ relationTo: 'media', required: true, type: 'upload' })
    expect(nameField).toMatchObject({ required: true, type: 'text' })
    expect(roleField?.type).toBe('text')
    expect(departmentField).toMatchObject({ label: 'Department', type: 'text' })
    expect(departmentField?.required).not.toBe(true)

    const profileContentNames = (profileContentTab?.fields ?? []).flatMap(({ name }) =>
      name ? [name] : [],
    )
    expect(profileContentNames.indexOf('department')).toBe(profileContentNames.indexOf('role') + 1)
    expect(imagePositionField).toMatchObject({
      defaultValue: 'center',
      required: true,
      type: 'select',
    })
    expect(imagePositionField?.options?.map(({ value }) => value)).toEqual([
      'center',
      'top',
      'bottom',
      'left',
      'right',
    ])
    expect(appearanceField?.type).toBe('group')
    expect(actionModeField).toMatchObject({
      defaultValue: 'link',
      label: 'Display As',
      required: false,
      type: 'select',
    })
    expect(contentAlignmentField?.defaultValue).toBe('center')
    expect(sizeField?.defaultValue).toBe('default')
    expect(sizeField?.options?.map(({ value }) => value)).toEqual([
      'none',
      'compact',
      'default',
      'comfortable',
    ])
    expect(cardVariantField?.defaultValue).toBe('stacked')
    expect(cardVariantField?.options?.map(({ value }) => value)).toEqual(['stacked', 'overlay'])
    expect(overlayAlignmentField?.defaultValue).toBe('left')
    expect(overlayAlignmentField?.options?.map(({ value }) => value)).toEqual([
      'left',
      'center',
      'right',
    ])
    expect(themeModeField).toMatchObject({
      defaultValue: 'auto',
      options: [{ value: 'auto' }, { value: 'light' }, { value: 'dark' }, { value: 'brand' }],
      required: false,
      type: 'select',
    })
    expect(overlayStyleField).toMatchObject({
      defaultValue: 'dark',
      options: [{ value: 'light' }, { value: 'dark' }, { value: 'darker' }],
      required: false,
      type: 'select',
    })
    expect(overlayDirectionField).toMatchObject({
      defaultValue: 'bottomToTop',
      options: [
        { value: 'vertical' },
        { value: 'leftToRight' },
        { value: 'rightToLeft' },
        { value: 'bottomToTop' },
        { value: 'topToBottom' },
      ],
      required: false,
      type: 'select',
    })
    expect(overlayCoverageField).toMatchObject({
      defaultValue: 'full',
      options: [{ value: 'full' }, { value: 'split' }],
      required: false,
      type: 'select',
    })

    const layoutNames = (layoutTab?.fields ?? []).flatMap(({ name }) => (name ? [name] : []))
    expect(layoutNames.indexOf('overlayCoverage')).toBe(layoutNames.indexOf('overlayDirection') + 1)

    for (const field of [
      overlayAlignmentField,
      themeModeField,
      overlayStyleField,
      overlayDirectionField,
      overlayCoverageField,
    ]) {
      expect(field?.admin?.condition?.({}, { cardVariant: 'overlay' })).toBe(true)
      expect(field?.admin?.condition?.({}, { cardVariant: 'stacked' })).toBe(false)
    }
  })

  it('renders one through four profiles as a fixed responsive grid without controls', () => {
    const html = renderToStaticMarkup(
      ProfileCarousel({
        actions: 'Meet our team',
        alignment: 'left',
        appearance: { background: 'subtle', border: 'topAndBottom' },
        description: 'The people supporting every part of the experience.',
        eyebrow: 'Our people',
        profiles: profiles.slice(0, 3),
        size: 'compact',
        title: 'People behind the work',
      }),
    )

    expect(html).toContain('data-profile-carousel="true"')
    expect(html).toContain('data-profile-carousel-mode="static"')
    expect(html).toContain('data-profile-carousel-size="compact"')
    expect(html).toContain('py-8 md:py-10')
    expect(html).toContain('grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4')
    expect(html).toContain(
      'text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl',
    )
    expect(html).toContain('text-base leading-7 text-balance text-current')
    expect(html).not.toContain('aria-label="Previous profile"')
    expect(html).not.toContain('aria-label="Next profile"')
    expect(html).toContain('Meet our team')
    expect(html).toContain('Our people')
    expect(html).toContain('Academic Affairs')
    expect(html.indexOf('Alex Morgan')).toBeLessThan(html.indexOf('Program Director'))
    expect(html.indexOf('Program Director')).toBeLessThan(html.indexOf('Academic Affairs'))
    expect(html).toContain(
      'font-mono text-xs font-semibold uppercase tracking-[0.24em] text-current',
    )
    expect(html).not.toMatch(/<h3[^>]*>Alex Morgan<\/h3>/)
    expect(html.match(/flex flex-col gap-0\.5/g)).toHaveLength(3)
    expect(html).toContain('data-profile-carousel-card-variant="stacked"')
    expect(html.match(/data-profile-carousel-media-frame="true"/g)).toHaveLength(3)
    expect(html).toContain('h-64 sm:h-72 md:h-80')
    expect(html).toContain('object-cover select-none')
    expect(html).toContain('object-[center_center]')
    expect(html).toContain('object-[center_top]')
  })

  it('activates the looping one/two/four carousel only at five profiles', () => {
    const html = renderToStaticMarkup(ProfileCarousel({ profiles, title: 'Meet the team' }))

    expect(html).toContain('data-profile-carousel-mode="carousel"')
    expect(html.match(/md:basis-1\/2 lg:basis-1\/4/g)).toHaveLength(5)
    expect(html).toContain('-ml-5')
    expect(html.match(/pl-5 md:basis-1\/2 lg:basis-1\/4/g)).toHaveLength(5)
    expect(html).toContain('touch-pan-y touch-pinch-zoom')
    expect(html.match(/draggable="false"/g)).toHaveLength(5)
    expect(html.match(/object-cover select-none/g)).toHaveLength(5)
    expect(html).toContain('aria-label="Previous profile"')
    expect(html).toContain('aria-label="Next profile"')
    expect(html).toContain('data-carousel-loop="true"')
    expect(html).toContain('h-72 sm:h-80 md:h-96')
    expect(html).toContain('relative w-full pt-14')
    expect(html).not.toContain('data-profile-carousel-header="inline"')
  })

  it('shares the card collection without creating a nested section', () => {
    const staticHtml = renderToStaticMarkup(
      ProfileCarouselCollection({
        cardVariant: 'stacked',
        overlayAlignment: 'left',
        overlayCoverage: 'full',
        overlayDirection: 'bottomToTop',
        overlayStyle: 'dark',
        profiles: profiles.slice(0, 4),
        sectionBackground: 'subtle',
        size: 'default',
        themeMode: 'auto',
      }),
    )
    const carouselHtml = renderToStaticMarkup(
      ProfileCarouselCollection({
        cardVariant: 'stacked',
        overlayAlignment: 'left',
        overlayCoverage: 'full',
        overlayDirection: 'bottomToTop',
        overlayStyle: 'dark',
        profiles,
        sectionBackground: 'subtle',
        size: 'default',
        themeMode: 'auto',
      }),
    )

    expect(staticHtml).toContain('grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4')
    expect(staticHtml).not.toContain('<section')
    expect(staticHtml).not.toContain('Previous profile')
    expect(carouselHtml).toContain('aria-label="Previous profile"')
    expect(carouselHtml).toContain('data-carousel-loop="true"')
    expect(carouselHtml).not.toContain('<section')
  })

  it('renders a configurable image overlay with one alignment for every profile', () => {
    const html = renderToStaticMarkup(
      ProfileCarousel({
        cardVariant: 'overlay',
        overlayAlignment: 'center',
        overlayCoverage: 'split',
        overlayDirection: 'rightToLeft',
        overlayStyle: 'darker',
        profiles: profiles.slice(0, 4),
        size: 'comfortable',
        themeMode: 'light',
        title: 'Our people',
      }),
    )

    expect(html.match(/<article[^>]*data-profile-carousel-card-variant="overlay"/g)).toHaveLength(4)
    expect(html.match(/data-profile-carousel-overlay-alignment="center"/g)).toHaveLength(4)
    expect(html.match(/data-profile-carousel-overlay-tone="light"/g)).toHaveLength(4)
    expect(html.match(/data-profile-carousel-overlay-strength="darker"/g)).toHaveLength(4)
    expect(html.match(/data-profile-carousel-overlay-direction="rightToLeft"/g)).toHaveLength(4)
    expect(html.match(/data-profile-carousel-overlay-coverage="split"/g)).toHaveLength(4)
    expect(html.match(/data-section-eyebrow-surface="lightOverlay"/g)).toHaveLength(1)
    expect(
      html.match(/absolute inset-y-0 right-0 w-1\/2 bg-linear-to-l[^\"]*from-white/g),
    ).toHaveLength(4)
    expect(html.match(/absolute inset-0 flex flex-col justify-end/g)).toHaveLength(4)
    expect(
      html.match(/pt-16 text-light-overlay-foreground items-center text-center/g),
    ).toHaveLength(4)
    expect(html.match(/items-center text-center/g)).toHaveLength(4)
    expect(html.match(/h-80 sm:h-96 md:h-\[28rem\]/g)).toHaveLength(4)
    expect(html).toContain('Academic Affairs')
    const departmentIndex = html.indexOf('data-profile-carousel-department="true"')
    const nameIndex = html.indexOf('Alex Morgan', departmentIndex)
    const roleIndex = html.indexOf('Program Director', nameIndex)

    expect(departmentIndex).toBeGreaterThan(-1)
    expect(departmentIndex).toBeLessThan(nameIndex)
    expect(nameIndex).toBeLessThan(roleIndex)
    expect(html).toContain('font-mono text-xs leading-5 font-semibold uppercase tracking-[0.16em]')
  })

  it('preserves each card surface overlay in Auto mode while applying its direction', () => {
    const html = renderToStaticMarkup(
      ProfileCarousel({
        cardVariant: 'overlay',
        overlayCoverage: 'split',
        overlayDirection: 'leftToRight',
        profiles: [{ ...profiles[0], cardBackground: 'secondary' }],
        themeMode: 'auto',
        title: 'Our people',
      }),
    )

    expect(html).toContain('data-profile-carousel-overlay-tone="auto"')
    expect(html).toContain('data-profile-carousel-overlay-direction="leftToRight"')
    expect(html).toContain('data-section-eyebrow-surface="darkOverlay"')
    expect(html).toContain('data-profile-carousel-overlay-coverage="split"')
    expect(html).toContain(
      'absolute inset-y-0 left-0 w-1/2 bg-linear-to-r from-secondary via-secondary/75 to-transparent text-secondary-foreground',
    )
  })

  it('varies Auto overlay strength without losing the card surface hue', () => {
    const html = renderToStaticMarkup(
      ProfileCarousel({
        cardVariant: 'overlay',
        overlayStyle: 'darker',
        profiles: [{ ...profiles[0], cardBackground: 'secondary' }],
        themeMode: 'auto',
        title: 'Our people',
      }),
    )

    expect(html).toContain('data-profile-carousel-overlay-tone="auto"')
    expect(html).toContain('data-profile-carousel-overlay-strength="darker"')
    expect(html).toContain(
      'from-secondary via-secondary/90 to-secondary/20 text-secondary-foreground',
    )
  })

  it('renders Auto Even as a flat card-surface tint rather than a directional gradient', () => {
    const html = renderToStaticMarkup(
      ProfileCarousel({
        cardVariant: 'overlay',
        overlayDirection: 'vertical',
        profiles: [{ ...profiles[0], cardBackground: 'secondary' }],
        themeMode: 'auto',
        title: 'Our people',
      }),
    )

    expect(html).toContain('data-profile-carousel-overlay-direction="vertical"')
    expect(html).toContain('absolute inset-0 bg-secondary/86 text-secondary-foreground')
    expect(html).not.toContain('bg-linear-to-b from-secondary')
  })

  it.each([
    ['compact', 'h-64 sm:h-72 md:h-80'],
    ['default', 'h-72 sm:h-80 md:h-96'],
    ['comfortable', 'h-80 sm:h-96 md:h-[28rem]'],
  ] as const)('applies the %s image height to every profile', (size, classes) => {
    const html = renderToStaticMarkup(
      ProfileCarousel({ profiles: profiles.slice(0, 4), size, title: 'Our team' }),
    )

    expect(html.split(classes)).toHaveLength(5)
  })

  it('resolves Payload media, alignment, appearance, and the one shared action', () => {
    const html = renderToStaticMarkup(
      ProfileCarouselBlockComponent({
        actions: [
          {
            label: 'Meet everyone',
            linkType: 'custom',
            mode: 'button',
            url: '/team',
            variant: 'outline',
          },
        ],
        appearance: { background: 'subtle', border: 'top' },
        cardVariant: 'overlay',
        contentAlignment: 'right',
        description: 'A multidisciplinary group working together.',
        eyebrow: 'Leadership',
        overlayAlignment: 'right',
        profiles: profiles.map((profile, index) => ({
          department: index === 0 ? '  Academic Affairs  ' : undefined,
          image: { alt: profile.image.alt, id: index + 1, url: profile.image.src },
          imagePosition: profile.imagePosition,
          name: profile.name,
          role: profile.role,
        })),
        size: 'comfortable',
        title: 'Our people',
      }),
    )

    expect(html).toContain('data-profile-carousel-alignment="right"')
    expect(html).toContain('data-profile-carousel-card-variant="overlay"')
    expect(html).toContain('data-profile-carousel-overlay-alignment="right"')
    expect(html).toContain('Leadership')
    expect(html).toContain('bg-subtle')
    expect(html).toContain('data-action-mode="button"')
    expect(html).toContain('data-action-variant="outline"')
    expect(html).toContain('href="/team"')
    expect(html).toContain('%2Fmedia%2Falex.jpg')
    expect(html).toContain('object-[right_center]')
    expect(html).toContain('Academic Affairs')
    expect(html).not.toContain('  Academic Affairs  ')
  })

  it('renders optional department independently and omits blank metadata', () => {
    const html = renderToStaticMarkup(
      ProfileCarouselBlockComponent({
        profiles: [
          {
            department: '  Clinical Sciences  ',
            image: { alt: 'Dr Mira Shah', id: 1, url: '/mira.jpg' },
            name: 'Dr Mira Shah',
            role: 'Head of Department',
          },
          {
            department: '   ',
            image: { alt: 'Dr Arun Rao', id: 2, url: '/arun.jpg' },
            name: 'Dr Arun Rao',
          },
        ],
        title: 'Faculty',
      }),
    )
    const primaryHtml = renderToStaticMarkup(
      ProfileCarouselBlockComponent({
        profiles: [
          {
            cardBackground: 'primary',
            department: 'Anatomy',
            image: { alt: 'Dr Primary', id: 3, url: '/primary.jpg' },
            name: 'Dr Primary',
          },
        ],
        title: 'Faculty',
      }),
    )
    const nameIndex = html.indexOf('Dr Mira Shah')
    const roleIndex = html.indexOf('Head of Department', nameIndex)
    const departmentIndex = html.indexOf(
      'data-profile-carousel-stacked-department="true"',
      roleIndex,
    )

    expect(html).toContain('Clinical Sciences')
    expect(html).not.toContain('  Clinical Sciences  ')
    expect(nameIndex).toBeGreaterThan(-1)
    expect(roleIndex).toBeGreaterThan(nameIndex)
    expect(departmentIndex).toBeGreaterThan(roleIndex)
    expect(html).toContain('data-section-eyebrow-surface="none"')
    expect(html).toContain('font-mono text-xs leading-5 font-semibold uppercase tracking-[0.16em]')
    expect(html.match(/text-xs leading-5/g)).toHaveLength(1)
    expect(primaryHtml).toContain('data-section-eyebrow-surface="primary"')
  })

  it('omits malformed profiles and renders nothing without valid profiles', () => {
    const partialHtml = renderToStaticMarkup(
      ProfileCarouselBlockComponent({
        profiles: [
          { image: { alt: 'Valid profile', id: 1, url: '/valid.jpg' }, name: 'Valid Name' },
          { image: null, name: 'Missing image' },
          { image: { alt: 'Missing name', id: 2, url: '/missing-name.jpg' }, name: '  ' },
        ],
        title: 'Profiles',
      }),
    )

    expect(partialHtml).toContain('Valid Name')
    expect(partialHtml).not.toContain('Missing image')
    expect(partialHtml).not.toContain('/missing-name.jpg')

    expect(
      renderToStaticMarkup(ProfileCarouselBlockComponent({ profiles: [], title: 'Profiles' })),
    ).toBe('')
  })

  it('registers and renders through the page block pipeline', () => {
    const tabsField = Pages.fields.find((field) => field.type === 'tabs')
    const contentTab = tabsField?.type === 'tabs' ? tabsField.tabs[0] : undefined
    const layoutField = contentTab?.fields.find(
      (field) => 'name' in field && field.name === 'layout',
    )
    const registeredSlugs =
      layoutField?.type === 'blocks' ? layoutField.blocks.map(({ slug }) => slug) : []

    expect(registeredSlugs).toContain('profileCarousel')
    expect(registeredSlugs).not.toContain('gallery27')

    const html = renderToStaticMarkup(
      renderPageBlocks([
        {
          blockType: 'profileCarousel',
          profiles: [
            {
              image: { alt: 'Alex Morgan', id: 1, url: '/media/alex.jpg' },
              name: 'Alex Morgan',
              role: 'Program Director',
            },
          ],
          title: 'Meet the team',
        } as never,
      ]),
    )

    expect(html).toContain('data-profile-carousel="true"')
    expect(html).toContain('Meet the team')
  })
})
