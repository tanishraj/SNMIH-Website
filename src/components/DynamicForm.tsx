'use client'

import { LoaderCircle, Paperclip, X } from 'lucide-react'
import { useId, useRef, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
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
  describeFormFileRules,
  FORM_HONEYPOT_FIELD_NAME,
  FORM_PHONE_MAX_INPUT_LENGTH,
  formatFileSize,
  getFormFileAcceptAttribute,
  isShortFormFieldType,
  sanitizePhoneNumberInput,
  validateFormSubmission,
  type SimpleFormField,
} from '@/lib/forms'
import type { Form } from '@/payload-types'
import { cn } from '@/lib/utils'

export type DynamicFormLike = Pick<
  Form,
  'fields' | 'slug' | 'submitButtonLabel' | 'successMessage' | 'title'
>

type FieldValue = boolean | File | string | null

const toSimpleFields = (form: DynamicFormLike): SimpleFormField[] =>
  (form.fields ?? []).map((field) => ({
    fileTypes: field.fileTypes ?? null,
    label: field.label,
    maxFileSizeMB: field.maxFileSizeMB ?? null,
    name: field.name,
    options: field.options?.map((option) => ({ label: option.label, value: option.value })) ?? null,
    placeholder: field.placeholder ?? null,
    required: field.required ?? false,
    type: field.type,
  }))

const initialValues = (fields: SimpleFormField[]): Record<string, FieldValue> =>
  Object.fromEntries(
    fields.map((field) => [
      field.name,
      field.type === 'checkbox' ? false : field.type === 'file' ? null : '',
    ]),
  )

/** What validation sees: a File becomes its name/size/type, everything else passes through. */
const toValidationValues = (values: Record<string, FieldValue>) =>
  Object.fromEntries(
    Object.entries(values).map(([name, value]) => [
      name,
      value instanceof File ? { name: value.name, size: value.size, type: value.type } : value,
    ]),
  )

function getSubmissionMetadata() {
  if (typeof window === 'undefined') return {}
  const url = new URL(window.location.href)
  let source = url.searchParams.get('utm_source') || undefined
  if (!source && document.referrer) {
    try {
      source = new URL(document.referrer).hostname || undefined
    } catch {
      source = undefined
    }
  }
  return {
    campaign: url.searchParams.get('utm_campaign') || undefined,
    landingPage: `${url.pathname}${url.search}`,
    source,
  }
}

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      *
    </span>
  )
}

function FileInput({
  describedBy,
  field,
  id,
  invalid,
  onChange,
  value,
}: {
  describedBy: string
  field: SimpleFormField
  id: string
  invalid: boolean
  onChange: (file: File | null) => void
  value: File | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-2">
      <input
        accept={getFormFileAcceptAttribute(field)}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        className="sr-only"
        id={id}
        name={field.name}
        ref={inputRef}
        type="file"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      {value ? (
        <div
          className="flex items-center gap-3 rounded-control border border-input bg-input/20 px-3.5 py-2.5 text-sm"
          data-dynamic-form-file="selected"
        >
          <Paperclip aria-hidden="true" className="size-4 shrink-0 text-current/60" />
          <span className="min-w-0 flex-1 truncate font-medium">{value.name}</span>
          <span className="shrink-0 text-xs text-current/60">{formatFileSize(value.size)}</span>
          <button
            aria-label={`Remove ${value.name}`}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-current/60 transition-colors hover:bg-current/10 hover:text-current"
            type="button"
            onClick={() => {
              if (inputRef.current) inputRef.current.value = ''
              onChange(null)
            }}
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      ) : (
        <Button
          className="h-11 w-full justify-start rounded-control border-dashed font-normal text-current/80 sm:w-auto"
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip aria-hidden="true" data-icon="inline-start" />
          Choose a file
        </Button>
      )}
    </div>
  )
}

