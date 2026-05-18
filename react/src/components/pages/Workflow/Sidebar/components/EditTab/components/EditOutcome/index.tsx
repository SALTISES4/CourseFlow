import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '@cf/components/pages/Workflow/Sidebar/styles'
import { sidebarChangeTab } from '@cf/features/sidebar/state/sidebar.slice'
import { selectOutcomeById } from '@cf/redux/selectors/outcomes.selector'
import {
  Outcome,
  deleteOutcome,
  duplicateOutcome,
  updateOutcome
} from '@cf/redux/slices/outcomes.slice'
import { RootState } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import { debounce } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useCallback, useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

import data from '../EditNode/optionsData'

const EditOutcome = ({ outcomeId }: { outcomeuuid: string }) => {
  const dispatch = useDispatch()
  const outcome = useSelector((state: RootState) =>
    selectOutcomeById(state, outcomeId)
  )

  if (!outcome) {
    dispatch(sidebarChangeTab({ tab: null, collapsed: true }))
    return null
  }

  return <EditOutcomeForm outcome={outcome} />
}

const EditOutcomeForm = ({ outcome }: { outcome: Outcome }) => {
  const dispatch = useDispatch()

  const {
    control,
    register,
    watch,
    reset,
    formState: { isDirty }
  } = useForm<Outcome>({
    defaultValues: {
      title: outcome.title,
      description: outcome.description,
      code: outcome.code,
      tags: outcome.tags
    }
  })

  const watchedFields = watch()

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

  const debouncedDispatch = useMemo(
    () =>
      debounce((data: Outcome) => {
        dispatch(
          updateOutcome({
            uuid: outcome.uuid,
            data: {
              children: outcome.children,
              ...data
            }
          })
        )

        reset({}, { keepValues: true })
      }, 300),
    [dispatch, reset, outcome.uuid, outcome.children]
  )

  useEffect(() => {
    if (isDirty) {
      debouncedDispatch(watchedFields)
    }
  }, [watchedFields, isDirty, debouncedDispatch])

  const onDuplicate = useCallback(() => {
    dispatch(duplicateOutcome({ uuid: outcome.uuid }))
  }, [dispatch, outcome.uuid])

  const onDelete = useCallback(() => {
    dispatch(deleteOutcome({ uuid: outcome.uuid }))
  }, [dispatch, outcome.uuid])

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
          {outcome.level === 0 && (
            <>
              <TextField
                variant="outlined"
                label={_t('Code')}
                size="small"
                {...register('code')}
              />
              {data.tags && (
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      size="small"
                      options={data.tags}
                      getOptionLabel={(tag) => tag.label}
                      value={data.tags.filter((tag) =>
                        field.value.includes(tag.uuid)
                      )}
                      onChange={(_, selectedOptions) =>
                        field.onChange(
                          selectedOptions.map((option) => option.uuid)
                        )
                      }
                      isOptionEqualToValue={(option, value) =>
                        option.uuid === value.uuid
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="outlined"
                          label={_t('Tags')}
                        />
                      )}
                    />
                  )}
                />
              )}
            </>
          )}
        </Stack>
      </SidebarContent>
      <SidebarActions>
        <Button variant="contained" color="secondary" onClick={onDuplicate}>
          {_t('Duplicate')}
        </Button>
        <Button variant="contained" color="secondary" onClick={onDelete}>
          {_t('Delete')}
        </Button>
      </SidebarActions>
    </SidebarInnerWrap>
  )
}

export default EditOutcome
