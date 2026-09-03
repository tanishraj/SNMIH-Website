'use client'

import { Star } from 'lucide-react'
import { useState } from 'react'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import { regularBlockMobilePaddingClasses } from '@/blocks/shared/blockSpacing'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FORM_HONEYPOT_FIELD_NAME } from '@/lib/forms'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { reviewRatingOptions } from '@/lib/reviews'
import { cn } from '@/lib/utils'
import type { Form } from '@/payload-types'

type ReviewFieldName = 'rating' | 'reviewBody' | 'reviewerEmail' | 'reviewerName' | 'subjectLabel'

type ReviewFieldOption = {
  label: string
  value: string
}

type ReviewFieldDefinition = {
  description?: string
  label: string
  name: ReviewFieldName
  options?: ReviewFieldOption[]
  placeholder?: string
  required: boolean
  type: 'checkbox' | 'email' | 'select' | 'text' | 'textarea'
}

type ReviewSubmissionValues = {
  rating: string
  reviewBody: string
  reviewerEmail: string
  reviewerName: string
  subjectLabel: string
}

type FormLike = Pick<Form, 'fields' | 'slug' | 'submitButtonLabel' | 'successMessage' | 'title'>

type ReviewSubmissionBlockLike = {
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: 'center' | 'left' | 'right' | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  form?: FormLike | number | string | null
  formDescription?: string | null
  formEyebrow?: string | null
  formHeading?: string | null
  size?: 'none' | 'comfortable' | 'compact' | 'default' | null
  title?: string | null
}

const formPanelPaddingClasses = {
  none: 'p-5 sm:p-8',
  compact: 'p-4 sm:p-6',
  default: 'p-5 sm:p-8',
  comfortable: 'p-6 sm:p-10',
} as const

const contentAlignmentClasses = {
  left: 'self-start items-start text-left',
  center: 'self-center items-center text-center',
  right: 'self-end items-end text-right',
} as const

const ratingToneByValue: Record<string, { className: string; label: string }> = {
  '1': { className: 'text-rating-poor', label: 'Poor' },
  '2': { className: 'text-rating-fair', label: 'Fair' },
  '3': { className: 'text-rating-good', label: 'Good' },
  '4': { className: 'text-rating-very-good', label: 'Very Good' },
  '5': { className: 'text-rating-excellent', label: 'Excellent' },
}

const initialValues: ReviewSubmissionValues = {
  rating: '',
  reviewBody: '',
  reviewerEmail: '',
  reviewerName: '',
  subjectLabel: '',
}

const fallbackFieldDefinitions: Record<ReviewFieldName, ReviewFieldDefinition> = {
  rating: {
    label: 'Rating',
    name: 'rating',
    options: reviewRatingOptions.map((option) => ({
      label: option.label,
      value: option.value,
    })),
    required: true,
    type: 'select',
  },
  reviewBody: {
    label: 'Description',
    name: 'reviewBody',
    placeholder: 'Tell us what stood out — a professor, a program, a moment on campus.',
    required: true,
    type: 'textarea',
  },
  reviewerName: {
    label: 'Your name',
    name: 'reviewerName',
    placeholder: 'Jane Doe',
    required: true,
    type: 'text',
  },
  reviewerEmail: {
    label: 'Email',
    name: 'reviewerEmail',
    placeholder: 'jane@example.com',
    required: false,
    type: 'email',
  },
  subjectLabel: {
    label: 'What is it about?',
    name: 'subjectLabel',
    options: [
      { label: 'Academics', value: 'academics' },
      { label: 'Campus', value: 'campus' },
      { label: 'Faculty', value: 'faculty' },
      { label: 'Admissions', value: 'admissions' },
      { label: 'Research', value: 'research' },
    ],
    required: false,
    type: 'select',
  },
}

function resolveFormRecord(form: ReviewSubmissionBlockLike['form']): FormLike | null {
  if (!form || typeof form !== 'object') {
    return null
  }

  return form as FormLike
}

