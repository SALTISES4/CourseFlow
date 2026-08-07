import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import type { NodeEntity } from '@cf/features/graph/state/model/types'
import {
  selectGraphByUuid,
  selectNodeByUuid,
  selectWorkflowByUuid
} from '@cf/features/graph/state/selectors/canonical.selectors'
import {
  changeNodeMeta,
  linkNodeWorkflow
} from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { sidebarChangeTab } from '@cf/features/sidebar/state/sidebar.slice'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import type { AppDispatch } from '@cf/redux/store'
import Utility, { _t } from '@cf/utility/Utility.class'
import * as SC from '@cfSidebar/styles'
import { debounce } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

import LinkedWorkflowMirrorFields from './LinkedWorkflowMirrorFields'
import {
  canLinkWorkflow,
  linkWorkflowActionLabel,
  nodeTitleFallback
} from './linkedWorkflowUi'
import optionsData from './optionsData'
import { NodeForm } from './types'

const EditNode = ({ nodeId }: { nodeId: string }) => {
  const dispatch = useDispatch()
  const nodeSelector = useMemo(() => selectNodeByUuid(nodeId), [nodeId])
  const node = useSelector(nodeSelector)

  useEffect(() => {
    if (!node && nodeId) {
      dispatch(sidebarChangeTab({ tab: null, collapsed: true }))
    }
  }, [node, nodeId, dispatch])

  const graphSelector = useMemo(
    () =>
      node?.graphUuid ? selectGraphByUuid(node.graphUuid) : () => undefined,
    [node?.graphUuid]
  )
  const graph = useSelector(graphSelector)
  const parentWorkflowType = graph?.workflowType ?? null

  const linkedWorkflowSelector = useMemo(
    () =>
      node?.linkedWorkflowUuid
        ? selectWorkflowByUuid(node.linkedWorkflowUuid)
        : () => undefined,
    [node?.linkedWorkflowUuid]
  )
  const linkedWorkflowCache = useSelector(linkedWorkflowSelector)

  if (!node) {
    return null
  }

  return (
    <EditNodeForm
      node={node}
      graphUuid={node.graphUuid}
      parentWorkflowType={parentWorkflowType}
      linkedWorkflowTitle={linkedWorkflowCache?.title}
    />
  )
}

