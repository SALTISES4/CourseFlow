import {
  getWorkflowOptions,
  listProjectTagsOptions
} from '@cf/api/gen/@tanstack/react-query.gen'
import { WorkflowPermission } from '@cf/api/gen/types.gen'
import DurationTextField from '@cf/components/common/DurationTextField'
import WysiwygField from '@cf/components/common/UIPrimitives/WysiwygInput'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import type { NodeEntity } from '@cf/features/graph/state/model/types'
import type { NodeInsertMode } from '@cf/features/graph/state/resolveNodeDropRow'
import {
  selectGraphByUuid,
  selectNodeByUuid,
  selectWorkflowByUuid
} from '@cf/features/graph/state/selectors/canonical.selectors'
import {
  changeNodeMeta,
  deleteNode,
  insertNodeBelow,
  linkNodeWorkflow
} from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { sidebarChangeTab } from '@cf/features/sidebar/state/sidebar.slice'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import type { AppDispatch, RootState } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import * as SC from '@cfSidebar/styles'
import InsertMenu from '@cfViews/WorkflowView/GraphView/components/Section/Cell/InsertMenu'
import { debounce } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

import LinkedWorkflowMirrorFields from './LinkedWorkflowMirrorFields'
import {
  canLinkWorkflow,
  linkWorkflowActionLabel,
  nodeTitleFallback
} from './linkedWorkflowUi'
import optionsData from './optionsData'
import type { NodeForm } from './types'

const toNullableNumber = (value: unknown): number | null => {
  if (value === '' || value === null || value === undefined) {
    return null
  }
  const number = Number(value)
  return Number.isNaN(number) ? null : number
}

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

  const linkedWorkflowSelector = useMemo(
    () =>
      node?.linkedWorkflowUuid
        ? selectWorkflowByUuid(node.linkedWorkflowUuid)
        : () => undefined,
    [node?.linkedWorkflowUuid]
  )
  const linkedWorkflowCache = useSelector(linkedWorkflowSelector)

  const { data: parentWorkflowResp } = useQuery({
    ...getWorkflowOptions({
      path: { uuid: graph?.workflowUuid ?? '' }
    }),
    enabled: Boolean(graph?.workflowUuid)
  })

  if (!node) {
    return null
  }

  return (
    <EditNodeForm
      key={node.uuid}
      node={node}
      graphUuid={node.graphUuid}
      parentWorkflowType={graph?.workflowType ?? null}
      projectUuid={parentWorkflowResp?.item.projectUuid ?? null}
      linkedWorkflowTitle={linkedWorkflowCache?.title}
    />
  )
}

