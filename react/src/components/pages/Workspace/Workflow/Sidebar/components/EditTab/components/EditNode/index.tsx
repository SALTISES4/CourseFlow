import { CfObjectType } from '@cf/types/enum'
import Utility from '@cf/utility/Utility.class'
import { selectNodeById } from '@cfRedux/selectors/node.selector'
import { nodeChangeField } from '@cfRedux/slices/node.slice'
import { AppState } from '@cfRedux/types/type'
import * as SC from '@cfSidebar/styles'
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
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

import optionsData from './optionsData'
import { NodeForm } from './types'

const EditNode = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const sidebarData = useSelector((state: AppState) => state.sidebar)
  const nodeData = useSelector((state: AppState) =>
    selectNodeById(state, sidebarData.edit.id)
  )
  const dispatch = useDispatch()

  const [linkedWorkflow, setLinkedWorkflow] = useState(false)

  const {
    control,
    register,
    setValue,
    getValues,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty }
  } = useForm<NodeForm>({
    defaultValues: {
      title: nodeData.node.title,
      description: nodeData.node.description,
      ponderation: {
        theory: String(nodeData.node.ponderationTheory),
        practice: String(nodeData.node.ponderationPractical),
        individual: String(nodeData.node.ponderationIndividual),
        generalEdu: String(nodeData.node.ponderationGeneralEdu),
        specificEdu: String(nodeData.node.ponderationSpecificEdu)
      },
      contextType: nodeData.node.contextClassification || '',
      taskType: nodeData.node.taskClassification || '',
      amount: nodeData.node.amount || '',
      unitType: nodeData.node.unitType || '',
      objectSets: nodeData.node.sets || []
    }
  })

  const watchedFields = watch()

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  useEffect(() => {
    if (nodeData && !isDirty) {
      reset({
        title: nodeData.node.title,
        description: nodeData.node.description,
        ponderation: {
          theory: String(nodeData.node.ponderationTheory),
          practice: String(nodeData.node.ponderationPractical),
          individual: String(nodeData.node.ponderationIndividual),
          generalEdu: String(nodeData.node.ponderationGeneralEdu),
          specificEdu: String(nodeData.node.ponderationSpecificEdu)
        },
        contextType: nodeData.node.contextClassification || '',
        taskType: nodeData.node.taskClassification || '',
        amount: nodeData.node.amount || '',
        unitType: nodeData.node.unitType || '',
        objectSets: nodeData.node.sets || []
      })
    }
  }, [reset, isDirty, nodeData])

  const debouncedDispatch = useMemo(
    () =>
      debounce((data) => {
        // update redux state
        dispatch(
          nodeChangeField({
            id: sidebarData.edit.id,
            data: {
              title: data.title,
              description: data.description
            }
          })
        )

        // update the server
        updateValueQuery(sidebarData.edit.id, CfObjectType.NODE, data, true)

        reset({}, { keepValues: true })
      }, 300),
    [dispatch, reset, sidebarData.edit.id]
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

  const toggleUseLinkWorkflowData = () => {
    setLinkedWorkflow(!linkedWorkflow)
  }

  const removeLinkedWorkflow = () => {
    setLinkedWorkflow(false)
    setValue('linkedWorkflow', undefined)
  }

  const ponderation = watch('linkedWorkflow')
    ? watch('linkedWorkflow.ponderation')
    : watch('ponderation')
  /*******************************************************
   * RENDER
   *******************************************************/

  const Temp = (
    <SC.SidebarActions>
      <Button
        variant="contained"
        color="secondary"
        onClick={
          watch('linkedWorkflow')
            ? removeLinkedWorkflow
            : toggleUseLinkWorkflowData
        }
      >
        {!watch('linkedWorkflow') ? 'Link workflow' : 'Remove linked workflow'}
      </Button>
      <Button variant="contained" color="secondary">
        Duplicate
      </Button>
      <Button variant="contained" color="secondary">
        Delete
      </Button>
    </SC.SidebarActions>
  )

  if (!nodeData) {
    return <></>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SC.SidebarInnerWrap>
        <SC.SidebarContent>
          <SC.SidebarTitle as="h3" variant="h6">
            Edit node
          </SC.SidebarTitle>

          {watch('linkedWorkflow') && (
            <Stack sx={{ mb: 3 }} gap={2}>
              <div>
                <Chip
                  label={watch('linkedWorkflow.title')}
                  onDelete={removeLinkedWorkflow}
                />
              </div>
              <FormControlLabel
                label="Use linked worfklow info"
                control={
                  <Switch
                    checked={linkedWorkflow}
                    onChange={toggleUseLinkWorkflowData}
                    size="small"
                  />
                }
              />
            </Stack>
          )}

          <Stack direction="column" spacing={3}>
            {!linkedWorkflow && (
              <>
                <TextField
                  label="Title"
                  variant="outlined"
                  size="small"
                  {...register('title', { required: 'Title is required' })}
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
                <TextField
                  label="Description"
                  variant="outlined"
                  size="small"
                  multiline
                  maxRows={5}
                  {...register('description')}
                />
              </>
            )}

            <FormControl fullWidth size="small">
              <InputLabel id="context-type-select-label">Context</InputLabel>
              <Controller
                name="contextType"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label="Context"
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
              <InputLabel id="task-type-select-label">Type of task</InputLabel>
              <Controller
                name="taskType"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label="Type of task"
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
                label="Amount"
                variant="outlined"
                size="small"
                {...register('amount')}
                sx={{ flexBasis: '35%' }}
              />
              <FormControl sx={{ flexGrow: 1 }} size="small">
                <InputLabel id="unit-type-select-label">Unit type</InputLabel>
                <Controller
                  name="unitType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Unit type"
                      labelId="unit-type-select-label"
                    >
                      {optionsData.unitTypes.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Stack>

            <Controller
              name="objectSets"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  size="small"
                  options={optionsData.objectSets}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) =>
                    option.value === value.value
                  }
                  onChange={(_, value) => field.onChange(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label="Object sets"
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
                Ponderation
              </Typography>
              <Stack direction="row" gap={2} sx={{ mb: 2 }}>
                <TextField
                  label="Hrs. theory"
                  variant="outlined"
                  size="small"
                  {...register('ponderation.theory')}
                />
                <TextField
                  label="Hrs. practice"
                  variant="outlined"
                  size="small"
                  {...register('ponderation.practice')}
                />
              </Stack>
              <TextField
                label="Hrs. individual"
                variant="outlined"
                size="small"
                {...register('ponderation.individual')}
              />
              <Divider sx={{ mt: 3, mb: 3 }} />
              <Stack direction="column" spacing={2}>
                <TextField
                  label="General education"
                  variant="outlined"
                  size="small"
                  {...register('ponderation.generalEdu')}
                />
                <TextField
                  label="Specific education"
                  variant="outlined"
                  size="small"
                  {...register('ponderation.specificEdu')}
                />
              </Stack>
            </>
          )}
        </SC.SidebarContent>
      </SC.SidebarInnerWrap>
    </form>
  )
}

export default EditNode
