import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'

import { hasFeature } from '@/access/featureAccess'
import type { User } from '@/payload-types'

// ── Shared style helpers ───────────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--theme-elevation-500)',
  marginBottom: '10px',
}

const card: React.CSSProperties = {
  background: 'var(--theme-elevation-100)',
  border: '1px solid var(--theme-elevation-200)',
  borderRadius: '8px',
}

// ── Attention stat card ────────────────────────────────────────────────────────

type AttentionCardProps = {
  label: string
  value: number | null
  href: string
  accent: string
  alert?: boolean
}

function AttentionCard({ label, value, href, accent, alert = false }: AttentionCardProps) {
  const unavailable = value === null
  const active = alert && !unavailable && value > 0
  return (
    <a
      href={href}
      style={{
        ...card,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '20px 24px',
        textDecoration: 'none',
        color: 'inherit',
        borderColor: active ? accent : 'var(--theme-elevation-200)',
      }}
    >
      <span style={{ fontSize: '28px', fontWeight: 700, color: accent, lineHeight: 1 }}>
        {unavailable ? '—' : value}
      </span>
      <span style={{ fontSize: '13px', color: 'var(--theme-elevation-600)', fontWeight: 500 }}>
        {label}
      </span>
      {unavailable ? (
        <span style={{ fontSize: '11px', color: 'var(--theme-elevation-600)', marginTop: '2px' }}>
          Count unavailable
        </span>
      ) : active ? (
        <span style={{ fontSize: '11px', color: accent, fontWeight: 600, marginTop: '2px' }}>
          Needs attention →
        </span>
      ) : null}
    </a>
  )
}

// ── Mini stat (context row) ────────────────────────────────────────────────────

function MiniStat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <a
      href={href}
      style={{
        ...card,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        textDecoration: 'none',
        color: 'inherit',
        gap: '12px',
      }}
    >
      <span style={{ fontSize: '13px', color: 'var(--theme-elevation-700)', fontWeight: 500 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--theme-elevation-800)',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </a>
  )
}

// ── Recently edited row ────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  Page: '#6366f1',
  Article: '#0ea5e9',
  'News & Event': '#10b981',
  Review: '#f59e0b',
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  published: { bg: '#d1fae5', color: '#065f46', label: 'Published' },
  draft: { bg: '#f3f4f6', color: '#374151', label: 'Draft' },
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type RecentItem = {
  id: string
  title?: string | null
  type: string
  collection: string
  updatedAt: string
  status: string | null | undefined
}

