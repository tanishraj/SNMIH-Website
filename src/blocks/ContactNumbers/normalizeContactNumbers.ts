export const contactDayValues = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export type ContactDay = (typeof contactDayValues)[number]

export type ContactNumbersLayout = 'callDesk' | 'deskCards' | 'directory' | 'ribbon' | 'switchboard'

export type ContactInput = {
  desk?: string | null
  email?: string | null
  group?: string | null
  hours?: {
    closes?: string | null
    days?: (string | null)[] | null
    opens?: string | null
    summary?: string | null
  } | null
  id?: string | null
  label?: string | null
  phone?: string | null
  whatsapp?: boolean | null
}

export type ContactSchedule = {
  closesMinutes: number
  days: ContactDay[]
  opensMinutes: number
}

export type ContactNumber = {
  desk?: string
  email?: string
  group?: string
  hoursText?: string
  key: string
  label?: string
  phone: string
  schedule?: ContactSchedule
  telHref: string
  whatsappHref?: string
}

const dayShortLabels: Record<ContactDay, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
}

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/

export const isValidContactTime = (value: unknown): value is string =>
  typeof value === 'string' && timePattern.test(value.trim())

const toMinutes = (value: string) => {
  const [hours, minutes] = value.trim().split(':').map(Number)
  return hours! * 60 + minutes!
}

export const formatContactTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 === 0 ? 12 : hours % 12

  return `${displayHour}:${String(mins).padStart(2, '0')} ${suffix}`
}

/** Collapses consecutive days into ranges, e.g. Mon–Sat or Mon, Wed, Fri. */
export const formatContactDays = (days: readonly ContactDay[]) => {
  const indexes = contactDayValues
    .map((day, index) => (days.includes(day) ? index : -1))
    .filter((index) => index >= 0)
  const ranges: string[] = []
  let start = indexes[0]

  for (let i = 0; i < indexes.length; i += 1) {
    const current = indexes[i]!
    const next = indexes[i + 1]
    if (next === current + 1) continue

    const startLabel = dayShortLabels[contactDayValues[start!]!]
    const endLabel = dayShortLabels[contactDayValues[current]!]
    ranges.push(
      start === current
        ? startLabel
        : current - start! === 1
          ? `${startLabel}, ${endLabel}`
          : `${startLabel}–${endLabel}`,
    )
    start = next
  }

  return ranges.join(', ')
}

/** Keeps "+" and digits so the dialler receives a clean international number. */
export const toTelHref = (phone: string) => {
  const digits = phone.replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : undefined
}

export const toWhatsAppHref = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : undefined
}

const normalizeSchedule = (hours: ContactInput['hours']): ContactSchedule | undefined => {
  const days = (hours?.days ?? []).filter((day): day is ContactDay =>
    contactDayValues.includes(day as ContactDay),
  )
  if (days.length === 0 || !isValidContactTime(hours?.opens) || !isValidContactTime(hours?.closes))
    return undefined

  const opensMinutes = toMinutes(hours.opens)
  const closesMinutes = toMinutes(hours.closes)
  if (closesMinutes <= opensMinutes) return undefined

  return { closesMinutes, days, opensMinutes }
}

export const normalizeContacts = (contacts?: ContactInput[] | null): ContactNumber[] =>
  (contacts ?? []).flatMap((contact, index) => {
    const phone = contact.phone?.trim()
    const telHref = phone ? toTelHref(phone) : undefined
    if (!phone || !telHref) return []

    const schedule = normalizeSchedule(contact.hours)
    const hoursText =
      contact.hours?.summary?.trim() ||
      (schedule
        ? `${formatContactDays(schedule.days)} · ${formatContactTime(schedule.opensMinutes)} – ${formatContactTime(schedule.closesMinutes)}`
        : undefined)

    return [
      {
        desk: contact.desk?.trim() || undefined,
        email: contact.email?.trim() || undefined,
        group: contact.group?.trim() || undefined,
        hoursText,
        key: contact.id?.trim() || `contact-${index}`,
        label: contact.label?.trim() || undefined,
        phone,
        schedule,
        telHref,
        whatsappHref: contact.whatsapp ? toWhatsAppHref(phone) : undefined,
      },
    ]
  })

const weekdayIndex: Record<string, ContactDay> = {
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat',
  Sun: 'sun',
}

/** Reads the weekday and minutes since midnight for `now` in the given IANA timezone. */
export const getZonedWeekMinute = (now: Date, timeZone: string) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      hourCycle: 'h23',
      minute: '2-digit',
      timeZone,
      weekday: 'short',
    })
      .formatToParts(now)
      .map(({ type, value }) => [type, value]),
  )

  return {
    day: weekdayIndex[parts.weekday ?? ''] ?? 'mon',
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  }
}

export const isContactOpen = (schedule: ContactSchedule, now: Date, timeZone: string) => {
  const { day, minutes } = getZonedWeekMinute(now, timeZone)

  return (
    schedule.days.includes(day) &&
    minutes >= schedule.opensMinutes &&
    minutes < schedule.closesMinutes
  )
}

/** Groups contacts for the directory in first-seen order; ungrouped contacts share one tab. */
export const groupContacts = (contacts: readonly ContactNumber[], fallbackLabel = 'Contacts') => {
  const groups = new Map<string, ContactNumber[]>()

  for (const contact of contacts) {
    const name = contact.group ?? fallbackLabel
    groups.set(name, [...(groups.get(name) ?? []), contact])
  }

  return [...groups].map(([name, items]) => ({ items, name }))
}
