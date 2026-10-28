'use client'

import {
  Button,
  ConfirmationModal,
  toast,
  useAuth,
  useConfig,
  useDocumentInfo,
  useFormModified,
  useModal,
} from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { formatAdminURL } from 'payload/shared'
import { useState } from 'react'

import { hasFeature } from '@/access/featureAccess'

import './DisclosureMonthActions.scss'

const copySlug = 'disclosure-copy-month'
const publishSlug = 'disclosure-publish-month'

const pad = (value: number) => String(value).padStart(2, '0')
const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const lastDayOf = (year: number, month: number) => new Date(year, month + 1, 0).getDate()

/** One month after the source date; a month-end date stays on the month end. */
export const nextReportingDate = (asOf: unknown): Date => {
  const source = typeof asOf === 'string' && asOf ? new Date(asOf) : new Date()
  const year = source.getFullYear()
  const month = source.getMonth()
  const day = source.getDate()
  const nextLast = lastDayOf(year, month + 1)
  const nextDay = day === lastDayOf(year, month) ? nextLast : Math.min(day, nextLast)
  return new Date(year, month + 1, nextDay, 12)
}

export const monthLabel = (date: Date) =>
  new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(date)

type MonthResult = { editURL?: unknown; message?: unknown; published?: unknown }

export function DisclosureMonthActions() {
  const { config } = useConfig()
  const { user } = useAuth()
  const { id, savedDocumentData } = useDocumentInfo()
  const modified = useFormModified()
  const { openModal } = useModal()
  const router = useRouter()
  const [label, setLabel] = useState('')
  const [dateKey, setDateKey] = useState('')

  if (!id || !hasFeature(user, 'disclosurePeriods') || !hasFeature(user, 'disclosureRecords')) {
    return null
  }

  const current = typeof savedDocumentData?.label === 'string' ? savedDocumentData.label : ''
  const endpoint = (path: string) =>
    formatAdminURL({
      apiRoute: config.routes.api,
      path: `/disclosure-periods/${id}/${path}`,
      relative: true,
      serverURL: config.serverURL,
    })

  const post = async (path: string, body?: object) => {
    const response = await fetch(endpoint(path), {
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    const result = (await response.json().catch(() => ({}))) as MonthResult
    if (!response.ok) {
      throw new Error(typeof result.message === 'string' ? result.message : 'Please try again.')
    }
    return result
  }

  const startCopy = () => {
    const next = nextReportingDate(savedDocumentData?.asOf)
    setLabel(monthLabel(next))
    setDateKey(toDateKey(next))
    openModal(copySlug)
  }

  const startPublish = () => {
    if (modified) {
      toast.error('Save your changes to this period before publishing the month.')
      return
    }
    openModal(publishSlug)
  }

  const copy = async () => {
    const [year, month, day] = dateKey.split('-').map(Number)
    if (!label.trim() || !year || !month || !day) {
      toast.error('Enter a name and reporting date for the new month.')
      return
    }
    try {
      const result = await post('copy', {
        asOf: new Date(year, month - 1, day, 12).toISOString(),
        label: label.trim(),
      })
      toast.success(`${label.trim()} is ready as a draft. Update the values that changed.`)
      if (typeof result.editURL === 'string') router.push(result.editURL)
    } catch (error) {
      toast.error(`Could not copy the month. ${(error as Error).message}`)
    }
  }

  const publish = async () => {
    try {
      const result = await post('publish-month')
      const count = Number(result.published) || 0
      toast.success(
        count
          ? `${current || 'This month'} and ${count} record${count === 1 ? '' : 's'} are published.`
          : `${current || 'This month'} is published. Every record was already live.`,
      )
      router.refresh()
    } catch (error) {
      toast.error(`Could not publish the month. ${(error as Error).message}`)
    }
  }

  return (
    <>
      <Button buttonStyle="secondary" onClick={startCopy} size="medium" type="button">
        Copy to a new month
      </Button>
      <Button buttonStyle="secondary" onClick={startPublish} size="medium" type="button">
        Publish month
      </Button>

      <ConfirmationModal
        body={
          <div className="disclosure-month-actions">
            <p>
              Creates a draft month with the same details and a draft copy of every record in{' '}
              {current || 'this month'}. {current || 'This month'} itself is not changed.
            </p>
            <div className="field-type text">
              <label className="field-label" htmlFor="disclosure-copy-label">
                New month name
              </label>
              <input
                id="disclosure-copy-label"
                onChange={(event) => setLabel(event.target.value)}
                type="text"
                value={label}
              />
            </div>
            <div className="field-type text">
              <label className="field-label" htmlFor="disclosure-copy-date">
                Reporting date
              </label>
              <input
                id="disclosure-copy-date"
                onChange={(event) => setDateKey(event.target.value)}
                type="date"
                value={dateKey}
              />
            </div>
          </div>
        }
        confirmingLabel="Copying…"
        confirmLabel="Create draft month"
        heading="Copy to a new month"
        modalSlug={copySlug}
        onConfirm={copy}
      />
      <ConfirmationModal
        body={`Publishes ${current || 'this month'} and every record in it that has unpublished changes. Visitors see the new values straight away.`}
        confirmingLabel="Publishing…"
        confirmLabel="Publish month"
        heading={`Publish ${current || 'this month'}?`}
        modalSlug={publishSlug}
        onConfirm={publish}
      />
    </>
  )
}
