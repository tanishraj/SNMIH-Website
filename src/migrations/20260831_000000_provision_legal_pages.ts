import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-mongodb'
import type { RequiredDataFromCollectionSlug } from 'payload'

import { LEGAL_PAGES_MIGRATION_CONTEXT } from '@/hooks/enforcePublicationPolicy'
import { SKIP_CACHE_REVALIDATION_CONTEXT } from '@/hooks/revalidateCmsContent'
import type { RichTextBlock } from '@/payload-types'

type LegalRelationshipField = 'privacyPolicyPage' | 'termsAndConditionsPage'
type LegalSection = {
  bullets?: readonly string[]
  heading: string
  paragraphs?: readonly string[]
}
type LegalPageSeed = {
  metaDescription: string
  relationshipField: LegalRelationshipField
  sections: readonly LegalSection[]
  slug: 'privacy-policy' | 'terms-and-conditions'
  title: 'Privacy Policy' | 'Terms and Conditions'
}
type LexicalChild = RichTextBlock['content']['root']['children'][number]

const EFFECTIVE_DATE_LINE = 'Effective 31 August 2026 · Last updated 31 August 2026'

const createTextNode = (text: string) => ({
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
  type: 'text',
  version: 1,
})

const createParagraphNode = (text: string): LexicalChild => ({
  children: [createTextNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  textStyle: '',
  type: 'paragraph',
  version: 1,
})

const createHeadingNode = (text: string): LexicalChild => ({
  children: [createTextNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  tag: 'h2',
  type: 'heading',
  version: 1,
})

const createBulletListNode = (items: readonly string[]): LexicalChild => ({
  children: items.map((text, index) => ({
    children: [createTextNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'listitem',
    value: index + 1,
    version: 1,
  })),
  direction: 'ltr',
  format: '',
  indent: 0,
  listType: 'bullet',
  start: 1,
  tag: 'ul',
  type: 'list',
  version: 1,
})

const buildRichTextContent = (sections: readonly LegalSection[]): RichTextBlock['content'] => ({
  root: {
    children: sections.flatMap((section) => [
      createHeadingNode(section.heading),
      ...(section.paragraphs ?? []).map(createParagraphNode),
      ...(section.bullets?.length ? [createBulletListNode(section.bullets)] : []),
    ]),
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
})

const LEGAL_PAGE_SEEDS = [
  {
    metaDescription:
      'Learn how Shree Narayan Medical Institute and Hospital handles information collected through the snmih.in website, forms, reviews, cookies, and consented analytics.',
    relationshipField: 'privacyPolicyPage',
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    sections: [
      {
        heading: 'Introduction',
        paragraphs: [
          'This Privacy Policy explains how Shree Narayan Medical Institute and Hospital ("SNMIH", "we", "our", or "us") handles personal information when a visitor uses snmih.in, submits a website form, posts a review, or otherwise contacts SNMIH through the website.',
          "This policy covers the website only. It is not SNMIH's clinical patient-record privacy notice and does not describe how medical records are handled during hospital treatment. Visitors must not submit medical records, diagnostic reports, payment-card details, or urgent medical information through a general website form. In an emergency, visitors should contact local emergency services or go to an appropriate emergency facility.",
        ],
      },
      {
        heading: 'Information we collect',
        bullets: [
          'Information supplied by the visitor, including name, email address, telephone number, form responses, review content, and other information entered into a website form.',
          'Submission context supplied by the website, such as the source, campaign, landing page, and submission time.',
          'Technical information needed to operate and secure the website, which may include IP address, browser or device information, requested pages, referring page, timestamps, and server logs.',
          "Analytics and performance information only when the visitor has granted analytics consent through the website's consent banner.",
        ],
      },
      {
        heading: 'How we use information',
        paragraphs: [
          'SNMIH may use website information to respond to enquiries; handle admission, career, contact, and other requested follow-up; store and moderate reviews; operate, secure, and troubleshoot the website; measure and improve the website when analytics consent has been granted; prevent misuse; and meet applicable legal obligations.',
        ],
      },
      {
        heading: 'Cookies and analytics',
        paragraphs: [
          "The website uses essential storage needed for site operation and saves the visitor's analytics choice. Google Tag Manager or Google Analytics and Vercel Speed Insights load only after analytics consent is granted. A visitor may reject analytics in the consent banner. To change a saved choice when no preference control is visible, the visitor may clear the site's cookies and choose again on the next visit.",
        ],
      },
      {
        heading: 'Sharing and service providers',
        paragraphs: [
          'SNMIH may share information with service providers that support hosting, infrastructure, email, storage, analytics, security, and website operation; with professional advisers where reasonably necessary; or with authorities when required by applicable law. Service providers may process information only for the relevant service and subject to their contractual and legal obligations. SNMIH does not sell personal information collected through the website.',
        ],
      },
      {
        heading: 'Retention and security',
        paragraphs: [
          'SNMIH keeps website information only for as long as reasonably necessary for the stated purpose, operational records, dispute handling, security, and applicable legal requirements. The analytics consent choice may remain in the browser for up to one year. SNMIH uses reasonable administrative and technical safeguards, but no internet transmission or storage system can be guaranteed completely secure.',
        ],
      },
      {
        heading: 'Visitor choices and requests',
        paragraphs: [
          "Subject to applicable law, a visitor may ask for information about website personal data associated with them, request correction or deletion, withdraw a consent that applies to future processing, or raise a grievance. Requests go to admission@snmih.in. SNMIH may need to verify the requester's identity and may retain information when applicable law or a legitimate record-keeping need requires it.",
        ],
      },
      {
        heading: 'Children',
        paragraphs: [
          "The website provides general institutional information and is not directed at young children. A person under 18 should use a parent or guardian's assistance before submitting personal information. SNMIH may request appropriate guardian involvement where required.",
        ],
      },
      {
        heading: 'External links',
        paragraphs: [
          'The website may link to external websites. Their operators control their own privacy practices, and visitors should review those policies before providing information.',
        ],
      },
      {
        heading: 'Changes to this policy',
        paragraphs: [
          'SNMIH may update the policy when website practices or applicable requirements change. The Page shows the effective and last-updated dates. Material changes apply from the updated effective date.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'Privacy questions and website-data requests may be sent to admission@snmih.in or addressed to Shree Narayan Medical Institute and Hospital, Mahavir Nagar, Bherdhari, Saharsa 852201, Bihar, on Bypass NH 107, India.',
        ],
      },
    ],
  },
  {
    metaDescription:
      'Read the terms that govern use of the Shree Narayan Medical Institute and Hospital website at snmih.in.',
    relationshipField: 'termsAndConditionsPage',
    slug: 'terms-and-conditions',
    title: 'Terms and Conditions',
    sections: [
      {
        heading: 'Acceptance',
        paragraphs: [
          'These Terms and Conditions govern access to and use of snmih.in, operated by Shree Narayan Medical Institute and Hospital ("SNMIH", "we", "our", or "us"). By using the website, a visitor agrees to these Terms. A visitor who does not agree should stop using the website.',
        ],
      },
      {
        heading: 'Website information and medical disclaimer',
        paragraphs: [
          'The website provides general information about SNMIH, its educational programmes, facilities, services, notices, and activities. It is not medical advice, diagnosis, treatment, an emergency service, or a replacement for consultation with a qualified healthcare professional. A person with a medical emergency should contact local emergency services or go to an appropriate emergency facility.',
        ],
      },
      {
        heading: 'Admissions, courses, fees, and notices',
        paragraphs: [
          'Admissions, eligibility, fees, seats, courses, schedules, facilities, and regulatory information may change and may be subject to official authorities, published notifications, and separate written terms. Website content is not an offer, admission guarantee, fee contract, or assurance of availability. Applicants must confirm material information with SNMIH and the relevant official authority before acting or paying money.',
        ],
      },
      {
        heading: 'Acceptable use',
        paragraphs: [
          "A visitor must use the website lawfully and must not interfere with its security or operation, attempt unauthorised access, introduce malicious code, submit false or unlawful content, impersonate another person, infringe another person's rights, or use the website in a way that harms SNMIH or other users.",
        ],
      },
      {
        heading: 'Forms, reviews, and other submissions',
        paragraphs: [
          "A visitor is responsible for information they submit and must have the right to provide it. Submissions must not contain unlawful, abusive, defamatory, infringing, confidential, or unnecessary medical information. SNMIH may review, refuse, edit for moderation, unpublish, or remove submissions and does not guarantee publication or a response. By submitting content intended for public display, the visitor grants SNMIH a non-exclusive, royalty-free licence to host, reproduce, moderate, and display that content for website operation and promotion of the relevant SNMIH service. This licence does not transfer ownership of the visitor's content.",
        ],
      },
      {
        heading: 'Intellectual property',
        paragraphs: [
          'Unless stated otherwise, website text, branding, graphics, layout, and other materials are owned by or licensed to SNMIH and are protected by applicable law. Visitors may view and make reasonable personal, non-commercial use of the website. Other reproduction, publication, modification, distribution, or commercial use requires prior permission from the relevant rights holder.',
        ],
      },
      {
        heading: 'External links',
        paragraphs: [
          "Links to external websites are provided for convenience. SNMIH does not control their content, availability, security, or practices, and a link does not necessarily imply endorsement. Visitors use external websites at their own discretion and subject to those websites' terms.",
        ],
      },
      {
        heading: 'Availability and disclaimers',
        paragraphs: [
          'SNMIH aims to keep website information useful and the service available, but does not guarantee that all content is complete, current, error-free, uninterrupted, or free from harmful components. To the extent permitted by applicable law, the website and its content are provided on an "as available" basis. Nothing in these Terms excludes a responsibility that cannot lawfully be excluded.',
        ],
      },
      {
        heading: 'Limitation of liability',
        paragraphs: [
          'To the extent permitted by applicable law, SNMIH is not liable for indirect, incidental, or consequential loss arising solely from use of, inability to use, or reliance on the website or an external link. This limitation does not apply where liability cannot lawfully be limited.',
        ],
      },
      {
        heading: 'Privacy',
        paragraphs: [
          "SNMIH's Privacy Policy explains how website personal information is handled. The configured Privacy Policy Page should be read with these Terms.",
        ],
      },
      {
        heading: 'Changes',
        paragraphs: [
          'SNMIH may update the website and these Terms. The Page shows the effective and last-updated dates. Continued use after updated Terms take effect constitutes acceptance of the updated Terms.',
        ],
      },
      {
        heading: 'Governing law and jurisdiction',
        paragraphs: [
          'These Terms are governed by the laws of India. Subject to any mandatory dispute-resolution or consumer-protection requirement, courts with jurisdiction in Saharsa, Bihar will have jurisdiction over disputes relating to the website.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'Questions about these Terms may be sent to admission@snmih.in or addressed to Shree Narayan Medical Institute and Hospital, Mahavir Nagar, Bherdhari, Saharsa 852201, Bihar, on Bypass NH 107, India.',
        ],
      },
    ],
  },
] as const satisfies readonly LegalPageSeed[]

const buildLegalPageData = (
  seed: LegalPageSeed,
  publishedAt: string,
): RequiredDataFromCollectionSlug<'pages'> => ({
  _status: 'published',
  generateSlug: false,
  includeInSitemap: 'include',
  layout: [
    {
      actionPlacement: 'side',
      appearance: { background: 'none', border: 'none' },
      blockType: 'pageHeader',
      breadcrumbMode: 'automatic',
      contentAlignment: 'left',
      contentWidth: 'default',
      height: 'default',
      size: 'default',
      subtitle: EFFECTIVE_DATE_LINE,
      title: seed.title,
      topContent: 'breadcrumb',
      variant: 'minimal',
    },
    {
      appearance: { background: 'none', border: 'none' },
      blockType: 'richText',
      content: buildRichTextContent(seed.sections),
      maxWidth: 'prose',
      size: 'compact',
    },
  ],
  metaDescription: seed.metaDescription,
  metaTitle: seed.title,
  publishedAt,
  robotsMode: 'index',
  slug: seed.slug,
  title: seed.title,
})

export async function up({ payload, req, session }: MigrateUpArgs): Promise<void> {
  const publishedAt = new Date().toISOString()
  const pageIDs = new Map<LegalRelationshipField, string>()

  for (const seed of LEGAL_PAGE_SEEDS) {
    const existingPages = await payload.find({
      collection: 'pages',
      depth: 0,
      draft: true,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: {
        slug: {
          equals: seed.slug,
        },
      },
    })

    const existingPage = existingPages.docs[0]
    const pageID = existingPage
      ? existingPage.id
      : (
          await payload.create({
            collection: 'pages',
            context: {
              [SKIP_CACHE_REVALIDATION_CONTEXT]: true,
              systemProvisioning: LEGAL_PAGES_MIGRATION_CONTEXT,
            },
            data: buildLegalPageData(seed, publishedAt),
            depth: 0,
            draft: false,
            overrideAccess: true,
            req,
          })
        ).id

    pageIDs.set(seed.relationshipField, pageID)
  }

  const [publishedSiteSettings, latestSiteSettings] = await Promise.all([
    payload.findGlobal({
      slug: 'site-settings',
      depth: 0,
      draft: false,
      overrideAccess: true,
      req,
    }),
    payload.findGlobal({
      slug: 'site-settings',
      depth: 0,
      draft: true,
      overrideAccess: true,
      req,
    }),
  ])
  const currentUpdates: Partial<Record<LegalRelationshipField, string>> = {}
  const versionUpdates: Record<string, string> = {}

  for (const seed of LEGAL_PAGE_SEEDS) {
    if (
      publishedSiteSettings[seed.relationshipField] != null ||
      latestSiteSettings[seed.relationshipField] != null
    ) {
      continue
    }

    const pageID = pageIDs.get(seed.relationshipField)

    if (!pageID) {
      throw new Error(`Missing provisioned Page ID for ${seed.relationshipField}.`)
    }

    currentUpdates[seed.relationshipField] = pageID
    versionUpdates[`version.${seed.relationshipField}`] = pageID
  }

  if (Object.keys(currentUpdates).length === 0) return

  // The adapter and Mongoose currently resolve different transitive MongoDB
  // ClientSession type identities. The migration supplies the same runtime
  // session to both models, so narrow the duplicate-driver type at this edge.
  const sessionOptions = { session: session as never }

  await Promise.all([
    payload.db.globals.updateMany(
      { globalType: 'site-settings' },
      { $set: currentUpdates },
      sessionOptions,
    ),
    payload.db.versions['site-settings'].updateMany(
      { latest: true },
      { $set: versionUpdates },
      sessionOptions,
    ),
  ])
}

export async function down(args: MigrateDownArgs): Promise<void> {
  // Intentionally non-destructive: editors may have revised or reconfigured this content.
  void args
}
