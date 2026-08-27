import { WorkflowPermission } from '@cf/api/gen/types.gen'
import RichTextDescription from '@cf/components/common/dialog/Workflow/components/RichTextDescription'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import type { OutcomeEntity } from '@cf/features/graph/state/model/types'
import { selectOutcomeById } from '@cf/features/graph/state/selectors/outcomes.selectors'
import { selectOutcomeLevel } from '@cf/features/graph/state/selectors/outcomes.selectors'
import {
  deleteOutcome,
  duplicateOutcome,
  updateOutcome
} from '@cf/features/graph/state/thunks/outcomeMutations.thunks'
import { useGraphProjectTags } from '@cf/features/graph/useGraphProjectTags'
import { sidebarChangeTab } from '@cf/features/sidebar/state/sidebar.slice'
import type { AppDispatch } from '@cf/redux/store'
import { RootState } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '@cfSidebar/styles'
import { debounce } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useCallback, useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

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
  const canManageOutcomes = useResourcePermission(
    WorkflowPermission.OUTCOME_MANAGEMENT
  )
  const level = useSelector((state: RootState) =>
    selectOutcomeLevel(state, outcome.graphUuid, outcome.uuid)
  )
  const { data: projectTags = [] } = useGraphProjectTags(outcome.graphUuid)

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
        if (!canManageOutcomes) {
          return
        }
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
    [canManageOutcomes, dispatch, reset, outcome.graphUuid, outcome.uuid]
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
            variant="outlined"
            label={_t('Title')}
            size="small"
            {...register('title')}
            InputProps={{ readOnly: !canManageOutcomes }}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextDescription
                label={_t('Description')}
                readOnly={!canManageOutcomes}
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />
          {level === 0 && (
            <>
              <TextField
                variant="outlined"
                label={_t('Code')}
                size="small"
                {...register('code')}
                InputProps={{ readOnly: !canManageOutcomes }}
              />
              <Controller
                name="tagIds"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    size="small"
                    disabled={!canManageOutcomes}
                    options={projectTags}
                    getOptionLabel={(tag) => tag.label}
                    value={projectTags.filter((tag) =>
                      field.value.includes(tag.id)
                    )}
                    onChange={(_, selectedOptions) =>
                      field.onChange(selectedOptions.map((option) => option.id))
                    }
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
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
            </>
          )}
        </Stack>
      </SidebarContent>
      <SidebarActions>
        <Button
          variant="contained"
          color="secondary"
          disabled={!canManageOutcomes}
          onClick={onDuplicate}
        >
          {_t('Duplicate')}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          disabled={!canManageOutcomes}
          onClick={onDelete}
        >
          {_t('Delete')}
        </Button>
      </SidebarActions>
    </SidebarInnerWrap>
  )
}

export default EditOutcome
