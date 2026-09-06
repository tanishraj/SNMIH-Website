'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
import { Button } from '@/components/ui/button'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  getContact33FieldDefinitions,
  type Contact33FieldDefinition,
  type Contact33FieldDefinitions,
  type Contact33FormLike,
} from '@/lib/contact33Form'
import {
  FORM_HONEYPOT_FIELD_NAME,
  FORM_PHONE_MAX_INPUT_LENGTH,
  isValidPhoneNumber,
  sanitizePhoneNumberInput,
} from '@/lib/forms'
import { cn } from '@/lib/utils'

type Contact33Size = 'none' | 'comfortable' | 'compact' | 'default'
type Contact33Alignment = 'center' | 'left' | 'right'
type Contact33ImagePosition = 'left' | 'right'

type ContactFormValues = {
  email: string
  message: string
  name: string
  phone: string
  subject: string
}

export type Contact33Image = {
  alt: string
  height?: number
  src: string
  width?: number
}

export type Contact33Props = {
  actions?: React.ReactNode
  appearance?: BlockAppearance | null
  className?: string
  contentAlignment?: Contact33Alignment
  description?: string | null
  eyebrow?: string | null
  form?: Contact33FormLike | null
  image: Contact33Image
  imagePosition?: Contact33ImagePosition
  size?: Contact33Size
  title?: string | null
}

const initialValues: ContactFormValues = {
  email: '',
  message: '',
  name: '',
  phone: '',
  subject: '',
}

const sectionGapClasses = {
  none: 'gap-10 lg:gap-14',
  compact: 'gap-8 lg:gap-12',
  default: 'gap-10 lg:gap-14',
  comfortable: 'gap-12 lg:gap-16',
} as const

const contentGapClasses = {
  none: 'gap-8',
  compact: 'gap-7',
  default: 'gap-8',
  comfortable: 'gap-10',
} as const

const headingGapClasses = {
  none: 'gap-4',
  compact: 'gap-3',
  default: 'gap-4',
  comfortable: 'gap-5',
} as const

const formGapClasses = {
  none: 'gap-6',
  compact: 'gap-5',
  default: 'gap-6',
  comfortable: 'gap-7',
} as const

const alignmentClasses = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
} as const

const actionAlignmentClasses = {
  left: 'self-start',
  center: 'self-center',
  right: 'self-end',
} as const

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function createTextSchema(field: Contact33FieldDefinition) {
  return z
    .string()
    .trim()
    .refine((value) => !field.required || value.length > 0, {
      message: `${field.label} is required.`,
    })
}