function getFieldDefinition(
  formRecord: FormLike | null,
  name: ReviewFieldName,
): ReviewFieldDefinition {
  const fallback = fallbackFieldDefinitions[name]
  const rawField = formRecord?.fields?.find((field) => field?.name === name)

  if (!rawField) {
    return fallback
  }

  const resolvedOptions =
    rawField.options?.flatMap((option) => {
      const label = option?.label?.trim()
      const value = option?.value?.trim()

      return label && value ? [{ label, value }] : []
    }) ?? []

  return {
    ...fallback,
    description: name === 'reviewBody' ? fallback.description : undefined,
    label: rawField.label?.trim() || fallback.label,
    options: resolvedOptions.length ? resolvedOptions : fallback.options,
    placeholder: rawField.placeholder?.trim() || fallback.placeholder,
    required: name === 'reviewerEmail' ? false : (rawField.required ?? fallback.required),
    type:
      rawField.type === 'checkbox' ||
      rawField.type === 'email' ||
      rawField.type === 'select' ||
      rawField.type === 'text' ||
      rawField.type === 'textarea'
        ? rawField.type
        : fallback.type,
  }
}

function getSubmissionMetadata() {
  if (typeof window === 'undefined') {
    return {}
  }

  const url = new URL(window.location.href)
  const referrer = document.referrer
  let resolvedSource = url.searchParams.get('utm_source') || undefined

  if (!resolvedSource && referrer) {
    try {
      resolvedSource = new URL(referrer).hostname || undefined
    } catch {
      resolvedSource = undefined
    }
  }

  return {
    campaign: url.searchParams.get('utm_campaign') || undefined,
    landingPage: `${url.pathname}${url.search}`,
    source: resolvedSource,
  }
}

