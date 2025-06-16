import { CfObjectType } from '@cf/types/enum'
import Utility from '@cf/utility/Utility.class'
import { selectNodeById } from '@cfRedux/selectors/node.selector'
import { selectAllObjectSets } from '@cfRedux/selectors/objectSet.selector'
import { nodeChangeField } from '@cfRedux/slices/node.slice'
import { RootState } from '@cfRedux/store'
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
import { useToggleObjectSetNodeMutation } from '@XMLHTTP/API/workflowObjects/node.rtk'
import { useCallback, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

import optionsData from './optionsData'
import { NodeForm } from './types'

const EditNode = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const sidebarData = useSelector((state: RootState) => state.sidebar)
  const node = useSelector((state: RootState) =>
    selectNodeById(state, sidebarData.edit.id)
  )

  // these are created and attached to the parent project, they are like 'all available tags'
  const objectSets = useSelector((state: RootState) =>
    selectAllObjectSets(state)
  )
  const dispatch = useDispatch()

  const [linkedWorkflow, setLinkedWorkflow] = useState(false)

  const [mutate] = useToggleObjectSetNodeMutation()
  /*******************************************************
   * RHF
   *******************************************************/
  const formValues = {
    title: node.title,
    description: node.description,
    ponderation: {
      theory: String(node.ponderationTheory),
      practice: String(node.ponderationPractical),
      individual: String(node.ponderationIndividual),
      generalEdu: String(node.ponderationIndividual),
      specificEdu: String(node.ponderationIndividual)
    },
    contextClassification: Number(node.contextClassification) || 0, // context_classification
    taskClassification: Number(node.taskClassification) || 1, // task_classification
    amount: node.timeRequired || '', // time_required
    timeUnits: node.timeUnits || 1, // time units
    sets: node.sets || [] // node_sets
  }

  const {
    control,
    register,
    setValue,
    getValues,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty, dirtyFields }
  } = useForm<NodeForm>({
    // @todo do i need to set the defaults here?
    defaultValues: formValues
  })
  const watchedFields = watch()
  const watchObjecSets = watch('sets')
  const ponderation = watch('linkedWorkflow')
    ? watch('linkedWorkflow.ponderation')
    : watch('ponderation')

  /*******************************************************
   * LIFECYCLE
   *******************************************************/

  /*******************************************************
   * HANDLE OBJECTSETS (TAGS) ONLY
   *******************************************************/
  useEffect(() => {
    if (node && !isDirty) {
      reset(formValues)
    }
  }, [reset, isDirty, node])

  // @todo this needs work
  const debouncedDispatch = useCallback(
    debounce((data) => {
      dispatch(
        nodeChangeField({
          id: sidebarData.edit.id,
          data
        })
      )

      // dirty fields does not register?
      //      if()

      // update the server
      updateValueQuery(sidebarData.edit.id, CfObjectType.NODE, data, true)

      reset({}, { keepValues: true })
    }, 300),
    [dispatch, sidebarData.edit.id]
  )

  useEffect(() => {
    const formValues = getValues()

    if (isDirty) {
      debouncedDispatch(formValues)
    }
  }, [watchedFields, isDirty, debouncedDispatch])

  /*******************************************************
   * HANDLE OBJECTSETS (TAGS) ONLY
   *******************************************************/
  useEffect(() => {
    if (watchObjecSets.length > node.sets.length) {
      const newId = watchObjecSets.find((id) => !node.sets.includes(id))
      if (newId) {
        console.log('new id')
        mutate({ id: node.id, payload: { objectSetId: newId } })
      }
    } else if (watchObjecSets.length < node.sets.length) {
      const removedId = node.sets.find((id) => !watchObjecSets.includes(id))
      if (removedId) {
        mutate({ id: node.id, payload: { objectSetId: removedId } })
      }
    }

    // Update previousSets to currentSets after processing
  }, [watchObjecSets, node.sets])

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

  /*******************************************************
   * RENDER
   *******************************************************/
  const BottomButtons = () => (
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

  if (!node) {
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

            <FormControl fullWidth>
              <InputLabel id="context-type-select-label">Context</InputLabel>
              <Controller
                name="contextClassification"
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

            <FormControl fullWidth>
              <InputLabel id="task-type-select-label">Type of task</InputLabel>
              <Controller
                name="taskClassification"
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
              <FormControl sx={{ flexGrow: 1 }}>
                <InputLabel id="unit-type-select-label">Unit type</InputLabel>
                <Controller
                  name="timeUnits"
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
              name="sets"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  options={objectSets}
                  getOptionLabel={(option) => option.title}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  value={
                    objectSets.filter((obj) => field.value?.includes(obj.id)) ||
                    []
                  } // Sync form data to objects
                  onChange={(_, value) => {
                    const ids = value.map((v) => v.id)
                    field.onChange(ids)
                  }}
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
          <BottomButtons />
        </SC.SidebarContent>
      </SC.SidebarInnerWrap>
    </form>
  )
}

export default EditNode
