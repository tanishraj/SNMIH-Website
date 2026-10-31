// @vitest-environment jsdom
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Field, SelectField, Tab } from 'payload'
import { describe, expect, it } from 'vitest'

import { QaAccordionBlockComponent } from '@/blocks/QaAccordion/Component'
import { QaAccordionBlock } from '@/blocks/QaAccordion/config'
import { resolveQaAccordionLayout } from '@/blocks/QaAccordion/layoutContract'
import { regularBlockContainerClasses } from '@/blocks/shared/blockSpacing'

const createRichText = (text: string) => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text,
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
})

const getTabs = () => {
  const tabsField = QaAccordionBlock.fields[0]

  if (tabsField?.type !== 'tabs' || typeof tabsField.tabs === 'function') {
    throw new Error('Expected Q&A Accordion to use static tabs')
  }

  return tabsField.tabs as Tab[]
}

const getNamedField = (fields: Field[], name: string) => {
  const field = fields.find((candidate) => 'name' in candidate && candidate.name === name)

  if (!field || !('name' in field)) {
    throw new Error(`Expected Q&A Accordion field: ${name}`)
  }

  return field
}

const getAccordionTriggerClasses = (html: string) =>
  Array.from(html.matchAll(/<button[^>]*class="([^"]*)"/g), (match) => match[1])

const countOccurrences = (value: string, search: string) => value.split(search).length - 1

describe('Q&A Accordion layout compatibility', () => {
  it.each([
    ['fullWidth', 'stacked', 'balanced'],
    ['fiftyFifty', 'split', 'balanced'],
    ['oneThird', 'split', 'qaFocus'],
  ] as const)('normalizes legacy %s without rewriting content', (legacy, mode, proportion) => {
    const input = { layoutMode: legacy }

    expect(resolveQaAccordionLayout(input)).toEqual({
      layoutMode: mode,
      sectionVerticalAlignment: 'top',
      splitProportion: proportion,
    })
    expect(input).toEqual({ layoutMode: legacy })
  })

  it('defaults invalid values to Split, Balanced, and Top', () => {
    expect(resolveQaAccordionLayout({ layoutMode: 'invalid' })).toEqual({
      layoutMode: 'split',
      sectionVerticalAlignment: 'top',
      splitProportion: 'balanced',
    })
  })
})