export function ReviewSubmissionBlockComponent({
  actions,
  appearance,
  contentAlignment = 'center',
  description,
  eyebrow,
  footerActions,
  form,
  formDescription,
  formEyebrow,
  formHeading,
  size = 'default',
  title,
}: ReviewSubmissionBlockLike) {
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const resolvedContentAlignment = contentAlignment ?? 'left'
  const resolvedSize = size ?? 'default'
  const formRecord = resolveFormRecord(form)
  const formSlug = formRecord?.slug?.trim()
  const isFormAvailable = Boolean(formSlug)
  const ratingField = getFieldDefinition(formRecord, 'rating')
  const subjectField = getFieldDefinition(formRecord, 'subjectLabel')
  const bodyField = getFieldDefinition(formRecord, 'reviewBody')
  const nameField = getFieldDefinition(formRecord, 'reviewerName')
  const emailField = getFieldDefinition(formRecord, 'reviewerEmail')
  const submitLabel = formRecord?.submitButtonLabel?.trim() || 'Submit review'
  const resolvedEyebrow = eyebrow?.trim() || formEyebrow?.trim()
  const resolvedTitle =
    title?.trim() || formHeading?.trim() || formRecord?.title?.trim() || 'Share your review'
  const resolvedDescription = description?.trim() || formDescription?.trim()
  const resolvedActions = resolveCmsActions(actions)
  const defaultSubjectLabel = subjectField.options?.[0]?.value ?? ''

  const [values, setValues] = useState<ReviewSubmissionValues>(() => ({
    ...initialValues,
    subjectLabel: defaultSubjectLabel,
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<'default' | 'destructive'>('default')
  const [hoveredRating, setHoveredRating] = useState<string | null>(null)

  const updateValue = <K extends keyof ReviewSubmissionValues>(
    key: K,
    nextValue: ReviewSubmissionValues[K],
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: nextValue,
    }))
    setErrors((currentErrors) => {
      if (!(key in currentErrors)) {
        return currentErrors
      }

      const nextErrors = { ...currentErrors }
      delete nextErrors[key]
      return nextErrors
    })
    if (key === 'rating') {
      setHoveredRating(null)
    }
    setMessage(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formSlug || isPending) {
      return
    }

    setIsPending(true)
    setErrors({})
    setMessage(null)

    try {
      const response = await fetch(`/api/forms/${formSlug}/submit`, {
        body: JSON.stringify({
          metadata: getSubmissionMetadata(),
          values: {
            ...values,
            [FORM_HONEYPOT_FIELD_NAME]: '',
            isGenuineExperience: true,
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const payload = (await response.json()) as {
        errors?: Record<string, string>
        message?: string
      }

      if (!response.ok) {
        setErrors(payload.errors ?? {})
        setMessage(payload.message || 'Please correct the highlighted fields and try again.')
        setMessageTone('destructive')
        return
      }

      setValues({
        ...initialValues,
        subjectLabel: defaultSubjectLabel,
      })
      setErrors({})
      setMessage(
        payload.message ||
          formRecord?.successMessage?.trim() ||
          'Thanks. Your review has been received.',
      )
      setMessageTone('default')
    } catch {
      setMessage('Something went wrong while sending your review. Please try again.')
      setMessageTone('destructive')
    } finally {
      setIsPending(false)
    }
  }

  const activeRating = hoveredRating ?? values.rating
  const activeRatingTone = ratingToneByValue[activeRating]
  const activeRatingLabel = activeRatingTone?.label ?? ''
  const activeRatingToneClass = activeRatingTone?.className ?? 'text-current/70'
  const bodyCharacterCount = values.reviewBody.length

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[resolvedSize], appearanceClasses.className)}
      data-review-submission-background={appearance?.background ?? 'none'}
      data-review-submission-size={resolvedSize}
    >
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-8 px-4 md:gap-10">
        <div
          className={cn(
            'flex w-full max-w-3xl flex-col gap-4',
            contentAlignmentClasses[resolvedContentAlignment],
          )}
          data-review-submission-content-alignment={resolvedContentAlignment}
        >
          {resolvedEyebrow ? (
            <SectionEyebrow surface={appearance?.background ?? 'none'}>
              {resolvedEyebrow}
            </SectionEyebrow>
          ) : null}
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl">
            {resolvedTitle}
          </h2>
          {resolvedDescription ? (
            <p className="max-w-2xl text-balance text-base leading-7 text-current/70">
              {resolvedDescription}
            </p>
          ) : null}
          <ContentActions
            actions={resolvedActions}
            alignment={resolvedContentAlignment}
            data-review-submission-actions="true"
          />
        </div>

        <div
          className={cn(
            '@container/form-panel w-full rounded-card border border-border bg-transparent shadow-none',
            formPanelPaddingClasses[resolvedSize],
          )}
        >
          {isFormAvailable ? (
            <form
              className="flex w-full flex-col gap-7"
              suppressHydrationWarning
              onSubmit={handleSubmit}
            >
              <FieldGroup className="gap-6">
                <FieldGroup className="gap-6 @lg/form-panel:grid @lg/form-panel:grid-cols-2 @lg/form-panel:items-start">
                  <FieldSet className="gap-3">
                    <FieldLegend className="mb-2 text-left text-sm font-medium text-current">
                      {ratingField.label}
                      {activeRatingLabel ? (
                        <span className={cn('font-normal', activeRatingToneClass)}>
                          {' - '} {activeRatingLabel}
                        </span>
                      ) : null}
                    </FieldLegend>
                    <Field data-invalid={Boolean(errors.rating) || undefined}>
                      <RadioGroup
                        aria-invalid={Boolean(errors.rating) || undefined}
                        className="flex w-fit items-center gap-0"
                        id="review-rating"
                        required={ratingField.required}
                        value={values.rating}
                        onMouseLeave={() => setHoveredRating(null)}
                        onValueChange={(nextValue) => updateValue('rating', nextValue)}
                      >
                        {(ratingField.options ?? reviewRatingOptions).map((option) => {
                          const optionValue = Number(option.value)
                          const activeValue = Number((hoveredRating ?? values.rating) || '0')
                          const isFilled = activeValue >= optionValue
                          const ratingLabel = ratingToneByValue[option.value]?.label ?? option.label

                          return (
                            <RadioGroupItem
                              aria-label={`${option.label} star${option.label === '1' ? '' : 's'} - ${ratingLabel}`}
                              className={cn(
                                'size-auto rounded-none border-0 bg-transparent px-1.5 py-1 text-current/70 shadow-none after:hidden focus-visible:border-0 focus-visible:ring-0 data-checked:bg-transparent [&_svg]:size-8 sm:[&_svg]:size-9',
                                '**:data-[slot=radio-group-indicator]:hidden',
                              )}
                              key={option.value}
                              value={option.value}
                              onBlur={() => setHoveredRating(null)}
                              onFocus={() => setHoveredRating(option.value)}
                              onMouseEnter={() => setHoveredRating(option.value)}
                            >
                              <Star
                                aria-hidden="true"
                                className={cn(
                                  'transition-colors',
                                  isFilled
                                    ? cn('fill-current', activeRatingToneClass)
                                    : 'fill-transparent text-current/60 group-hover/radio-group-item:text-current/80',
                                )}
                              />
                            </RadioGroupItem>
                          )
                        })}
                      </RadioGroup>
                      <FieldError>{errors.rating}</FieldError>
                    </Field>
                  </FieldSet>

                  {subjectField.options?.length ? (
                    <FieldSet className="gap-3">
                      <FieldLegend className="mb-2 text-left text-sm font-medium text-current">
                        {subjectField.label}
                      </FieldLegend>
                      <Field data-invalid={Boolean(errors.subjectLabel) || undefined}>
                        <ToggleGroup
                          aria-invalid={Boolean(errors.subjectLabel) || undefined}
                          className="flex w-full flex-wrap justify-start"
                          size="sm"
                          type="single"
                          value={values.subjectLabel}
                          variant="outline"
                          onValueChange={(nextValue) => {
                            if (nextValue) {
                              updateValue('subjectLabel', nextValue)
                            }
                          }}
                        >
                          {subjectField.options.map((option) => (
                            <ToggleGroupItem
                              className="rounded-control px-4 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                        <FieldError>{errors.subjectLabel}</FieldError>
                      </Field>
                    </FieldSet>
                  ) : null}
                </FieldGroup>

                <FieldGroup className="gap-4 @md/form-panel:grid @md/form-panel:grid-cols-2">
                  <Field
                    className="gap-2.5"
                    data-invalid={Boolean(errors.reviewerName) || undefined}
                  >
                    <FieldLabel className="text-sm font-medium" htmlFor="reviewer-name">
                      {nameField.label}
                    </FieldLabel>
                    <Input
                      aria-invalid={Boolean(errors.reviewerName) || undefined}
                      className="h-11 rounded-control"
                      id="reviewer-name"
                      placeholder={nameField.placeholder}
                      required={nameField.required}
                      suppressHydrationWarning
                      type="text"
                      value={values.reviewerName}
                      onChange={(event) => updateValue('reviewerName', event.target.value)}
                    />
                    <FieldError>{errors.reviewerName}</FieldError>
                  </Field>

                  <Field
                    className="gap-2.5"
                    data-invalid={Boolean(errors.reviewerEmail) || undefined}
                  >
                    <FieldLabel className="text-sm font-medium" htmlFor="reviewer-email">
                      {emailField.label}
                      {!emailField.required ? (
                        <span className="font-normal text-current/70">(optional)</span>
                      ) : null}
                    </FieldLabel>
                    <Input
                      aria-invalid={Boolean(errors.reviewerEmail) || undefined}
                      className="h-11 rounded-control"
                      id="reviewer-email"
                      placeholder={emailField.placeholder}
                      required={emailField.required}
                      suppressHydrationWarning
                      type="email"
                      value={values.reviewerEmail}
                      onChange={(event) => updateValue('reviewerEmail', event.target.value)}
                    />
                    <FieldError>{errors.reviewerEmail}</FieldError>
                  </Field>
                </FieldGroup>

                <Field className="gap-2.5" data-invalid={Boolean(errors.reviewBody) || undefined}>
                  <FieldLabel className="text-sm font-medium" htmlFor="review-body">
                    {bodyField.label}
                  </FieldLabel>
                  <Textarea
                    aria-invalid={Boolean(errors.reviewBody) || undefined}
                    className="min-h-32 rounded-control"
                    id="review-body"
                    maxLength={1000}
                    placeholder={bodyField.placeholder}
                    required={bodyField.required}
                    rows={6}
                    suppressHydrationWarning
                    value={values.reviewBody}
                    onChange={(event) => updateValue('reviewBody', event.target.value)}
                  />
                  <div className="flex items-start justify-between gap-4">
                    {bodyField.description ? (
                      <FieldDescription>{bodyField.description}</FieldDescription>
                    ) : (
                      <span aria-hidden="true" />
                    )}
                    <p className="shrink-0 text-sm text-current/70">
                      {bodyCharacterCount}/1000
                    </p>
                  </div>
                  <FieldError>{errors.reviewBody}</FieldError>
                </Field>
              </FieldGroup>

              <input
                aria-hidden="true"
                autoComplete="off"
                className="hidden"
                name={FORM_HONEYPOT_FIELD_NAME}
                suppressHydrationWarning
                tabIndex={-1}
                type="text"
                value=""
                readOnly
              />

              {message ? (
                <p
                  className={cn(
                    'text-sm leading-6',
                    messageTone === 'destructive' ? 'text-destructive' : 'text-current/70',
                  )}
                >
                  {message}
                </p>
              ) : null}

              <Button className="self-end" disabled={isPending} size="lg" type="submit">
                {isPending ? 'Sending…' : submitLabel}
              </Button>
            </form>
          ) : (
            <p className="text-sm leading-6 text-current/70">
              This review form is currently unavailable.
            </p>
          )}
        </div>
        <BlockFooterActions actions={footerActions} />
      </div>
    </section>
  )
}