const EditNodeForm = ({
  node,
  graphUuid,
  parentWorkflowType,
  linkedWorkflowTitle
}: {
  node: NodeEntity
  graphUuid: string
  parentWorkflowType: string | null
  linkedWorkflowTitle?: string
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { dispatch: dialogDispatch } = useDialog()

  const isLinked = Boolean(node.linkedWorkflowUuid)
  const isCourseParent = parentWorkflowType === 'course'
  const isProgramParent = parentWorkflowType === 'program'
  const isActivityParent = parentWorkflowType === 'activity'
  const showLinkButton = canLinkWorkflow(parentWorkflowType)

  const { data: linkedWorkflowResp } = useQuery({
    ...getWorkflowOptions({
      path: { uuid: node.linkedWorkflowUuid ?? '' }
    }),
    enabled: isLinked && Boolean(node.linkedWorkflowUuid)
  })
  const linkedWorkflowDetail = linkedWorkflowResp?.item

  const mirroredTitle =
    linkedWorkflowDetail?.title ?? linkedWorkflowTitle ?? nodeTitleFallback()
  const mirroredDescription = linkedWorkflowDetail?.description ?? ''

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty }
  } = useForm<NodeForm>({
    defaultValues: {
      title: node.title,
      description: node.description,
      ponderation: {
        theory: '0',
        practice: '0',
        individual: '0'
      },
      contextType: node.contextClassification ?? '',
      taskType: node.taskClassification ?? '',
      timeRequired: node.timeRequired ?? undefined,
      timeUnits: node.timeUnits ?? undefined,
      tags: node.tagIds ?? [],
      specificEducation: false
    }
  })

  const watchedFields = watch()

  useEffect(() => {
    if (!isDirty) {
      reset({
        title: node.title,
        description: node.description,
        ponderation: {
          theory: '0',
          practice: '0',
          individual: '0'
        },
        contextType: node.contextClassification ?? '',
        taskType: node.taskClassification ?? '',
        timeRequired: node.timeRequired ?? undefined,
        timeUnits: node.timeUnits ?? undefined,
        tags: node.tagIds ?? [],
        specificEducation: false
      })
    }
  }, [reset, isDirty, node])

  const debouncedDispatch = useMemo(
    () =>
      debounce((data: NodeForm) => {
        const contextClassification =
          data.contextType === '' || data.contextType === null
            ? null
            : parseInt(String(data.contextType), 10)
        const taskClassification =
          data.taskType === '' || data.taskType === null
            ? null
            : parseInt(String(data.taskType), 10)
        const timeRequired = !data.timeRequired
          ? null
          : Number(data.timeRequired)
        const timeUnits = !data.timeUnits ? null : Number(data.timeUnits)

        const meta: Parameters<typeof changeNodeMeta>[0]['meta'] = {
          tagIds: (data.tags ?? []).map((id) => Number(id))
        }

        if (!isLinked) {
          meta.title = data.title
          meta.description = data.description
          meta.contextClassification = contextClassification
          meta.taskClassification = taskClassification
          meta.timeRequired = Number.isNaN(timeRequired) ? null : timeRequired
          meta.timeUnits = Number.isNaN(timeUnits) ? null : timeUnits
        } else if (isCourseParent || isActivityParent) {
          meta.contextClassification = contextClassification
          if (isActivityParent) {
            meta.taskClassification = taskClassification
          }
        } else if (isProgramParent) {
          // Node-local only when linked on program graph (tags; specific education TBD on API).
        } else {
          meta.contextClassification = contextClassification
          meta.taskClassification = taskClassification
          meta.timeRequired = Number.isNaN(timeRequired) ? null : timeRequired
          meta.timeUnits = Number.isNaN(timeUnits) ? null : timeUnits
        }

        void dispatch(
          changeNodeMeta({
            graphUuid,
            nodeUuid: node.uuid,
            meta
          })
        )

        reset({}, { keepValues: true })
      }, 300),
    [
      dispatch,
      graphUuid,
      isActivityParent,
      isCourseParent,
      isLinked,
      isProgramParent,
      node.uuid,
      reset
    ]
  )

  useEffect(() => {
    if (isDirty) {
      debouncedDispatch(watchedFields)
    }
  }, [watchedFields, isDirty, debouncedDispatch])

  const onSubmit = (data: NodeForm) => {
    Utility.logger('Form submitted with data:', data)
  }

  const toggleLinkWorkflowDialog = useCallback(() => {
    dialogDispatch(DialogMode.NODE_LINK_WORKFLOW, {
      uuid: node.uuid,
      graphUuid
    })
  }, [dialogDispatch, graphUuid, node.uuid])

  const removeLinkedWorkflow = useCallback(() => {
    void dispatch(
      linkNodeWorkflow({
        graphUuid,
        nodeUuid: node.uuid,
        workflowUuid: null
      })
    )
  }, [dispatch, graphUuid, node.uuid])

  const linkActionLabel = linkWorkflowActionLabel(parentWorkflowType, isLinked)

  const showEditableTitleFields = !isLinked
  const showContextField = isCourseParent || isActivityParent
  const showTaskTypeField = isActivityParent && !isLinked
  const showEditableTimeFields =
    (isCourseParent || isActivityParent) && !isLinked
  const showTagsField = isCourseParent || isActivityParent || isProgramParent
  const showProgramPonderation = isProgramParent && !isLinked
  const showSpecificEducationSwitch = isProgramParent

  return (
    <SC.SidebarInnerWrap as="form" onSubmit={handleSubmit(onSubmit)}>
      <SC.SidebarContent>
        <SC.SidebarTitle as="h3" variant="h6">
          {_t('Edit node')}
        </SC.SidebarTitle>

        {isLinked && (
          <LinkedWorkflowMirrorFields
            title={mirroredTitle}
            description={mirroredDescription}
            parentWorkflowType={parentWorkflowType ?? 'course'}
            showTime={isCourseParent}
            showProgramFields={isProgramParent}
          />
        )}

        <Stack direction="column" spacing={3} sx={{ mt: isLinked ? 3 : 0 }}>
          {showEditableTitleFields && (
            <>
              <TextField
                label={_t('Title')}
                variant="outlined"
                size="small"
                {...register('title', {
                  required: _t('Title is required')
                })}
                error={!!errors.title}
                helperText={errors.title?.message}
              />
              <TextField
                label={_t('Description')}
                variant="outlined"
                size="small"
                multiline
                maxRows={5}
                {...register('description')}
              />
            </>
          )}

          {showContextField && (
            <FormControl fullWidth size="small">
              <InputLabel id="context-type-select-label">
                {_t('Context')}
              </InputLabel>
              <Controller
                name="contextType"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label={_t('Context')}
                    labelId="context-type-select-label"
                  >
                    {optionsData.contexts.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          )}

          {showTaskTypeField && (
            <FormControl fullWidth size="small">
              <InputLabel id="task-type-select-label">
                {_t('Type of task')}
              </InputLabel>
              <Controller
                name="taskType"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label={_t('Type of task')}
                    labelId="task-type-select-label"
                  >
                    {optionsData.taskTypes.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          )}

          {showEditableTimeFields && (
            <Stack direction="row" gap={2}>
              <TextField
                label={_t('Amount')}
                variant="outlined"
                size="small"
                {...register('timeRequired')}
                sx={{ flexBasis: '35%' }}
              />
              <FormControl sx={{ flexGrow: 1 }} size="small">
                <InputLabel id="unit-type-select-label">
                  {_t('Unit type')}
                </InputLabel>
                <Controller
                  name="timeUnits"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label={_t('Unit type')}
                      labelId="unit-type-select-label"
                    >
                      {optionsData.timeUnits.map((unit, idx) => (
                        <MenuItem key={idx} value={idx + 1}>
                          {unit}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Stack>
          )}

          {showTagsField && (
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  size="small"
                  options={optionsData.tags}
                  getOptionLabel={(tag) => tag.label}
                  value={optionsData.tags.filter(
                    (tag) => field.value?.includes(tag.uuid) ?? false
                  )}
                  onChange={(_, selectedOptions) =>
                    field.onChange(selectedOptions.map((option) => option.uuid))
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

          {showSpecificEducationSwitch && (
            <FormControlLabel
              label={_t('Specific education')}
              control={
                <Controller
                  name="specificEducation"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={Boolean(field.value)}
                      onChange={field.onChange}
                      size="small"
                    />
                  )}
                />
              }
            />
          )}
        </Stack>

        {showProgramPonderation && (
          <>
            <Divider sx={{ mt: 3 }} />
            <Typography
              component="h6"
              variant="body2"
              sx={{ mt: 1, mb: 3, fontWeight: 600 }}
            >
              {_t('Ponderation')}
            </Typography>
            <Stack direction="row" gap={2} sx={{ mb: 2 }}>
              <TextField
                label={_t('Hrs. theory')}
                variant="outlined"
                size="small"
                {...register('ponderation.theory')}
              />
              <TextField
                label={_t('Hrs. practice')}
                variant="outlined"
                size="small"
                {...register('ponderation.practice')}
              />
            </Stack>
            <TextField
              label={_t('Hrs. individual')}
              variant="outlined"
              size="small"
              {...register('ponderation.individual')}
            />
          </>
        )}
      </SC.SidebarContent>
      <SC.SidebarActions>
        {showLinkButton && (
          <Button
            variant="contained"
            color="secondary"
            onClick={isLinked ? removeLinkedWorkflow : toggleLinkWorkflowDialog}
          >
            {linkActionLabel}
          </Button>
        )}
        <Button variant="contained" color="secondary">
          {_t('Duplicate')}
        </Button>
        <Button variant="contained" color="secondary">
          {_t('Delete')}
        </Button>
      </SC.SidebarActions>
    </SC.SidebarInnerWrap>
  )
}

export default EditNode
