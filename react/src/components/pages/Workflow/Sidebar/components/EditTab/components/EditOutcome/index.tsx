import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '@cf/components/pages/Workflow/Sidebar/styles'
import { sidebarChangeTab } from '@cf/features/sidebar/state/sidebar.slice'
import type { OutcomeEntity } from '@cf/features/graph/state/model/types'
import { selectOutcomeById } from '@cf/features/graph/state/selectors/outcomes.selectors'
import { selectOutcomeLevel } from '@cf/features/graph/state/selectors/outcomes.selectors'
import {
  deleteOutcome,
  duplicateOutcome,
  updateOutcome
} from '@cf/features/graph/state/thunks/outcomeMutations.thunks'
import type { AppDispatch } from '@cf/redux/store'
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

type OutcomeFormValues = {
  title: string
  description: string
  code: string
  tagIds: number[]
}

const EditOutcome = ({ outcomeUuid }: { outcomeUuid: string }) => {
  const dispatch = useDispatch<AppDispatch>()
  const outcome = useSelector((state: RootState) =>
    selectOutcomeById(state, outcomeUuid)
  )

  if (!outcome) {
    dispatch(sidebarChangeTab({ tab: null, collapsed: true }))
    return null
  }

  return <EditOutcomeForm outcome={outcome} />
}

const EditOutcomeForm = ({ outcome }: { outcome: OutcomeEntity }) => {
  const dispatch = useDispatch<AppDispatch>()
  const level = useSelector((state: RootState) =>
    selectOutcomeLevel(state, outcome.graphUuid, outcome.uuid)
  )

  const {
    control,
    register,
    watch,
    reset,
    formState: { isDirty }
  } = useForm<OutcomeFormValues>({
    defaultValues: {
      title: outcome.title,
      description: outcome.description,
      code: outcome.code,
      tagIds: outcome.tagIds
    }
  })

  const watchedFields = watch()

  useEffect(() => {
    if (!isDirty) {
      reset({
        title: outcome.title,
        description: outcome.description,
        code: outcome.code,
        tagIds: outcome.tagIds
      })
    }
  }, [reset, isDirty, outcome])

  const debouncedDispatch = useMemo(
    () =>
      debounce((formData: OutcomeFormValues) => {
        dispatch(
          updateOutcome({
            graphUuid: outcome.graphUuid,
            outcomeUuid: outcome.uuid,
            meta: {
              title: formData.title,
              description: formData.description,
              code: formData.code,
              tagIds: formData.tagIds
            }
          })
        )

        reset({}, { keepValues: true })
      }, 300),
    [dispatch, reset, outcome.graphUuid, outcome.uuid]
  )

  useEffect(() => {
    if (isDirty) {
      debouncedDispatch(watchedFields)
    }
  }, [watchedFields, isDirty, debouncedDispatch])

  const onDuplicate = useCallback(() => {
    dispatch(
      duplicateOutcome({
        graphUuid: outcome.graphUuid,
        outcomeUuid: outcome.uuid
      })
    )
  }, [dispatch, outcome.graphUuid, outcome.uuid])

  const onDelete = useCallback(() => {
    dispatch(
      deleteOutcome({
        graphUuid: outcome.graphUuid,
        outcomeUuid: outcome.uuid
      })
    )
  }, [dispatch, outcome.graphUuid, outcome.uuid])

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
          {level === 0 && (
            <>
              <TextField
                variant="outlined"
                label={_t('Code')}
                size="small"
                {...register('code')}
              />
              {data.tags && (
                <Controller
                  name="tagIds"
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
