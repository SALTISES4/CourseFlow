export type DurationMinutes = number | null | undefined

export type DurationParts = {
  hours: string
  minutes: string
}

export type ParsedDurationParts =
  | { valid: true; value: number | null }
  | { valid: false; value: null; field: 'hours' | 'minutes' }

export type ParsedWholeHours =
  | { valid: true; value: number | null }
  | { valid: false; value: null }

const assertCanonicalMinutes = (value: number): void => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(
      'Duration must be a non-negative safe integer of minutes'
    )
  }
}

export const durationPartsFromMinutes = (
  value: DurationMinutes
): DurationParts => {
  if (value == null) {
    return { hours: '', minutes: '' }
  }
  assertCanonicalMinutes(value)
  return {
    hours: String(Math.floor(value / 60)),
    minutes: String(value % 60)
  }
}

export const parseDurationParts = (
  hoursText: string,
  minutesText: string
): ParsedDurationParts => {
  const hoursDraft = hoursText.trim()
  const minutesDraft = minutesText.trim()
  if (hoursDraft === '' && minutesDraft === '') {
    return { valid: true, value: null }
  }
  if (hoursDraft !== '' && !/^\d+$/.test(hoursDraft)) {
    return { valid: false, value: null, field: 'hours' }
  }
  if (minutesDraft !== '' && !/^\d+$/.test(minutesDraft)) {
    return { valid: false, value: null, field: 'minutes' }
  }

  const hours = hoursDraft === '' ? 0 : Number(hoursDraft)
  const minutes = minutesDraft === '' ? 0 : Number(minutesDraft)
  if (!Number.isSafeInteger(hours) || hours < 0) {
    return { valid: false, value: null, field: 'hours' }
  }
  if (!Number.isSafeInteger(minutes) || minutes < 0 || minutes > 59) {
    return { valid: false, value: null, field: 'minutes' }
  }

  const value = hours * 60 + minutes
  if (!Number.isSafeInteger(value)) {
    return { valid: false, value: null, field: 'hours' }
  }
  return { valid: true, value }
}

export const formatDurationHoursMinutes = (value: DurationMinutes): string => {
  if (value == null) {
    return ''
  }
  const { hours, minutes } = durationPartsFromMinutes(value)
  return `${hours} H ${minutes} M`
}

export const formatWholeHoursInput = (value: DurationMinutes): string => {
  if (value == null) {
    return ''
  }
  assertCanonicalMinutes(value)
  return String(Math.round(value / 60))
}

export const parseWholeHoursInput = (text: string): ParsedWholeHours => {
  const draft = text.trim()
  if (draft === '') {
    return { valid: true, value: null }
  }
  if (!/^\d+$/.test(draft)) {
    return { valid: false, value: null }
  }
  const hours = Number(draft)
  const value = hours * 60
  if (!Number.isSafeInteger(hours) || !Number.isSafeInteger(value)) {
    return { valid: false, value: null }
  }
  return { valid: true, value }
}

export const formatDurationHoursNumber = (
  value: DurationMinutes,
  locale: string
): string => {
  if (value == null) {
    return ''
  }
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 60)
}

export const formatWholeHoursNumber = (
  value: DurationMinutes,
  locale: string
): string => {
  if (value == null) {
    return ''
  }
  assertCanonicalMinutes(value)
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0
  }).format(Math.round(value / 60))
}