describe('Q&A Accordion block', () => {
  it('exposes explicit stacked and split composition controls', () => {
    const tabs = getTabs()
    const contentTab = tabs.find((tab) => tab.label === 'Content')
    const themeTab = tabs.find((tab) => tab.label === 'Theme Settings')

    if (!contentTab || !themeTab) {
      throw new Error('Expected Q&A Accordion Content and Theme Settings tabs')
    }

    const layoutMode = getNamedField(themeTab.fields, 'layoutMode') as SelectField
    const splitProportion = getNamedField(themeTab.fields, 'splitProportion') as SelectField
    const placement = getNamedField(themeTab.fields, 'accordionPlacement') as SelectField
    const verticalAlignment = getNamedField(
      themeTab.fields,
      'sectionVerticalAlignment',
    ) as SelectField
    const supportingContent = getNamedField(contentTab.fields, 'sideColumn')
    const supportingActionsPosition = getNamedField(
      themeTab.fields,
      'supportingActionsPosition',
    ) as SelectField

    expect(layoutMode.defaultValue).toBe('split')
    expect(layoutMode.options).toEqual([
      { label: 'Stacked', value: 'stacked' },
      { label: 'Split', value: 'split' },
    ])
    expect(splitProportion.defaultValue).toBe('balanced')
    expect(splitProportion.options).toEqual([
      { label: 'Balanced (50 / 50)', value: 'balanced' },
      { label: 'Section Content Focus (60 / 40)', value: 'sectionFocus' },
      { label: 'Q&A Focus (40 / 60)', value: 'qaFocus' },
    ])
    expect(placement.label).toBe('Q&A Position')
    expect(placement.defaultValue).toBe('right')
    expect(placement.options).toEqual([
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
    ])
    expect(verticalAlignment.defaultValue).toBe('top')
    expect(verticalAlignment.options).toEqual([
      { label: 'Top', value: 'top' },
      { label: 'Center', value: 'center' },
      { label: 'Bottom', value: 'bottom' },
    ])
    expect('label' in supportingContent ? supportingContent.label : undefined).toBe(
      'Supporting Content',
    )
    expect(supportingActionsPosition.defaultValue).toBe('inline')
    expect(supportingActionsPosition.options).toEqual([
      { label: 'After Content', value: 'inline' },
      { label: 'Bottom of Column', value: 'bottom' },
    ])

    for (const field of [
      splitProportion,
      placement,
      verticalAlignment,
      supportingContent,
      supportingActionsPosition,
    ]) {
      const condition = 'admin' in field ? field.admin?.condition : undefined

      expect(condition?.({}, { layoutMode: 'split' }, {} as never)).toBe(true)
      expect(condition?.({}, { layoutMode: 'stacked' }, {} as never)).toBe(false)
      expect(condition?.({}, { layoutMode: 'fiftyFifty' }, {} as never)).toBe(true)
      expect(condition?.({}, { layoutMode: 'oneThird' }, {} as never)).toBe(true)
      expect(condition?.({}, { layoutMode: 'fullWidth' }, {} as never)).toBe(false)
    }
  })

  it('removes desktop top padding only from the first Split trigger', () => {
    const html = renderToStaticMarkup(
      createElement(QaAccordionBlockComponent, {
        items: [
          { answer: createRichText('First answer'), question: 'First question' },
          { answer: createRichText('Second answer'), question: 'Second question' },
        ],
        layoutMode: 'split',
        title: 'Frequently asked questions',
      }),
    )
    const [firstTrigger, secondTrigger] = getAccordionTriggerClasses(html)

    expect(firstTrigger).toContain('py-6')
    expect(firstTrigger).toContain('lg:pt-0')
    expect(firstTrigger).toContain('lg:pb-8')
    expect(firstTrigger).not.toContain('lg:py-8')
    expect(secondTrigger).toContain('py-6')
    expect(secondTrigger).toContain('lg:py-8')
    expect(secondTrigger).not.toContain('lg:pt-0')
  })

  it('retains symmetric first-trigger padding in Stacked mode', () => {
    const html = renderToStaticMarkup(
      createElement(QaAccordionBlockComponent, {
        items: [{ answer: createRichText('Answer'), question: 'Question' }],
        layoutMode: 'stacked',
        title: 'Frequently asked questions',
      }),
    )
    const [firstTrigger] = getAccordionTriggerClasses(html)

    expect(firstTrigger).toContain('py-6')
    expect(firstTrigger).toContain('lg:py-8')
    expect(firstTrigger).not.toContain('lg:pt-0')
    expect(firstTrigger).not.toContain('lg:pb-8')
  })

  it('anchors section actions to the bottom of the Split content column', () => {
    const html = renderToStaticMarkup(
      createElement(QaAccordionBlockComponent, {
        actions: [{ label: 'See All', linkType: 'custom', url: '/questions' }],
        description: 'Plan your visit.',
        items: [{ answer: createRichText('Answer'), question: 'Question' }],
        layoutMode: 'split',
        sectionVerticalAlignment: 'center',
        title: 'Library questions',
      }),
    )

    expect(html).toContain('data-qa-accordion-section-content="true"')
    expect(html).toContain('lg:h-full')
    expect(html).toContain('data-qa-accordion-content-group="true"')
    expect(html).toContain('lg:justify-center')
    expect(html).toContain('data-qa-accordion-section-actions="true"')
    expect(html).toContain('data-qa-accordion-bottom-actions="true"')
    expect(html).toContain('lg:mt-auto lg:pt-8')
    expect(countOccurrences(html, 'href="/questions"')).toBe(1)
    expect(html.indexOf('data-qa-accordion-content-group="true"')).toBeLessThan(
      html.indexOf('data-qa-accordion-section-actions="true"'),
    )
  })

  it('keeps section actions in the natural Stacked introduction flow', () => {
    const html = renderToStaticMarkup(
      createElement(QaAccordionBlockComponent, {
        actions: [{ label: 'See All', linkType: 'custom', url: '/questions' }],
        items: [{ answer: createRichText('Answer'), question: 'Question' }],
        layoutMode: 'stacked',
        title: 'Library questions',
      }),
    )
    const sectionTag = html.match(/<div class="([^"]*)" data-qa-accordion-section-content="true">/)

    expect(sectionTag?.[1]).not.toContain('lg:h-full')
    expect(html).not.toContain('data-qa-accordion-section-actions="true"')
    expect(countOccurrences(html, 'href="/questions"')).toBe(1)
  })

  it.each(['inline', 'bottom', undefined, null] as const)(
    'places supporting actions in %s flow without duplicating either action group',
    (supportingActionsPosition) => {
      const html = renderToStaticMarkup(
        createElement(QaAccordionBlockComponent, {
          actions: [{ label: 'All questions', linkType: 'custom', url: '/questions' }],
          items: [{ answer: createRichText('Answer'), question: 'Question' }],
          layoutMode: 'split',
          sideColumn: {
            contact: {
              title: 'Contact our team',
              actions: [
                { label: 'Email us', linkType: 'custom', url: 'mailto:library@example.com' },
                { label: 'Visit us', linkType: 'custom', mode: 'button', url: '/visit' },
              ],
            },
            profile: { name: 'Library team' },
          },
          supportingActionsPosition,
          title: 'Library questions',
        }),
      )
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const contactActions = doc.querySelector('[data-qa-accordion-contact-actions]')!
      const sectionActions = doc.querySelector('[data-qa-accordion-section-actions]')!

      expect(doc.querySelectorAll('[data-qa-accordion-contact-actions]')).toHaveLength(1)
      expect(contactActions.querySelectorAll('a')).toHaveLength(2)
      expect(sectionActions.closest('[data-qa-accordion-bottom-actions]')).not.toBeNull()
      expect(countOccurrences(html, 'href="/questions"')).toBe(1)
      if (supportingActionsPosition === 'bottom') {
        expect(contactActions.closest('[data-qa-accordion-bottom-actions]')).not.toBeNull()
        expect(contactActions.closest('aside')).toBeNull()
      } else {
        expect(contactActions.closest('aside')).not.toBeNull()
        expect(contactActions.closest('[data-qa-accordion-bottom-actions]')).toBeNull()
      }
      expect(html.indexOf('Library team')).toBeLessThan(html.indexOf('mailto:library@example.com'))
      expect(html.indexOf('mailto:library@example.com')).toBeLessThan(
        html.indexOf('href="/questions"'),
      )
    },
  )

  it.each(['stacked', 'fullWidth'] as const)(
    'ignores saved bottom supporting actions in %s layouts',
    (layoutMode) => {
      const html = renderToStaticMarkup(
        createElement(QaAccordionBlockComponent, {
          actions: [{ label: 'All questions', linkType: 'custom', url: '/questions' }],
          items: [{ answer: createRichText('Answer'), question: 'Question' }],
          layoutMode,
          sideColumn: {
            contact: {
              actions: [{ label: 'Contact', linkType: 'custom', url: '/contact' }],
            },
          },
          supportingActionsPosition: 'bottom',
        }),
      )
      const doc = new DOMParser().parseFromString(html, 'text/html')

      expect(doc.querySelector('h2')).toBeNull()
      expect(doc.querySelector('[data-qa-accordion-bottom-actions]')).toBeNull()
      expect(doc.querySelector('[data-qa-accordion-contact-actions]')).toBeNull()
      expect(doc.querySelector('[data-qa-accordion-intro] a')?.getAttribute('href')).toBe(
        '/questions',
      )
    },
  )

  it('renders a link-only contact prompt without empty supporting-copy wrappers', () => {
    const html = renderToStaticMarkup(
      createElement(QaAccordionBlockComponent, {
        items: [{ answer: createRichText('Answer'), question: 'Question' }],
        layoutMode: 'split',
        sideColumn: {
          contact: { actions: [{ label: 'Contact', linkType: 'custom', url: '/contact' }] },
        },
        title: 'Library questions',
      }),
    )
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const support = doc.querySelector('aside')!

    expect(support.children).toHaveLength(1)
    expect(support.firstElementChild?.hasAttribute('data-qa-accordion-contact-actions')).toBe(true)
    expect(doc.querySelector('[data-qa-accordion-bottom-actions]')).toBeNull()
  })

  it('renders bottom supporting actions without an empty introduction or aside', () => {
    const html = renderToStaticMarkup(
      createElement(QaAccordionBlockComponent, {
        items: [{ answer: createRichText('Answer'), question: 'Question' }],
        layoutMode: 'split',
        sideColumn: {
          contact: { actions: [{ label: 'Contact', linkType: 'custom', url: '/contact' }] },
        },
        supportingActionsPosition: 'bottom',
      }),
    )
    const doc = new DOMParser().parseFromString(html, 'text/html')

    expect(doc.querySelector('h2, aside, [data-qa-accordion-intro]')).toBeNull()
    expect(doc.querySelector('[data-qa-accordion-bottom-actions] a')?.getAttribute('href')).toBe(
      '/contact',
    )
  })

  it('omits the Stacked introduction when every optional field is empty', () => {
    const html = renderToStaticMarkup(
      createElement(QaAccordionBlockComponent, {
        title: '  ',
        description: '  ',
        items: [{ answer: createRichText('Answer'), question: 'Question' }],
        layoutMode: 'stacked',
      }),
    )
    const doc = new DOMParser().parseFromString(html, 'text/html')

    expect(doc.querySelector('h2, [data-qa-accordion-section-content]')).toBeNull()
    expect(doc.querySelector('[data-qa-accordion-main]')).not.toBeNull()
  })

  it('does not reserve bottom space for unresolved supporting actions', () => {
    const html = renderToStaticMarkup(
      createElement(QaAccordionBlockComponent, {
        items: [{ answer: createRichText('Answer'), question: 'Question' }],
        layoutMode: 'split',
        sideColumn: { contact: { actions: [{ label: 'Contact', linkType: 'custom', url: '' }] } },
        supportingActionsPosition: 'bottom',
        title: 'Library questions',
      }),
    )
    const doc = new DOMParser().parseFromString(html, 'text/html')

    expect(doc.querySelector('aside, [data-qa-accordion-bottom-actions]')).toBeNull()
  })

  it('uses the configured default alignment for null content alignment', () => {
    const html = renderToStaticMarkup(
      createElement(QaAccordionBlockComponent, {
        contentAlignment: null,
        items: [{ answer: createRichText('Answer'), question: 'Question' }],
        title: 'Library questions',
      }),
    )

    expect(html).toContain('data-qa-accordion-content-alignment="center"')
  })

  it.each([
    ['right', 'balanced', 'lg:grid-cols-2', 'lg:order-1', 'lg:order-2'],
    [
      'right',
      'sectionFocus',
      'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]',
      'lg:order-1',
      'lg:order-2',
    ],
    ['right', 'qaFocus', 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]', 'lg:order-1', 'lg:order-2'],
    [
      'left',
      'sectionFocus',
      'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]',
      'lg:order-2',
      'lg:order-1',
    ],
    ['left', 'qaFocus', 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]', 'lg:order-2', 'lg:order-1'],
  ] as const)(
    'renders %s Q&A with %s tracks and content-first DOM order',
    (accordionPlacement, splitProportion, trackClass, sectionOrder, qaOrder) => {
      const html = renderToStaticMarkup(
        createElement(QaAccordionBlockComponent, {
          accordionPlacement,
          items: [{ answer: createRichText('Answer'), question: 'Question' }],
          layoutMode: 'split',
          splitProportion,
          title: 'Frequently asked questions',
        }),
      )

      expect(html).toContain('grid gap-10 lg:gap-16')
      expect(html).toContain(trackClass)
      expect(html).toContain(`order-1 ${sectionOrder}`)
      expect(html).toContain(`order-2 ${qaOrder}`)
      expect(html.indexOf('data-qa-accordion-section-content="true"')).toBeLessThan(
        html.indexOf('data-qa-accordion-main="true"'),
      )
    },
  )

  it.each([
    ['top', 'lg:justify-start'],
    ['center', 'lg:justify-center'],
    ['bottom', 'lg:justify-end'],
  ] as const)('aligns the flexible section-content group to %s', (alignment, className) => {
    const html = renderToStaticMarkup(
      createElement(QaAccordionBlockComponent, {
        items: [{ answer: createRichText('Answer'), question: 'Question' }],
        layoutMode: 'split',
        sectionVerticalAlignment: alignment,
        sideColumn: {
          contact: { title: 'Contact us' },
          profile: { name: 'Advisor' },
        },
        title: 'Frequently asked questions',
      }),
    )
    const sectionTag = html.match(/<div class="([^"]*)" data-qa-accordion-section-content="true">/)
    const contentGroupTag = html.match(
      /<div class="([^"]*)" data-qa-accordion-content-group="true">/,
    )
    const supportTag = html.match(/<aside class="([^"]*)" data-qa-accordion-side-column="true">/)

    expect(sectionTag?.[1]).toContain('lg:h-full')
    expect(contentGroupTag?.[1]).toContain('lg:flex-1')
    expect(contentGroupTag?.[1]).toContain(className)
    expect(supportTag?.[1]).not.toContain('flex-1')
    expect(supportTag?.[1]).not.toContain('justify-between')
  })

  it('stacks content before Q&A and ignores supporting content', () => {
    const html = renderToStaticMarkup(
      createElement(QaAccordionBlockComponent, {
        accordionPlacement: 'left',
        items: [{ answer: createRichText('Answer'), question: 'Question' }],
        layoutMode: 'stacked',
        sectionVerticalAlignment: 'bottom',
        sideColumn: {
          contact: { title: 'Must not render' },
          profile: { name: 'Hidden' },
        },
        splitProportion: 'qaFocus',
        title: 'Frequently asked questions',
      }),
    )

    expect(html).toContain('data-qa-accordion-layout="stacked"')
    expect(html).toContain('data-qa-accordion-has-side-column="false"')
    expect(html).not.toContain('Must not render')
    expect(html).not.toContain('Hidden')
    expect(html).not.toContain('lg:grid-cols-')
    expect(html.indexOf('data-qa-accordion-section-content="true"')).toBeLessThan(
      html.indexOf('data-qa-accordion-main="true"'),
    )
  })

  it.each([
    ['fullWidth', 'stacked', 'balanced'],
    ['fiftyFifty', 'split', 'balanced'],
    ['oneThird', 'split', 'qaFocus'],
  ] as const)('renders legacy %s without stored-content mutation', (legacy, mode, proportion) => {
    const props = {
      items: [{ answer: createRichText('Answer'), question: 'Question' }],
      layoutMode: legacy,
      title: 'Legacy Q&A',
    }
    const html = renderToStaticMarkup(createElement(QaAccordionBlockComponent, props))

    expect(html).toContain(`data-qa-accordion-layout="${mode}"`)
    expect(html).toContain(`data-qa-accordion-split-proportion="${proportion}"`)
    expect(html).toContain('data-qa-accordion-section-vertical-alignment="top"')
    expect(props.layoutMode).toBe(legacy)
  })

  it('renders a one-third layout with the Q&A accordion on the right', () => {
    const html = renderToStaticMarkup(
      createElement(QaAccordionBlockComponent, {
        appearance: {
          background: 'subtle',
          border: 'top',
        },
        defaultOpenFirst: true,
        description: 'Answers to the most common admissions questions.',
        accordionPlacement: 'right',
        title: 'Frequently asked questions',
        items: [
          {
            answer: createRichText('Applications open in August and close in January.'),
            question: 'When does the application cycle open?',
          },
          {
            answer: createRichText('Yes. Need-based aid is available for eligible students.'),
            question: 'Do you offer financial support?',
          },
        ],
        layoutMode: 'oneThird',
        sideColumn: {
          contact: {
            actions: [
              { label: 'Contact admissions', linkType: 'custom', url: '/contact' },
              { label: 'Plan a visit', linkType: 'custom', url: '/visit' },
            ],
            description: 'Reach the admissions team for personalized guidance.',
            title: 'Still have questions?',
          },
          profile: {
            image: { alt: 'Admissions counselor', url: '/media/counselor.jpg' } as never,
            name: 'Sarah Johnson',
            title: 'Admissions Counselor',
          },
        },
        size: 'comfortable',
      }),
    )

    expect(html).toContain('data-qa-accordion-background="subtle"')
    expect(html).toContain('data-qa-accordion-has-side-column="true"')
    expect(html).toContain('data-qa-accordion-side-column="true"')
    expect(html).toContain('data-qa-accordion-layout="split"')
    expect(html).toContain('data-qa-accordion-split-proportion="qaFocus"')
    expect(html).toContain('data-qa-accordion-placement="right"')
    expect(html).toContain('data-qa-accordion-size="comfortable"')
    expect(html).toContain('py-20 md:py-28')
    expect(html).toContain(regularBlockContainerClasses)
    expect(html).toContain('bg-subtle')
    expect(html).toContain('border-t border-border')
    expect(html).toContain('Frequently asked questions')
    expect(html).toContain('Still have questions?')
    expect(html).toContain('Sarah Johnson')
    expect(html).toContain('href="/contact"')
    expect(html).toContain('href="/visit"')
    expect(html).toContain('data-qa-accordion-contact-actions="true"')
    expect(html).toContain('data-action-mode="link"')
    expect(html).toContain('group/button h-auto gap-2 px-0 py-0 text-sm')
    expect(html).toContain('rotate-[-35deg]')
    expect(html).toContain('group-hover/button:translate-x-1')
    expect(html).toContain('Applications open in August and close in January.')
    expect(html).toContain('prose-p:my-2')
    expect(html).toContain('prose-li:my-1')
    expect(html).not.toContain('prose-h2:text-3xl')
    expect(html).toContain('Reach the admissions team for personalized guidance.')
    expect(html).toContain('grid gap-10 lg:gap-16 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]')
    expect(html).toContain('data-qa-accordion-section-content="true"')
    expect(html).toContain('order-1 lg:order-1')
    expect(html).toContain('data-qa-accordion-main="true"')
    expect(html).toContain('order-2 lg:order-2')
    expect(html).not.toContain('lg:col-span-2')
    expect(html).toContain('data-qa-accordion-side-column="true"')
    expect(html.indexOf('data-qa-accordion-section-content="true"')).toBeLessThan(
      html.indexOf('<aside'),
    )
    expect(html.indexOf('<aside')).toBeLessThan(html.indexOf('data-qa-accordion-main="true"'))
  })

  it('renders full-width centered content with independent header button actions', () => {
    const html = renderToStaticMarkup(
      createElement(QaAccordionBlockComponent, {
        contentAlignment: 'center',
        defaultOpenFirst: false,
        description: 'Answers for prospective students.',
        title: 'Questions and answers',
        actions: [
          {
            label: 'Admissions guide',
            linkType: 'custom',
            mode: 'button',
            url: '/guide',
            variant: 'default',
          },
          {
            label: 'Contact us',
            linkType: 'custom',
            mode: 'button',
            url: '/contact',
            variant: 'outline',
          },
        ],
        items: [
          {
            answer: createRichText('The curriculum includes early clinical exposure.'),
            question: 'What does the curriculum include?',
          },
        ],
        layoutMode: 'fullWidth',
        sideColumn: {
          contact: {
            description: 'This content must not render in Full Width mode.',
            title: 'Still have questions?',
          },
          profile: {
            name: 'Sarah Johnson',
          },
        },
        size: 'compact',
      }),
    )

    expect(html).toContain('data-qa-accordion-has-side-column="false"')
    expect(html).toContain('data-qa-accordion-side-column="false"')
    expect(html).toContain('data-qa-accordion-layout="stacked"')
    expect(html).toContain('data-qa-accordion-split-proportion="balanced"')
    expect(html).toContain('data-qa-accordion-content-alignment="center"')
    expect(html).toContain('data-qa-accordion-size="compact"')
    expect(html).toContain('py-8 md:py-10')
    expect(html).toContain('w-full')
    expect(html).toContain('items-center text-center')
    expect(html).toContain('data-qa-accordion-header-actions="true"')
    expect(html).toContain('data-action-mode="button"')
    expect(html).toContain('data-action-variant="default"')
    expect(html).toContain('data-action-variant="outline"')
    expect(html).toContain('href="/guide"')
    expect(html).toContain('href="/contact"')
    expect(html).toContain('What does the curriculum include?')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('text-left text-base font-semibold')
    expect(html).toContain('data-qa-accordion-section-content="true"')
    expect(html.indexOf('data-qa-accordion-section-content="true"')).toBeLessThan(
      html.indexOf('data-qa-accordion-main="true"'),
    )
    expect(html).not.toContain('data-qa-accordion-side-column="true"')
    expect(html).not.toContain('Sarah Johnson')
    expect(html).not.toContain('Still have questions?')
    expect(html).not.toContain('max-w-4xl')
  })

  it('renders a 50/50 layout with right-aligned header content and left-aligned Q&A rows', () => {
    const html = renderToStaticMarkup(
      createElement(QaAccordionBlockComponent, {
        contentAlignment: 'right',
        description: 'Answers for current students.',
        accordionPlacement: 'left',
        title: 'Student questions',
        items: [
          {
            answer: createRichText('Visit the student services office.'),
            question: 'Where can I get support?',
          },
        ],
        layoutMode: 'fiftyFifty',
        sideColumn: {
          contact: {
            title: 'Student services',
          },
        },
      }),
    )

    expect(html).toContain('data-qa-accordion-layout="split"')
    expect(html).toContain('data-qa-accordion-split-proportion="balanced"')
    expect(html).toContain('data-qa-accordion-placement="left"')
    expect(html).toContain('data-qa-accordion-content-alignment="right"')
    expect(html).toContain('grid gap-10 lg:gap-16 lg:grid-cols-2')
    expect(html).toContain('data-qa-accordion-section-content="true"')
    expect(html).toContain('order-1 lg:order-2')
    expect(html).toContain('data-qa-accordion-main="true"')
    expect(html).toContain('order-2 lg:order-1')
    expect(html).toContain('data-qa-accordion-side-column="true"')
    expect(html).toContain('items-end text-right')
    expect(html).toContain('text-left text-base font-semibold')
  })

  it('keeps an authored 50/50 split when Profile and Contact Prompt are empty', () => {
    const html = renderToStaticMarkup(
      createElement(QaAccordionBlockComponent, {
        accordionPlacement: 'right',
        description: 'Core information remains in the content column.',
        items: [
          {
            answer: createRichText('The Q&A remains in its own column.'),
            question: 'Does the split depend on supporting content?',
          },
        ],
        layoutMode: 'fiftyFifty',
        title: 'Independent split layout',
      }),
    )

    expect(html).toContain('data-qa-accordion-layout="split"')
    expect(html).toContain('data-qa-accordion-split-proportion="balanced"')
    expect(html).toContain('data-qa-accordion-has-side-column="false"')
    expect(html).toContain('grid gap-10 lg:gap-16 lg:grid-cols-2')
    expect(html).toContain('data-qa-accordion-section-content="true"')
    expect(html).toContain('data-qa-accordion-main="true"')
    expect(html.indexOf('data-qa-accordion-section-content="true"')).toBeLessThan(
      html.indexOf('data-qa-accordion-main="true"'),
    )
  })
})