function createContactFormSchema(fields: Contact33FieldDefinitions) {
  return z.object({
    email: createTextSchema(fields.email).refine(
      (value) => value.length === 0 || emailPattern.test(value),
      {
        message: `${fields.email.label} must be a valid email address.`,
      },
    ),
    message: createTextSchema(fields.message),
    name: createTextSchema(fields.name),
    phone: fields.phone
      ? createTextSchema(fields.phone).refine(
          (value) => value.length === 0 || isValidPhoneNumber(value),
          {
            message: `${fields.phone.label} must be a valid phone number.`,
          },
        )
      : z.string(),
    subject: createTextSchema(fields.subject),
  })
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

export function Contact33({
  actions,
  appearance,
  className,
  contentAlignment = 'left',
  description,
  eyebrow,
  form,
  image,
  imagePosition = 'right',
  size = 'default',
  title,
}: Contact33Props) {
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const fieldDefinitions = useMemo(() => getContact33FieldDefinitions(form), [form])
  const formSchema = useMemo(() => createContactFormSchema(fieldDefinitions), [fieldDefinitions])
  const formApi = useForm<ContactFormValues>({
    defaultValues: initialValues,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(formSchema),
  })
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<'default' | 'destructive'>('default')
  const formSlug = form?.slug?.trim()
  const isFormAvailable = Boolean(formSlug)
  const submitLabel = form?.submitButtonLabel?.trim() || 'Send message'

  const clearMessage = () => {
    if (message) {
      setMessage(null)
    }
  }

  const handleFormSubmit = async (values: ContactFormValues) => {
    if (!formSlug) {
      return
    }

    setMessage(null)
    const { phone, ...requiredValues } = values
    const submissionValues = fieldDefinitions.phone ? { ...requiredValues, phone } : requiredValues

    try {
      const response = await fetch(`/api/forms/${formSlug}/submit`, {
        body: JSON.stringify({
          metadata: getSubmissionMetadata(),
          values: {
            ...submissionValues,
            [FORM_HONEYPOT_FIELD_NAME]: '',
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const responsePayload = (await response.json()) as {
        errors?: Record<string, string>
        message?: string
      }

      if (!response.ok) {
        Object.entries(responsePayload.errors ?? {}).forEach(([name, fieldMessage]) => {
          if (
            name === 'name' ||
            name === 'email' ||
            name === 'phone' ||
            name === 'subject' ||
            name === 'message'
          ) {
            formApi.setError(name, {
              message: fieldMessage,
              type: 'server',
            })
          }
        })
        setMessage(
          responsePayload.message || 'Please correct the highlighted fields and try again.',
        )
        setMessageTone('destructive')
        return
      }

      formApi.reset(initialValues)
      setMessage(
        responsePayload.message ||
          form?.successMessage?.trim() ||
          'Thanks. Your message was received.',
      )
      setMessageTone('default')
    } catch {
      setMessage('Something went wrong while sending your message. Please try again.')
      setMessageTone('destructive')
    }
  }

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size], appearanceClasses.className, className)}
      data-contact33-background={appearance?.background ?? 'none'}
      data-contact33-size={size}
    >
      <div className={regularBlockContainerClasses}>
        <div
          className={cn('grid items-stretch lg:grid-cols-2', sectionGapClasses[size])}
          data-contact33-image-position={imagePosition}
        >
          <div className={cn('flex min-w-0 flex-col', contentGapClasses[size])}>
            <div
              className={cn(
                'flex flex-col',
                headingGapClasses[size],
                alignmentClasses[contentAlignment],
              )}
              data-contact33-content-alignment={contentAlignment}
            >
              {eyebrow ? (
                <SectionEyebrow surface={appearance?.background ?? 'none'}>
                  {eyebrow}
                </SectionEyebrow>
              ) : null}
              <h2 className="text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl">
                {title}
              </h2>
              {description ? (
                <p className="max-w-2xl text-base leading-7 text-current/70">{description}</p>
              ) : null}
              {actions ? <div className="mt-2">{actions}</div> : null}
            </div>

            {isFormAvailable ? (
              <form
                aria-label="Contact form"
                className="flex w-full flex-col gap-7 text-left"
                suppressHydrationWarning
                onSubmit={formApi.handleSubmit(handleFormSubmit)}
              >
                <FieldGroup className={formGapClasses[size]}>
                  <FieldGroup className="grid gap-4 sm:grid-cols-2">
                    <Controller
                      control={formApi.control}
                      name="name"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid || undefined}>
                          <FieldLabel htmlFor="contact33-name">
                            {fieldDefinitions.name.label}
                            {fieldDefinitions.name.required ? (
                              <span aria-hidden="true" className="text-destructive">
                                *
                              </span>
                            ) : null}
                          </FieldLabel>
                          <Input
                            {...field}
                            aria-invalid={fieldState.invalid || undefined}
                            className="h-11 rounded-control"
                            id="contact33-name"
                            placeholder={fieldDefinitions.name.placeholder}
                            required={fieldDefinitions.name.required}
                            suppressHydrationWarning
                            onChange={(event) => {
                              field.onChange(event)
                              clearMessage()
                            }}
                          />
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />

                    <Controller
                      control={formApi.control}
                      name="email"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid || undefined}>
                          <FieldLabel htmlFor="contact33-email">
                            {fieldDefinitions.email.label}
                            {fieldDefinitions.email.required ? (
                              <span aria-hidden="true" className="text-destructive">
                                *
                              </span>
                            ) : null}
                          </FieldLabel>
                          <Input
                            {...field}
                            aria-invalid={fieldState.invalid || undefined}
                            className="h-11 rounded-control"
                            id="contact33-email"
                            placeholder={fieldDefinitions.email.placeholder}
                            required={fieldDefinitions.email.required}
                            suppressHydrationWarning
                            type="email"
                            onChange={(event) => {
                              field.onChange(event)
                              clearMessage()
                            }}
                          />
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  <FieldGroup
                    className={cn('grid gap-4', fieldDefinitions.phone && 'sm:grid-cols-2')}
                    data-contact33-secondary-row={
                      fieldDefinitions.phone ? 'phone-subject' : 'subject-only'
                    }
                  >
                    {fieldDefinitions.phone ? (
                      <Controller
                        control={formApi.control}
                        name="phone"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldLabel htmlFor="contact33-phone">
                              {fieldDefinitions.phone?.label}
                              {fieldDefinitions.phone?.required ? (
                                <span aria-hidden="true" className="text-destructive">
                                  *
                                </span>
                              ) : null}
                            </FieldLabel>
                            <Input
                              {...field}
                              aria-invalid={fieldState.invalid || undefined}
                              autoComplete="tel"
                              className="h-11 rounded-control"
                              id="contact33-phone"
                              inputMode="tel"
                              maxLength={FORM_PHONE_MAX_INPUT_LENGTH}
                              placeholder={fieldDefinitions.phone?.placeholder}
                              required={fieldDefinitions.phone?.required}
                              suppressHydrationWarning
                              type="tel"
                              onChange={(event) => {
                                field.onChange(sanitizePhoneNumberInput(event.target.value))
                                clearMessage()
                              }}
                            />
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )}
                      />
                    ) : null}

                    <Controller
                      control={formApi.control}
                      name="subject"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid || undefined}>
                          <FieldLabel htmlFor="contact33-subject">
                            {fieldDefinitions.subject.label}
                            {fieldDefinitions.subject.required ? (
                              <span aria-hidden="true" className="text-destructive">
                                *
                              </span>
                            ) : null}
                          </FieldLabel>
                          <Select
                            value={field.value}
                            onValueChange={(nextValue) => {
                              field.onChange(nextValue)
                              clearMessage()
                            }}
                          >
                            <SelectTrigger
                              aria-invalid={fieldState.invalid || undefined}
                              className="data-[size=default]:h-11 w-full rounded-control"
                              id="contact33-subject"
                            >
                              <SelectValue
                                placeholder={
                                  fieldDefinitions.subject.placeholder || 'What can we help with?'
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {(fieldDefinitions.subject.options ?? []).map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  <Controller
                    control={formApi.control}
                    name="message"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <FieldLabel htmlFor="contact33-message">
                          {fieldDefinitions.message.label}
                          {fieldDefinitions.message.required ? (
                            <span aria-hidden="true" className="text-destructive">
                              *
                            </span>
                          ) : null}
                        </FieldLabel>
                        <Textarea
                          {...field}
                          aria-invalid={fieldState.invalid || undefined}
                          className="min-h-32 rounded-control"
                          id="contact33-message"
                          placeholder={fieldDefinitions.message.placeholder}
                          required={fieldDefinitions.message.required}
                          rows={6}
                          suppressHydrationWarning
                          onChange={(event) => {
                            field.onChange(event)
                            clearMessage()
                          }}
                        />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
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
                      'rounded-card border border-current/20 bg-current/5 p-4 text-sm leading-6',
                      messageTone === 'destructive' && 'text-destructive',
                    )}
                    role={messageTone === 'destructive' ? 'alert' : 'status'}
                  >
                    {message}
                  </p>
                ) : null}

                <Button
                  className={cn('w-full sm:w-auto', actionAlignmentClasses[contentAlignment])}
                  disabled={formApi.formState.isSubmitting}
                  size="lg"
                  type="submit"
                >
                  {formApi.formState.isSubmitting ? (
                    <>
                      <LoaderCircle
                        aria-hidden="true"
                        className="animate-spin"
                        data-icon="inline-start"
                      />
                      Sending…
                    </>
                  ) : (
                    submitLabel
                  )}
                </Button>
              </form>
            ) : (
              <p className="text-sm leading-6 text-current/70">
                This contact form is currently unavailable.
              </p>
            )}
          </div>

          <div
            className={cn(
              'relative min-h-72 overflow-hidden rounded-card lg:min-h-168',
              imagePosition === 'left' && 'lg:order-first',
            )}
          >
            <Image
              alt={image.alt}
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              src={image.src}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
