import { debounce } from '@mui/material'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { TextFieldProps } from '@mui/material/TextField'
import { TimeField } from '@mui/x-date-pickers/TimeField'
import { getHours, getMinutes } from 'date-fns'
import { produce } from 'immer'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { NumericFormat } from 'react-number-format'
import { useTranslation } from 'react-i18next'

type Duration = {
  days: number
  hours: number
  minutes: number
}

type Props = Pick<TextFieldProps, 'variant' | 'size'> & {
  value?: Duration | null
  fullWidth?: boolean
  onChange?: (value: Duration | null) => void
  disabled?: boolean
  error?: boolean
}

const TimeDurationField = ({ value, onChange, variant, size }: Props) => {
  const { t } = useTranslation('common')
  const isDirty = useRef(false)
  const [state, setState] = useState<Duration>({
    days: value?.days ?? 0,
    hours: value?.hours ?? 0,
    minutes: value?.minutes ?? 0
  })

  const debouncedChange = useMemo(
    () =>
      debounce(() => {
        if (isDirty.current) {
          onChange?.(state)
        }
      }, 300),
    [onChange, state]
  )

  useEffect(() => {
    debouncedChange()
    return () => debouncedChange.clear()
  }, [debouncedChange])

  const timeValue = useMemo(() => {
    if (state.hours === 0 && state.minutes === 0) {
      return null
    }

    const date = new Date()
    date.setHours(state.hours, state.minutes, 0, 0)
    return date
  }, [state.hours, state.minutes])

  const onDaysChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value !== state.days.toString()) {
      setState(
        produce((draft) => {
          draft.days = Number(value)
          isDirty.current = true
        })
      )
    }
  }

  const onTimeChange = (timeValue) => {
    const hours = !timeValue ? 0 : getHours(timeValue)
    const minutes = !timeValue ? 0 : getMinutes(timeValue)

    setState(
      produce((draft) => {
        draft.hours = hours
        draft.minutes = minutes
        isDirty.current = true
      })
    )
  }

  return (
    <Stack direction="row" gap={2}>
      <NumericFormat
        customInput={TextField}
        label={t('duration.days')}
        value={state.days || ''}
        variant={variant}
        size={size}
        onChange={onDaysChange}
      />
      <TimeField
        label={t('duration.hours')}
        format="HH:mm"
        variant={variant}
        value={timeValue}
        size={size}
        onChange={onTimeChange}
      />
    </Stack>
  )
}

export default TimeDurationField
