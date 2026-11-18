export type DurationMinutes = number | null | undefined

export const formatDurationInput = (value: DurationMinutes): string => {
  if (value == null) {
    return ''
  }
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError('Duration must be a non-negative integer of minutes')
  }
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  if (hours > 999) {
    throw new RangeError(
      'Duration input supports at most 999 hours and 59 minutes'
    )
  }
  return `${String(hours).padStart(3, '0')}${String(minutes).padStart(2, '0')}`
}

export const parseDurationInput = (
  digits: string
): { valid: boolean; value: number | null } => {
  if (digits === '') {
    return { valid: true, value: null }
  }
  if (!/^\d{5}$/.test(digits)) {
    return { valid: false, value: null }
  }
  const hours = Number(digits.slice(0, 3))
  const minutes = Number(digits.slice(3))
  if (minutes > 59) {
    return { valid: false, value: null }
  }
  return { valid: true, value: hours * 60 + minutes }
}

export const formatDurationHours = (
  value: DurationMinutes,
  locale: string
): string => {
  if (value == null) {
    return ''
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'hour',
    unitDisplay: 'long',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 60)
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
