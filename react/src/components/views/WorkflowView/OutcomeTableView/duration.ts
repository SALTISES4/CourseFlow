import { TimeUnit } from '@cf/api/gen/types.gen'

export const durationToWholeHours = (
  value: number | null | undefined,
  unit: TimeUnit | null | undefined = TimeUnit.HOURS
): number | null | undefined => {
  if (value == null) {
    return null
  }
  if (!Number.isInteger(value) || value < 0) {
    return undefined
  }
  if (unit == null || unit === TimeUnit.HOURS) {
    return value
  }
  if (unit === TimeUnit.DAYS) {
    return value * 24
  }
  return undefined
}

export const formatWholeHours = (hours: number, locale: string): string => {
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  const formatter = (value: number, unit: 'day' | 'hour') =>
    new Intl.NumberFormat(locale, {
      style: 'unit',
      unit,
      unitDisplay: 'long'
    }).format(value)

  if (days === 0) {
    return formatter(remainingHours, 'hour')
  }
  if (remainingHours === 0) {
    return formatter(days, 'day')
  }
  return `${formatter(days, 'day')} ${formatter(remainingHours, 'hour')}`
}

export const sumDefinedValues = (
  values: (number | null | undefined)[]
): number | null | undefined => {
  if (values.some((value) => value === undefined)) {
    return undefined
  }
  const setValues = values.filter((value): value is number => value !== null)
  return setValues.length > 0
    ? setValues.reduce((total, value) => total + value, 0)
    : null
}
