import {
  getWorkflowOptions,
  listProjectTagsOptions
} from '@cf/api/gen/@tanstack/react-query.gen'
import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
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
import RichTextDescription from '@cfComponents/dialog/Workflow/components/RichTextDescription'
import DurationTextField from '@cfComponents/DurationTextField'
import * as SC from '@cfSidebar/styles'
import { debounce } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
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
      rootWorkflowUuid={graph?.workflowUuid ?? null}
      parentWorkflowType={parentWorkflowType}
      linkedWorkflowTitle={linkedWorkflowCache?.title}
    />
  )
}

const EditNodeForm = ({
  node,
  graphUuid,
  rootWorkflowUuid,
  parentWorkflowType,
  linkedWorkflowTitle
}: {
  node: NodeEntity
  graphUuid: string
  rootWorkflowUuid: string | null
  parentWorkflowType: string | null
  linkedWorkflowTitle?: string
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { dispatch: dialogDispatch } = useDialog()
  const canEdit = useResourcePermission(WorkflowPermission.NODE_MANAGEMENT)
  const canManageLinks = useResourcePermission(
    WorkflowPermission.NODE_LINK_MANAGEMENT
  )

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
  const { data: rootWorkflowResp } = useQuery({
    ...getWorkflowOptions({ path: { uuid: rootWorkflowUuid ?? '' } }),
    enabled: Boolean(rootWorkflowUuid)
  })
  const projectUuid = rootWorkflowResp?.item.projectUuid
  const { data: projectTags = [] } = useQuery({
    ...listProjectTagsOptions({ path: { uuid: projectUuid ?? '' } }),
    enabled: Boolean(projectUuid)
  })

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
        theory: String(node.ponderationTheory ?? ''),
        practice: String(node.ponderationPractice ?? ''),
        individual: String(node.ponderationIndividual ?? '')
      },
      contextType: node.contextClassification ?? '',
      taskType: node.taskClassification ?? '',
      timeRequired: node.timeRequired ?? undefined,
      timeUnits: node.timeUnits ?? undefined,
      credits: node.credits ?? undefined,
      tags: node.tagIds ?? [],
      specificEducation: node.specificEducation
    }
  })

  const watchedFields = watch()

  useEffect(() => {
    if (!isDirty) {
      reset({
        title: node.title,
        description: node.description,
        ponderation: {
          theory: String(node.ponderationTheory ?? ''),
          practice: String(node.ponderationPractice ?? ''),
          individual: String(node.ponderationIndividual ?? '')
        },
        contextType: node.contextClassification ?? '',
        taskType: node.taskClassification ?? '',
        timeRequired: node.timeRequired ?? undefined,
        timeUnits: node.timeUnits ?? undefined,
        credits: node.credits ?? undefined,
        tags: node.tagIds ?? [],
        specificEducation: node.specificEducation
      })
    }
  }, [reset, isDirty, node])

  const debouncedDispatch = useMemo(
    () =>
      debounce((data: NodeForm) => {
        if (!canEdit) {
          return
        }
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
          if (isProgramParent) {
            const optionalNumber = (value: string | number | undefined) => {
              if (value === '' || value === undefined) {
                return null
              }
              const parsed = Number(value)
              return Number.isNaN(parsed) ? null : parsed
            }
            meta.credits = optionalNumber(data.credits)
            meta.ponderationTheory = optionalNumber(data.ponderation?.theory)
            meta.ponderationPractice = optionalNumber(
              data.ponderation?.practice
            )
            meta.ponderationIndividual = optionalNumber(
              data.ponderation?.individual
            )
            meta.specificEducation = Boolean(data.specificEducation)
          }
        } else if (isCourseParent || isActivityParent) {
          meta.contextClassification = contextClassification
          if (isActivityParent) {
            meta.taskClassification = taskClassification
          }
        } else if (isProgramParent) {
          meta.specificEducation = Boolean(data.specificEducation)
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
      canEdit,
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
    if (isDirty && canEdit) {
      debouncedDispatch(watchedFields)
    }
  }, [watchedFields, isDirty, canEdit, debouncedDispatch])

  useEffect(() => () => debouncedDispatch.clear(), [debouncedDispatch])

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
    (isCourseParent || isActivityParent || isProgramParent) && !isLinked
  const showTagsField = isCourseParent || isActivityParent || isProgramParent
  const showProgramPonderation = isProgramParent && !isLinked
  const showSpecificEducationSwitch = isProgramParent

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SC.SidebarInnerWrap>
        <SC.SidebarContent>
          <SC.SidebarTitle as="h3" variant="h6">
            {_t('Edit node')}
          </SC.SidebarTitle>

          {isLinked && (
            <LinkedWorkflowMirrorFields
              title={mirroredTitle}
              description={mirroredDescription}
              parentWorkflowType={parentWorkflowType ?? 'course'}
              showTime={isCourseParent || isProgramParent}
              showProgramFields={isProgramParent}
              time={linkedWorkflowDetail?.overviewMetadata.time}
              credits={linkedWorkflowDetail?.overviewMetadata.credits}
              ponderationTheory={
                linkedWorkflowDetail?.overviewMetadata.theoryTime
              }
              ponderationPractice={
                linkedWorkflowDetail?.overviewMetadata.practicalTime
              }
              ponderationIndividual={
                linkedWorkflowDetail?.overviewMetadata.individualTime
              }
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
                  InputProps={{ readOnly: !canEdit }}
                />
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <RichTextDescription
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      readOnly={!canEdit}
                    />
                  )}
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
                      disabled={!canEdit}
                    >
                      {(isCourseParent
                        ? optionsData.courseContexts
                        : optionsData.activityContexts
                      ).map((option) => (
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
                      disabled={!canEdit}
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
              <Controller
                name="timeRequired"
                control={control}
                render={({ field }) => (
                  <DurationTextField
                    label={_t('Time')}
                    value={field.value}
                    readOnly={!canEdit}
                    onValueChange={field.onChange}
                  />
                )}
              />
            )}

            {showProgramPonderation && (
              <TextField
                label={_t('Credits')}
                variant="outlined"
                size="small"
                type="number"
                {...register('credits')}
                InputProps={{ readOnly: !canEdit }}
              />
            )}

            {showTagsField && (
              <Box
                role="group"
                aria-label={_t('Tags')}
                aria-disabled={!canEdit}
                data-test-id="workflow-edit-node-tags"
              >
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      size="small"
                      options={projectTags}
                      getOptionLabel={(tag) => tag.label}
                      value={projectTags.filter(
                        (tag) => field.value?.includes(tag.id) ?? false
                      )}
                      onChange={(_, selectedOptions) =>
                        field.onChange(
                          selectedOptions.map((option) => option.id)
                        )
                      }
                      isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                      }
                      disabled={!canEdit}
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
              </Box>
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
                        disabled={!canEdit}
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
                  InputProps={{ readOnly: !canEdit }}
                />
                <TextField
                  label={_t('Hrs. practice')}
                  variant="outlined"
                  size="small"
                  {...register('ponderation.practice')}
                  InputProps={{ readOnly: !canEdit }}
                />
              </Stack>
              <TextField
                label={_t('Hrs. individual')}
                variant="outlined"
                size="small"
                {...register('ponderation.individual')}
                InputProps={{ readOnly: !canEdit }}
              />
            </>
          )}
        </SC.SidebarContent>
        <SC.SidebarActions>
          {showLinkButton && (
            <Button
              variant="contained"
              color="secondary"
              onClick={
                isLinked ? removeLinkedWorkflow : toggleLinkWorkflowDialog
              }
              disabled={!canManageLinks}
            >
              {linkActionLabel}
            </Button>
          )}
          <Button variant="contained" color="secondary" disabled={!canEdit}>
            {_t('Duplicate')}
          </Button>
          <Button variant="contained" color="secondary" disabled={!canEdit}>
            {_t('Delete')}
          </Button>
        </SC.SidebarActions>
      </SC.SidebarInnerWrap>
    </form>
  )
}

export default EditNode
