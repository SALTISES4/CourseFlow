import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { ChangeEvent, FocusEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  DurationMinutes,
  durationPartsFromMinutes,
  parseDurationParts
} from './duration'

type Props = {
  groupLabel: string
  value: DurationMinutes
  disabled?: boolean
  readOnly?: boolean
  width?: number | string
  testId?: string
  onValueChange?: (value: number | null) => void
  onValueCommit?: (value: number | null) => void
}

/**
 * Two-field duration editor backed by one canonical total-minute value.
 * Either field may be empty: an empty Hours or Minutes field contributes zero.
 */
const DurationHoursMinutesFields = ({
  groupLabel,
  value,
  disabled = false,
  readOnly = false,
  width = '100%',
  testId,
  onValueChange,
  onValueCommit
}: Props) => {
  const { t } = useTranslation('common')
  const initial = durationPartsFromMinutes(value)
  const [hours, setHours] = useState(initial.hours)
  const [minutes, setMinutes] = useState(initial.minutes)
  const hoursRef = useRef(hours)
  const minutesRef = useRef(minutes)
  const focused = useRef(false)
  const parsed = parseDurationParts(hours, minutes)

  useEffect(() => {
    if (!focused.current) {
      const next = durationPartsFromMinutes(value)
      hoursRef.current = next.hours
      minutesRef.current = next.minutes
      setHours(next.hours)
      setMinutes(next.minutes)
    }
  }, [value])

  const update =
    (field: 'hours' | 'minutes') => (event: ChangeEvent<HTMLInputElement>) => {
      const nextHours =
        field === 'hours' ? event.target.value : hoursRef.current
      const nextMinutes =
        field === 'minutes' ? event.target.value : minutesRef.current

      hoursRef.current = nextHours
      minutesRef.current = nextMinutes
      setHours(nextHours)
      setMinutes(nextMinutes)
    }

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return
    }
    focused.current = false
    const result = parseDurationParts(hoursRef.current, minutesRef.current)
    if (!result.valid) {
      const restored = durationPartsFromMinutes(value)
      hoursRef.current = restored.hours
      minutesRef.current = restored.minutes
      setHours(restored.hours)
      setMinutes(restored.minutes)
      return
    }
    onValueChange?.(result.value)
    onValueCommit?.(result.value)
  }

  return (
    <Stack
      direction="row"
      spacing={1}
      role="group"
      aria-label={groupLabel}
      data-test-id={testId}
      sx={{ width }}
      onFocusCapture={() => {
        focused.current = true
      }}
      onBlur={handleBlur}
    >
      <TextField
        label={t('duration.hours')}
        value={hours}
        type="number"
        variant="outlined"
        size="small"
        fullWidth
        disabled={disabled}
        error={!parsed.valid && parsed.field === 'hours'}
        helperText={
          !parsed.valid && parsed.field === 'hours'
            ? t('duration.hoursInvalid')
            : undefined
        }
        inputProps={{ min: 0, step: 1, inputMode: 'numeric' }}
        InputProps={{ readOnly }}
        onChange={update('hours')}
      />
      <TextField
        label={t('duration.minutes')}
        value={minutes}
        type="number"
        variant="outlined"
        size="small"
        fullWidth
        disabled={disabled}
        error={!parsed.valid && parsed.field === 'minutes'}
        helperText={
          !parsed.valid && parsed.field === 'minutes'
            ? t('duration.minutesInvalid')
            : undefined
        }
        inputProps={{ min: 0, max: 59, step: 1, inputMode: 'numeric' }}
        InputProps={{ readOnly }}
        onChange={update('minutes')}
      />
    </Stack>
  )
}

export default DurationHoursMinutesFields
