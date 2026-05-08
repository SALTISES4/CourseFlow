import * as SC from '@cf/components/pages/Workflow/Sidebar/styles'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { selectNodeById } from '@cf/redux/selectors/node.selector'
import {
  nodeChangeField,
  nodeSetLinkedWorkflow
} from '@cf/redux/slices/node.slice'
import { sidebarChangeTab } from '@cf/redux/slices/sidebar.slice'
import { RootState } from '@cf/redux/store'
import { TNode } from '@cf/redux/types/type'
import { CfObjectType } from '@cf/types/enum'
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
import { updateValueQuery } from '@XMLHTTP/API/update'
import { useCallback, useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

import optionsData from './optionsData'
import * as Styled from './styles'
import { NodeForm } from './types'

const EditNode = ({ nodeId }: { nodeuuid: string }) => {
  const dispatch = useDispatch()
  const node = useSelector((state: RootState) => selectNodeById(state, nodeId))

  if (!node) {
    dispatch(sidebarChangeTab({ tab: null, collapsed: true }))
    return null
  }

  return <EditNodeForm node={node} />
}

const EditNodeForm = ({ node }: { node: TNode }) => {
  const dispatch = useDispatch()
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
        theory: String(node.ponderationTheory),
        practice: String(node.ponderationPractical),
        individual: String(node.ponderationIndividual)
        // TODO: where do these come from?
        // generalEdu: String(nodeData.node.ponderationGeneralEdu),
        // specificEdu: String(nodeData.node.ponderationSpecificEdu)
      },
      contextType: node.contextClassification || '',
      taskType: node.taskClassification || '',
      timeRequired: node.timeRequired,
      timeUnits: node.timeUnits,
      tags: node.tags || []
    }
  })

  const watchedFields = watch()

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  useEffect(() => {
    if (!isDirty) {
      reset({
        title: node.title,
        description: node.description,
        ponderation: {
          theory: String(node.ponderationTheory),
          practice: String(node.ponderationPractical),
          individual: String(node.ponderationIndividual)
          // TODO: where do these come from?
          // generalEdu: String(nodeData.node.ponderationGeneralEdu),
          // specificEdu: String(nodeData.node.ponderationSpecificEdu)
        },
        contextType: node.contextClassification || '',
        taskType: node.taskClassification || '',
        timeRequired: node.timeRequired,
        timeUnits: node.timeUnits,
        tags: node.tags || []
      })
    }
  }, [reset, isDirty, node])

  const debouncedDispatch = useMemo(
    () =>
      debounce((data: NodeForm) => {
        // update redux state
        dispatch(
          nodeChangeField({
            uuid: node.uuid,
            data: {
              title: data.title,
              description: data.description,
              contextClassification: parseInt(data.contextType.toString(), 10),
              taskClassification: parseInt(data.taskType.toString(), 10),
              timeRequired: data.timeRequired,
              timeUnits: data.timeUnits,
              tags: data.tags
            }
          })
        )

        // update the server
        // updateValueQuery(node.uuid, CfObjectType.NODE, data, true)

        reset({}, { keepValues: true })
      }, 300),
    [dispatch, reset, node.uuid]
  )

  useEffect(() => {
    if (isDirty) {
      debouncedDispatch(watchedFields)
    }
  }, [watchedFields, isDirty, debouncedDispatch])

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  const onSubmit = (data: NodeForm) => {
    Utility.logger('Form submitted with data:', data)
  }

  const toggleLinkWorkflowDialog = useCallback(() => {
    dialogDispatch(DialogMode.NODE_LINK_WORKFLOW, { uuid: node.uuid })
  }, [dialogDispatch, node.uuid])

  const removeLinkedWorkflow = useCallback(() => {
    dispatch(
      nodeSetLinkedWorkflow({
        nodeId: node.uuid,
        workflowId: null,
        workflowData: null,
        representsWorkflow: false
      })
    )
  }, [dispatch, node.uuid])

  const toggleRepresentWorkflow = useCallback(
    (_, checked: boolean) => {
      dispatch(
        nodeChangeField({
          uuid: node.uuid,
          data: {
            representsWorkflow: checked
          }
        })
      )
    },
    [dispatch, node.uuid]
  )

  // TODO: seems wrong, investigate where this comes from with MC
  const ponderation = watch('linkedWorkflow')
    ? watch('linkedWorkflow.ponderation')
    : watch('ponderation')

  const linkedWorkflow = node.linkedWorkflowData

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