const EditNodeForm = ({
  node,
  graphUuid,
  parentWorkflowType,
  projectUuid,
  linkedWorkflowTitle
}: {
  node: NodeEntity
  graphUuid: string
  parentWorkflowType: string | null
  projectUuid: string | null
  linkedWorkflowTitle?: string
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { dispatch: dialogDispatch } = useDialog()
  const canEdit = useResourcePermission(WorkflowPermission.NODE_MANAGEMENT)
  const canLink = useResourcePermission(WorkflowPermission.NODE_LINK_MANAGEMENT)
  const insertMode = useSelector(
    (state: RootState) => state.graph.graphUi.nodeInsertMode
  )
  const [duplicateMenuAnchor, setDuplicateMenuAnchor] =
    useState<HTMLElement | null>(null)

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
  const linkedMetadata = linkedWorkflowDetail?.overviewMetadata

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
    subscribe,
    formState: { errors }
  } = useForm<NodeForm>({
    defaultValues: {
      title: node.title,
      description: node.description,
      ponderation: {
        theory: String(node.ponderationTheory ?? ''),
        practice: String(node.ponderationPractice ?? ''),
        individual: String(node.ponderationIndividual ?? ''),
        generalEdu: '0',
        specificEdu: '0'
      },
      contextType: node.contextClassification ?? '',
      taskType: node.taskClassification ?? '',
      timeRequired: node.timeRequired ?? undefined,
      tags: node.tagIds ?? [],
      credits: node.credits ?? '',
      specificEducation: node.specificEducation
    }
  })

  const debouncedDispatch = useMemo(
    () =>
      debounce((data: NodeForm) => {
        if (!canEdit) {
          return
        }

        const meta: Parameters<typeof changeNodeMeta>[0]['meta'] = {
          tagIds: (data.tags ?? []).map(Number)
        }

        if (!isLinked) {
          meta.title = data.title
          meta.description = data.description
          meta.timeRequired = toNullableNumber(data.timeRequired)

          if (isCourseParent || isActivityParent) {
            meta.contextClassification = toNullableNumber(data.contextType)
          }
          if (isActivityParent) {
            meta.taskClassification = toNullableNumber(data.taskType)
          }
          if (isProgramParent) {
            meta.credits = toNullableNumber(data.credits)
            meta.ponderationTheory = toNullableNumber(data.ponderation?.theory)
            meta.ponderationPractice = toNullableNumber(
              data.ponderation?.practice
            )
            meta.ponderationIndividual = toNullableNumber(
              data.ponderation?.individual
            )
            meta.specificEducation = Boolean(data.specificEducation)
          }
        } else if (isCourseParent) {
          meta.contextClassification = toNullableNumber(data.contextType)
        } else if (isProgramParent) {
          meta.specificEducation = Boolean(data.specificEducation)
        }

        void dispatch(
          changeNodeMeta({
            graphUuid,
            nodeUuid: node.uuid,
            meta
          })
        )
      }, 300),
    [
      canEdit,
      dispatch,
      graphUuid,
      isActivityParent,
      isCourseParent,
      isLinked,
      isProgramParent,
      node.uuid
    ]
  )

  useEffect(() => {
    const unsubscribe = subscribe({
      formState: { values: true },
      callback: ({ values }) => debouncedDispatch(values as NodeForm)
    })

    return () => {
      unsubscribe()
      debouncedDispatch.clear()
    }
  }, [subscribe, debouncedDispatch])

  const toggleLinkWorkflowDialog = useCallback(() => {
    if (!canLink) {
      return
    }
    dialogDispatch(DialogMode.NODE_LINK_WORKFLOW, {
      uuid: node.uuid,
      graphUuid
    })
  }, [canLink, dialogDispatch, graphUuid, node.uuid])

  const removeLinkedWorkflow = useCallback(() => {
    if (!canLink) {
      return
    }
    void dispatch(
      linkNodeWorkflow({
        graphUuid,
        nodeUuid: node.uuid,
        workflowUuid: null
      })
    )
  }, [canLink, dispatch, graphUuid, node.uuid])

  const duplicate = useCallback(
    (mode: Exclude<NodeInsertMode, 'manual'>) => {
      if (!canEdit) {
        return
      }
      void dispatch(
        insertNodeBelow({
          graphUuid,
          nodeUuid: node.uuid,
          mode,
          duplicate: true
        })
      )
      setDuplicateMenuAnchor(null)
    },
    [canEdit, dispatch, graphUuid, node.uuid]
  )

  const onDuplicate = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (!canEdit) {
        return
      }
      if (insertMode === 'manual') {
        setDuplicateMenuAnchor(event.currentTarget)
        return
      }
      duplicate(insertMode)
    },
    [canEdit, duplicate, insertMode]
  )

  const onDelete = useCallback(() => {
    if (!canEdit) {
      return
    }
    void dispatch(deleteNode({ graphUuid, nodeUuid: node.uuid }))
  }, [canEdit, dispatch, graphUuid, node.uuid])

  const contextOptions = isCourseParent
    ? optionsData.courseContexts
    : optionsData.activityContexts
  const linkActionLabel = linkWorkflowActionLabel(parentWorkflowType, isLinked)
  const showContextField = isCourseParent || isActivityParent
  const showTaskTypeField = isActivityParent && !isLinked
  const showEditableFields = !isLinked
  const showTagsField = isCourseParent || isActivityParent || isProgramParent
  const showProgramFields = isProgramParent && !isLinked

  return (
    <SC.SidebarInnerWrap as="form" onSubmit={handleSubmit(() => undefined)}>
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
            time={linkedMetadata?.time}
            credits={linkedMetadata?.credits}
            ponderationTheory={linkedMetadata?.theoryTime}
            ponderationPractice={linkedMetadata?.practicalTime}
            ponderationIndividual={linkedMetadata?.individualTime}
          />
        )}

        <Stack direction="column" spacing={3} sx={{ mt: isLinked ? 3 : 0 }}>
          {showEditableFields && (
            <>
              <TextField
                label={_t('Title')}
                variant="outlined"
                size="small"
                {...register('title', { required: _t('Title is required') })}
                error={!!errors.title}
                helperText={errors.title?.message}
                InputProps={{ readOnly: !canEdit }}
              />
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <WysiwygField
                    placeholder={_t('Description')}
                    field={field}
                    readOnly={!canEdit}
                  />
                )}
              />
            </>
          )}

          {showContextField && (
            <FormControl fullWidth size="small" disabled={!canEdit}>
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
                    {contextOptions.map((option) => (
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
            <FormControl fullWidth size="small" disabled={!canEdit}>
              <InputLabel id="task-type-select-label">{_t('Type')}</InputLabel>
              <Controller
                name="taskType"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label={_t('Type')}
                    labelId="task-type-select-label"
                  >
                    {optionsData.activityTaskTypes.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          )}

          {showEditableFields && (
            <Controller
              name="timeRequired"
              control={control}
              render={({ field }) => (
                <DurationTextField
                  label={_t('Time')}
                  value={field.value}
                  readOnly={!canEdit}
                  fullWidth
                  onValueChange={field.onChange}
                  onValueCommit={field.onBlur}
                />
              )}
            />
          )}

          {showProgramFields && (
            <TextField
              label={_t('Credits')}
              variant="outlined"
              size="small"
              type="number"
              {...register('credits')}
              InputProps={{ readOnly: !canEdit }}
            />
          )}
        </Stack>

        {showProgramFields && (
          <>
            <Divider sx={{ mt: 3 }} />
            <Typography
              component="h6"
              variant="body2"
              sx={{ mt: 1, mb: 3, fontWeight: 600 }}
            >
              {_t('Ponderation')}
            </Typography>
            <Grid container rowSpacing={2} columnSpacing={1} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <TextField
                  label={_t('Hrs. theory')}
                  variant="outlined"
                  size="small"
                  type="number"
                  {...register('ponderation.theory')}
                  InputProps={{ readOnly: !canEdit }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label={_t('Hrs. practice')}
                  variant="outlined"
                  size="small"
                  type="number"
                  {...register('ponderation.practice')}
                  InputProps={{ readOnly: !canEdit }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label={_t('Hrs. individual')}
                  variant="outlined"
                  size="small"
                  type="number"
                  {...register('ponderation.individual')}
                  InputProps={{ readOnly: !canEdit }}
                />
              </Grid>
            </Grid>
          </>
        )}

        <Stack
          direction="column"
          gap={3}
          sx={{ mt: showProgramFields ? 0 : 3 }}
        >
          {isProgramParent && (
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
                      disabled={!canEdit}
                      size="small"
                    />
                  )}
                />
              }
            />
          )}

          {showTagsField && (
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <div
                  role="group"
                  aria-disabled={!canEdit}
                  data-test-id="workflow-edit-node-tags"
                  style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}
                >
                  <Autocomplete
                    multiple
                    fullWidth
                    size="small"
                    disabled={!canEdit}
                    options={projectTags}
                    getOptionLabel={(tag) => tag.label}
                    value={projectTags.filter((tag) =>
                      field.value?.includes(tag.id)
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
                </div>
              )}
            />
          )}
        </Stack>
      </SC.SidebarContent>

      <SC.SidebarActions>
        {showLinkButton && (
          <Button
            type="button"
            variant="contained"
            color="secondary"
            disabled={!canLink}
            onClick={isLinked ? removeLinkedWorkflow : toggleLinkWorkflowDialog}
          >
            {linkActionLabel}
          </Button>
        )}
        <Button
          type="button"
          variant="contained"
          color="secondary"
          disabled={!canEdit}
          onClick={onDuplicate}
        >
          {_t('Duplicate')}
        </Button>
        <Button
          type="button"
          variant="contained"
          color="secondary"
          disabled={!canEdit}
          onClick={onDelete}
        >
          {_t('Delete')}
        </Button>
        <InsertMenu
          anchorEl={duplicateMenuAnchor}
          onOption={duplicate}
          onClose={() => setDuplicateMenuAnchor(null)}
        />
      </SC.SidebarActions>
    </SC.SidebarInnerWrap>
  )
}

export default EditNode