function RecentEditRow({ item }: { item: RecentItem }) {
  const typeColor = TYPE_COLORS[item.type] ?? '#6366f1'
  const statusStyle = STATUS_STYLES[item.status ?? 'draft'] ?? STATUS_STYLES.draft
  return (
    <a
      href={`/admin/collections/${item.collection}/${item.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        textDecoration: 'none',
        color: 'inherit',
        borderBottom: '1px solid var(--theme-elevation-150)',
      }}
    >
      {/* Type badge */}
      <span
        style={{
          flexShrink: 0,
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: typeColor,
          background: typeColor + '18',
          padding: '2px 7px',
          borderRadius: '4px',
          minWidth: '68px',
          textAlign: 'center',
        }}
      >
        {item.type}
      </span>

      {/* Title */}
      <span
        style={{
          flex: 1,
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--theme-text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {item.title}
      </span>

      {/* Status badge */}
      <span
        style={{
          flexShrink: 0,
          fontSize: '11px',
          fontWeight: 600,
          background: statusStyle.bg,
          color: statusStyle.color,
          padding: '2px 8px',
          borderRadius: '99px',
        }}
      >
        {statusStyle.label}
      </span>

      {/* Time */}
      <span
        style={{
          flexShrink: 0,
          fontSize: '12px',
          color: 'var(--theme-elevation-500)',
          whiteSpace: 'nowrap',
          minWidth: '60px',
          textAlign: 'right',
        }}
      >
        {formatRelativeTime(item.updatedAt)}
      </span>
    </a>
  )
}

// ── Main dashboard ─────────────────────────────────────────────────────────────

export async function DashboardOverview() {
  const payload = await getPayload({ config: configPromise })

  let user: User | null = null
  try {
    const authResult = await payload.auth({
      canSetHeaders: false,
      headers: new Headers(await getHeaders()),
    })
    user = authResult.user as User | null
  } catch {
    return null
  }

  if (!user) return null

  const visibility = {
    articles: hasFeature(user, 'articles'),
    formSubmissions: hasFeature(user, 'formSubmissions'),
    media: hasFeature(user, 'media'),
    newsEvents: hasFeature(user, 'newsEvents'),
    pages: hasFeature(user, 'pages'),
    reusableSections: hasFeature(user, 'reusableSections'),
    reviews: hasFeature(user, 'reviews'),
    workQueue: hasFeature(user, 'actionQueue'),
  }
  const secureQuery = { overrideAccess: false as const, user }
  const zeroCount = () => Promise.resolve({ totalDocs: 0 })
  const unavailableCount = () => Promise.resolve({ totalDocs: null })
  const emptyDocs = () => Promise.resolve({ docs: [] })

  const [
    pagesTotal,
    articlesTotal,
    newsTotal,
    reviewsTotal,
    pendingReviews,
    openSubmissions,
    actionQueue,
    recentPages,
    recentArticles,
    recentNews,
    recentSubmissionsResult,
  ] = await Promise.all([
    // Content totals
    visibility.pages
      ? payload.count({ collection: 'pages', ...secureQuery }).catch(zeroCount)
      : zeroCount(),
    visibility.articles
      ? payload.count({ collection: 'articles', ...secureQuery }).catch(zeroCount)
      : zeroCount(),
    visibility.newsEvents
      ? payload.count({ collection: 'news-events', ...secureQuery }).catch(zeroCount)
      : zeroCount(),
    visibility.reviews
      ? payload.count({ collection: 'reviews', ...secureQuery }).catch(zeroCount)
      : zeroCount(),
    // Public reviews waiting for moderation
    visibility.reviews
      ? payload
          .count({
            collection: 'reviews',
            ...secureQuery,
            where: {
              and: [
                { sourceSubmission: { exists: true } },
                { moderationStatus: { equals: 'pending' } },
              ],
            },
          })
          .catch(unavailableCount)
      : zeroCount(),
    // Lead / ops
    visibility.formSubmissions
      ? payload
          .count({
            collection: 'form-submissions',
            ...secureQuery,
            where: { status: { in: ['new', 'in_review'] } },
          })
          .catch(unavailableCount)
      : zeroCount(),
    visibility.workQueue
      ? payload
          .count({
            collection: 'work-queue',
            ...secureQuery,
            where: { status: { in: ['open', 'in_progress', 'blocked'] } },
          })
          .catch(unavailableCount)
      : zeroCount(),
    // Recently edited
    visibility.pages
      ? payload
          .find({ collection: 'pages', ...secureQuery, depth: 0, limit: 5, sort: '-updatedAt' })
          .catch(emptyDocs)
      : emptyDocs(),
    visibility.articles
      ? payload
          .find({ collection: 'articles', ...secureQuery, depth: 0, limit: 5, sort: '-updatedAt' })
          .catch(emptyDocs)
      : emptyDocs(),
    visibility.newsEvents
      ? payload
          .find({
            collection: 'news-events',
            ...secureQuery,
            depth: 0,
            limit: 5,
            sort: '-updatedAt',
          })
          .catch(emptyDocs)
      : emptyDocs(),
    // Recent submissions
    visibility.formSubmissions
      ? payload
          .find({
            collection: 'form-submissions',
            ...secureQuery,
            depth: 0,
            limit: 5,
            sort: '-submittedAt',
          })
          .catch(emptyDocs)
      : emptyDocs(),
  ])

  const recentEdits: RecentItem[] = [
    ...recentPages.docs.map((d) => ({
      id: String(d.id),
      title: String(d.title ?? 'Untitled'),
      type: 'Page',
      collection: 'pages',
      updatedAt: String(d.updatedAt),
      status: d._status,
    })),
    ...recentArticles.docs.map((d) => ({
      id: String(d.id),
      title: String(d.title ?? 'Untitled'),
      type: 'Article',
      collection: 'articles',
      updatedAt: String(d.updatedAt),
      status: d._status,
    })),
    ...recentNews.docs.map((d) => ({
      id: String(d.id),
      title: String(d.title ?? 'Untitled'),
      type: 'News & Event',
      collection: 'news-events',
      updatedAt: String(d.updatedAt),
      status: d._status,
    })),
  ]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)

  const recentSubmissions = recentSubmissionsResult.docs
  const hasContent =
    visibility.pages || visibility.articles || visibility.newsEvents || visibility.reviews
  const hasAttention = visibility.reviews || visibility.formSubmissions || visibility.workQueue
  const quickActions = [
    { enabled: visibility.pages, href: '/admin/collections/pages/create', label: '+ New Page' },
    {
      enabled: visibility.articles,
      href: '/admin/collections/articles/create',
      label: '+ New Article',
    },
    {
      enabled: visibility.newsEvents,
      href: '/admin/collections/news-events/create',
      label: '+ New News / Event',
    },
    {
      enabled: visibility.reusableSections,
      href: '/admin/collections/reusable-sections/create',
      label: '+ New Reusable Section',
    },
    {
      enabled: visibility.media,
      href: '/admin/collections/media/create',
      label: '+ Upload Media',
    },
  ].filter(({ enabled }) => enabled)
  const hasAssignedWorkspace = hasContent || hasAttention || quickActions.length > 0

  return (
    <div style={{ padding: '0 0 48px' }}>
      {!hasAssignedWorkspace ? (
        <div style={{ ...card, maxWidth: '620px', padding: '24px' }}>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>No features assigned yet</p>
          <p
            style={{
              color: 'var(--theme-elevation-600)',
              fontSize: '13px',
              lineHeight: 1.5,
              margin: '8px 0 0',
            }}
          >
            Your account is active, but an Admin has not assigned a website feature to it. Contact
            an Admin when you need access.
          </p>
        </div>
      ) : null}

      {/* ── Needs Attention ───────────────────────────────────────────────── */}
      {hasAttention ? (
        <>
          <p style={sectionLabel}>Needs Attention</p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '12px',
              marginBottom: '32px',
            }}
          >
            {visibility.reviews ? (
              <AttentionCard
                label="Reviews awaiting moderation"
                value={pendingReviews.totalDocs}
                href="/admin/collections/reviews?where[and][0][sourceSubmission][exists]=true&where[and][1][moderationStatus][equals]=pending"
                accent="#0f766e"
                alert
              />
            ) : null}
            {visibility.formSubmissions ? (
              <AttentionCard
                label="Open Submissions"
                value={openSubmissions.totalDocs}
                href="/admin/collections/form-submissions"
                accent="#f59e0b"
                alert
              />
            ) : null}
            {visibility.workQueue ? (
              <AttentionCard
                label="Action Queue"
                value={actionQueue.totalDocs}
                href="/admin/collections/work-queue"
                accent="#ef4444"
                alert
              />
            ) : null}
          </div>
        </>
      ) : null}

      {/* ── Content Overview ──────────────────────────────────────────────── */}
      {hasContent ? (
        <>
          <p style={sectionLabel}>Content Overview</p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '10px',
              marginBottom: '32px',
            }}
          >
            {visibility.pages ? (
              <MiniStat
                label="Pages"
                value={pagesTotal.totalDocs}
                href="/admin/collections/pages"
              />
            ) : null}
            {visibility.articles ? (
              <MiniStat
                label="Articles"
                value={articlesTotal.totalDocs}
                href="/admin/collections/articles"
              />
            ) : null}
            {visibility.newsEvents ? (
              <MiniStat
                label="News & Events"
                value={newsTotal.totalDocs}
                href="/admin/collections/news-events"
              />
            ) : null}
            {visibility.reviews ? (
              <MiniStat
                label="Reviews"
                value={reviewsTotal.totalDocs}
                href="/admin/collections/reviews"
              />
            ) : null}
          </div>
        </>
      ) : null}

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
      {quickActions.length > 0 ? (
        <>
          <p style={{ ...sectionLabel, marginBottom: '10px' }}>Quick Actions</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
            {quickActions.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                style={{
                  display: 'inline-block',
                  padding: '7px 14px',
                  background: 'var(--theme-elevation-100)',
                  border: '1px solid var(--theme-elevation-200)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--theme-text)',
                  textDecoration: 'none',
                }}
              >
                {label}
              </a>
            ))}
          </div>
        </>
      ) : null}

      {/* ── Recently Edited ───────────────────────────────────────────────── */}
      {recentEdits.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <p style={sectionLabel}>Recently Edited</p>
          <div style={{ ...card, overflow: 'hidden' }}>
            {recentEdits.map((item, i) => (
              <div
                key={`${item.collection}-${item.id}`}
                style={i === recentEdits.length - 1 ? { borderBottom: 'none' } : {}}
              >
                <RecentEditRow item={item} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Submissions ────────────────────────────────────────────── */}
      {visibility.formSubmissions && recentSubmissions.length > 0 && (
        <div>
          <p style={sectionLabel}>Recent Submissions</p>
          <div style={{ ...card, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--theme-elevation-200)' }}>
                  {['From', 'Form Intent', 'Status', 'Submitted'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: 'var(--theme-elevation-600)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.map((sub, i) => {
                  const isLast = i === recentSubmissions.length - 1
                  const statusStyle =
                    sub.status === 'new'
                      ? { bg: '#fef3c7', color: '#92400e' }
                      : sub.status === 'in_review'
                        ? { bg: '#dbeafe', color: '#1e40af' }
                        : { bg: '#f3f4f6', color: '#374151' }
                  return (
                    <tr
                      key={sub.id}
                      style={isLast ? {} : { borderBottom: '1px solid var(--theme-elevation-150)' }}
                    >
                      <td style={{ padding: '10px 16px' }}>
                        <a
                          href={`/admin/collections/form-submissions/${sub.id}`}
                          style={{ color: 'var(--theme-text)', textDecoration: 'underline' }}
                        >
                          {sub.submitterEmail || sub.submitterName || `#${sub.id}`}
                        </a>
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--theme-elevation-600)' }}>
                        {sub.submissionIntent ?? '—'}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '99px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: statusStyle.bg,
                            color: statusStyle.color,
                          }}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          color: 'var(--theme-elevation-600)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {sub.submittedAt
                          ? new Date(sub.submittedAt as string).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
