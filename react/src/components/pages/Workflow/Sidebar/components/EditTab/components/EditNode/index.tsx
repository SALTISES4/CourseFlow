import * as SC from '@cf/components/pages/Workflow/Sidebar/styles'
import type {
  NodeEntity,
  WorkflowEntity
} from '@cf/features/graph/state/model/types'
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
import { debounce } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
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
import { useCallback, useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

import optionsData from './optionsData'
import * as Styled from './styles'
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

  if (!node) {
    return null
  }

  const graphSelector = useMemo(
    () => selectGraphByUuid(node.graphUuid),
    [node.graphUuid]
  )
  const graph = useSelector(graphSelector)
  const linkedWorkflowSelector = useMemo(
    () =>
      node.workflowUuid
        ? selectWorkflowByUuid(node.workflowUuid)
        : () => undefined,
    [node.workflowUuid]
  )
  const linkedWorkflowEntity = useSelector(linkedWorkflowSelector)
  const isExplicitlyLinked = Boolean(
    node.workflowUuid &&
      graph?.workflowUuid &&
      node.workflowUuid !== graph.workflowUuid
  )
  const linkedWorkflow = isExplicitlyLinked ? linkedWorkflowEntity : undefined

  return (
    <EditNodeForm
      node={node}
      graphUuid={node.graphUuid}
      linkedWorkflow={linkedWorkflow}
    />
  )
}

const EditNodeForm = ({
  node,
  graphUuid,
  linkedWorkflow
}: {
  node: NodeEntity
  graphUuid: string
  linkedWorkflow?: WorkflowEntity
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { dispatch: dialogDispatch } = useDialog()

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
      timeUnits: node.timeUnits ?? '',
      tags: node.tagIds ?? []
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
        timeUnits: node.timeUnits ?? '',
        tags: node.tagIds ?? []
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
        const timeRequired =
          data.timeRequired === '' ||
          data.timeRequired === null ||
          data.timeRequired === undefined
            ? null
            : Number(data.timeRequired)
        const timeUnits =
          data.timeUnits === '' || data.timeUnits === null
            ? null
            : Number(data.timeUnits)

        void dispatch(
          changeNodeMeta({
            graphUuid,
            nodeUuid: node.uuid,
            meta: {
              title: data.title,
              description: data.description,
              contextClassification,
              taskClassification,
              timeRequired: Number.isNaN(timeRequired) ? null : timeRequired,
              timeUnits: Number.isNaN(timeUnits) ? null : timeUnits,
              tagIds: data.tags.map((id) => Number(id))
            }
          })
        )

        reset({}, { keepValues: true })
      }, 300),
    [dispatch, graphUuid, node.uuid, reset]
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

  const toggleRepresentWorkflow = useCallback(
    (_, checked: boolean) => {
      void dispatch(
        changeNodeMeta({
          graphUuid,
          nodeUuid: node.uuid,
          meta: { representsWorkflow: checked }
        })
      )
    },
    [dispatch, graphUuid, node.uuid]
  )

  const ponderation = watch('ponderation')

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SC.SidebarInnerWrap>
        <SC.SidebarContent>
          <SC.SidebarTitle as="h3" variant="h6">
            {_t('Edit node')}
          </SC.SidebarTitle>

          {linkedWorkflow && (
            <Styled.LinkedWorkflowTooltip>
              <Chip
                label={linkedWorkflow.title}
                onDelete={removeLinkedWorkflow}
              />
              <FormControlLabel
                label={_t('Use linked worfklow info')}
                control={
                  <Switch
                    checked={node.representsWorkflow}
                    onChange={toggleRepresentWorkflow}
                    size="small"
                  />
                }
              />
            </Styled.LinkedWorkflowTooltip>
          )}

          <Stack direction="column" spacing={3}>
            {!node.representsWorkflow && (
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

            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  size="small"
                  options={optionsData.tags}
                  getOptionLabel={(tag) => tag.label}
                  value={optionsData.tags.filter((tag) =>
                    field.value.includes(tag.uuid)
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
          </Stack>

          {!!ponderation && (
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
              <Divider sx={{ mt: 3, mb: 3 }} />
              <Stack direction="column" spacing={2}>
                <TextField
                  label={_t('General education')}
                  variant="outlined"
                  size="small"
                  {...register('ponderation.generalEdu')}
                />
                <TextField
                  label={_t('Specific education')}
                  variant="outlined"
                  size="small"
                  {...register('ponderation.specificEdu')}
                />
              </Stack>
            </>
          )}
        </SC.SidebarContent>
        <SC.SidebarActions>
          <Button
            variant="contained"
            color="secondary"
            onClick={
              linkedWorkflow ? removeLinkedWorkflow : toggleLinkWorkflowDialog
            }
          >
            {!linkedWorkflow
              ? _t('Link workflow')
              : _t('Remove linked workflow')}
          </Button>
          <Button variant="contained" color="secondary">
            {_t('Duplicate')}
          </Button>
          <Button variant="contained" color="secondary">
            {_t('Delete')}
          </Button>
        </SC.SidebarActions>
      </SC.SidebarInnerWrap>
    </form>
  )
}

export default EditNode
