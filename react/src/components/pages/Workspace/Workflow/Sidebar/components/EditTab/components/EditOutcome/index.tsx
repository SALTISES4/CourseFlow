import { Outcome, updateOutcome } from '@cf/redux/slices/outcomes.slice'
import { sidebarChangeTab } from '@cf/redux/slices/sidebar.slice'
import { _t } from '@cf/utility/Utility.class'
import { RootState } from '@cfRedux/store'
import { debounce } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '../../../../styles'
import data from '../EditNode/optionsData'

const EditOutcome = ({ outcomeId }: { outcomeId: number }) => {
  const dispatch = useDispatch()
  const outcomes = useSelector((state: RootState) => state.outcomes.outcomeData)
  const outcome = outcomes[outcomeId]

  if (!outcome) {
    dispatch(sidebarChangeTab({ tab: null, collapsed: true }))
    return null
  }

  return <EditOutcomeForm outcome={outcome} />
}

const EditOutcomeForm = ({ outcome }: { outcome: Outcome }) => {
  const dispatch = useDispatch()
  const firstRender = useRef(true)

  const {
    register,
    watch,
    reset,
    formState: { isDirty }
  } = useForm<Outcome>({
    defaultValues: {
      title: outcome.title,
      description: outcome.description,
      code: outcome.code
    }
  })

  const watched = watch()

  const debouncedDispatch = useMemo(
    () =>
      debounce((data: Outcome) => {
        dispatch(
          updateOutcome({
            id: outcome.id,
            children: outcome.children,
            ...data
          })
        )
      }, 300),
    [dispatch, outcome]
  )

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }

    if (isDirty) {
      debouncedDispatch(watched)
    }
  }, [watched, isDirty, debouncedDispatch])

  useEffect(() => {
    if (!isDirty) {
      reset({
        title: outcome.title,
        description: outcome.description,
        code: outcome.code,
        tags: outcome.tags
      })
    }
  }, [reset, isDirty, outcome])

  return (
    <SidebarInnerWrap>
      <SidebarContent>
        <SidebarTitle as="h3" variant="h6">
          {_t('Edit outcome')}
        </SidebarTitle>
        <Stack direction="column" gap={3}>
          <TextField
            required
            variant="outlined"
            label={_t('Title')}
            size="small"
            {...register('title')}
          />
          <TextField
            variant="outlined"
            label={_t('Description')}
            size="small"
            multiline
            maxRows={5}
            {...register('description')}
          />
          <TextField
            variant="outlined"
            label={_t('Code')}
            size="small"
            {...register('code')}
          />
          {data.tags && (
            <Autocomplete
              multiple
              size="small"
              options={data.tags}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField {...params} variant="outlined" label="Tags" />
              )}
            />
          )}
        </Stack>
      </SidebarContent>
      <SidebarActions>
        <Button variant="contained" color="secondary">
          {_t('Duplicate')}
        </Button>
        <Button variant="contained" color="secondary">
          {_t('Delete')}
        </Button>
      </SidebarActions>
    </SidebarInnerWrap>
  )
}

export default EditOutcome