export function DynamicForm({ className, form }: { className?: string; form: DynamicFormLike }) {
  const baseId = useId()
  const fields = toSimpleFields(form)
  const hasFiles = fields.some((field) => field.type === 'file')
  const [values, setValues] = useState<Record<string, FieldValue>>(() => initialValues(fields))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<'default' | 'destructive'>('default')
  const [submitting, setSubmitting] = useState(false)
  const formSlug = form.slug?.trim()
  const idFor = (name: string) => `${baseId}-${name}`

  const setValue = (name: string, value: FieldValue) => {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      if (!(name in current)) return current
      const { [name]: _removed, ...rest } = current
      return rest
    })
    if (message) setMessage(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formSlug || submitting) return

    const validation = validateFormSubmission({ fields, values: toValidationValues(values) })
    if (Object.keys(validation.errors).length > 0) {
      setErrors(validation.errors)
      setMessage('Please correct the highlighted fields and try again.')
      setMessageTone('destructive')
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      let response: Response
      if (hasFiles) {
        const body = new FormData()
        for (const field of fields) {
          const value = values[field.name]
          if (value instanceof File) body.append(field.name, value, value.name)
          else if (typeof value === 'boolean') body.append(field.name, value ? 'true' : '')
          else body.append(field.name, value ?? '')
        }
        body.append(FORM_HONEYPOT_FIELD_NAME, '')
        body.append('metadata', JSON.stringify(getSubmissionMetadata()))
        response = await fetch(`/api/forms/${formSlug}/submit`, { body, method: 'POST' })
      } else {
        response = await fetch(`/api/forms/${formSlug}/submit`, {
          body: JSON.stringify({
            metadata: getSubmissionMetadata(),
            values: { ...values, [FORM_HONEYPOT_FIELD_NAME]: '' },
          }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
      }

      const payload = (await response.json().catch(() => ({}))) as {
        errors?: Record<string, string>
        message?: string
      }

      if (!response.ok) {
        setErrors(payload.errors ?? {})
        setMessage(payload.message || 'Please correct the highlighted fields and try again.')
        setMessageTone('destructive')
        return
      }

      setValues(initialValues(fields))
      setErrors({})
      setMessage(
        payload.message ||
          form.successMessage?.trim() ||
          'Thanks. Your submission has been received.',
      )
      setMessageTone('default')
      event.currentTarget?.reset?.()
    } catch {
      setMessage('Something went wrong while sending your details. Please try again.')
      setMessageTone('destructive')
    } finally {
      setSubmitting(false)
    }
  }

  if (!formSlug) {
    return <p className="text-sm leading-6 text-current/70">This form is currently unavailable.</p>
  }

  return (
    <form
      aria-label={form.title}
      className={cn('flex w-full flex-col gap-7 text-left', className)}
      data-dynamic-form={formSlug}
      encType={hasFiles ? 'multipart/form-data' : undefined}
      noValidate
      suppressHydrationWarning
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => {
          const id = idFor(field.name)
          const hintId = `${id}-hint`
          const error = errors[field.name]
          const invalid = Boolean(error)
          const value = values[field.name]
          const label = (
            <FieldLabel htmlFor={id}>
              {field.label}
              {field.required ? <RequiredMark /> : null}
            </FieldLabel>
          )
          const common = {
            'aria-invalid': invalid || undefined,
            id,
            name: field.name,
            required: Boolean(field.required),
            suppressHydrationWarning: true,
          }

          return (
            <Field
              className={isShortFormFieldType(field.type) ? 'sm:col-span-1' : 'sm:col-span-2'}
              data-dynamic-form-field={field.type}
              data-invalid={invalid || undefined}
              key={field.name}
            >
              {field.type === 'checkbox' ? (
                <label className="flex items-start gap-3 text-sm leading-6" htmlFor={id}>
                  <Checkbox
                    {...common}
                    checked={value === true}
                    className="mt-1"
                    onCheckedChange={(checked) => setValue(field.name, checked === true)}
                  />
                  <span>
                    {field.label}
                    {field.required ? <RequiredMark /> : null}
                  </span>
                </label>
              ) : field.type === 'file' ? (
                <>
                  {label}
                  <FileInput
                    describedBy={hintId}
                    field={field}
                    id={id}
                    invalid={invalid}
                    value={value instanceof File ? value : null}
                    onChange={(file) => setValue(field.name, file)}
                  />
                  <FieldDescription id={hintId}>{describeFormFileRules(field)}</FieldDescription>
                </>
              ) : field.type === 'select' ? (
                <>
                  {label}
                  <Select
                    value={typeof value === 'string' ? value : ''}
                    onValueChange={(next) => setValue(field.name, next)}
                  >
                    <SelectTrigger
                      aria-invalid={invalid || undefined}
                      className="data-[size=default]:h-11 w-full rounded-control"
                      id={id}
                    >
                      <SelectValue placeholder={field.placeholder || 'Select an option'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {(field.options ?? []).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </>
              ) : field.type === 'textarea' ? (
                <>
                  {label}
                  <Textarea
                    {...common}
                    className="min-h-32 rounded-control"
                    placeholder={field.placeholder ?? undefined}
                    rows={6}
                    value={typeof value === 'string' ? value : ''}
                    onChange={(event) => setValue(field.name, event.target.value)}
                  />
                </>
              ) : (
                <>
                  {label}
                  <Input
                    {...common}
                    autoComplete={
                      field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : undefined
                    }
                    className="h-11 rounded-control"
                    inputMode={field.type === 'phone' ? 'tel' : undefined}
                    maxLength={field.type === 'phone' ? FORM_PHONE_MAX_INPUT_LENGTH : undefined}
                    placeholder={field.placeholder ?? undefined}
                    type={
                      field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'
                    }
                    value={typeof value === 'string' ? value : ''}
                    onChange={(event) =>
                      setValue(
                        field.name,
                        field.type === 'phone'
                          ? sanitizePhoneNumberInput(event.target.value)
                          : event.target.value,
                      )
                    }
                  />
                </>
              )}
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
          )
        })}
      </div>

      <input
        aria-hidden="true"
        autoComplete="off"
        className="hidden"
        name={FORM_HONEYPOT_FIELD_NAME}
        readOnly
        suppressHydrationWarning
        tabIndex={-1}
        type="text"
        value=""
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
        className="w-full sm:w-auto sm:self-start"
        disabled={submitting}
        size="lg"
        type="submit"
      >
        {submitting ? (
          <>
            <LoaderCircle aria-hidden="true" className="animate-spin" data-icon="inline-start" />
            Sending…
          </>
        ) : (
          form.submitButtonLabel?.trim() || 'Submit'
        )}
      </Button>
    </form>
  )
}
