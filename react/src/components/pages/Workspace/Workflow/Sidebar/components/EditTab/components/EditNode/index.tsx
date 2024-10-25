import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { produce } from 'immer'
import { ChangeEvent, useCallback, useState } from 'react'

import optionsData from './data'
import { NodeForm } from './types'
import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '../../../../styles'

const EditNode = (props: NodeForm) => {
  const [linkedWorkflow, setLinkedWorkflow] = useState(false)
  const [state, setState] = useState(props)

  const onTextFieldChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setState(
      produce((draft) => {
        const key = e.target.name as 'title' | 'description' | 'amount'
        if (key === 'amount') {
          draft[key] = Number(e.target.value)
        } else {
          draft[key] = e.target.value
        }
      })
    )
  }, [])

  const onSelectChange = useCallback((e: SelectChangeEvent) => {
    setState(
      produce((draft) => {
        const key = e.target.name as 'taskType' | 'contextType' | 'unitType'
        draft[key] = Number(e.target.value)
        console.log(e.target.name, 'changed to', e.target.value)
      })
    )
  }, [])

  const onPonderationChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setState(
        produce((draft) => {
          if (draft.ponderation) {
            const key = e.target.name as keyof typeof draft.ponderation
            draft.ponderation[key] = e.target.value
          }
        })
      )
    },
    []
  )

  const onLinkWorfklowClick = useCallback(() => {
    console.log('trigger link workflow dialog')
  }, [])

  const removeLinkedWorkflow = useCallback(() => {
    setLinkedWorkflow(false)
    setState(
      produce((draft) => {
        draft.linkedWorkflow = undefined
      })
    )
  }, [])

  const toggleUseLinkWorfklowData = useCallback(() => {
    setLinkedWorkflow(!linkedWorkflow)
  }, [linkedWorkflow])

  // read ponderation data from linked workflow or state
  const ponderation = linkedWorkflow
    ? state.linkedWorkflow?.ponderation
    : state.ponderation

  return (
    <SidebarInnerWrap>
      <SidebarContent>
        <SidebarTitle as="h3" variant="h6">
          Edit node
        </SidebarTitle>
        {state.linkedWorkflow && (
          <Stack sx={{ mb: 3 }} gap={2}>
            <div>
              <Chip
                label={state.linkedWorkflow.title}
                onDelete={removeLinkedWorkflow}
              />
            </div>
            <FormControlLabel
              label="Use linked worfklow info"
              control={
                <Switch
                  checked={linkedWorkflow}
                  onChange={toggleUseLinkWorfklowData}
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
                name="title"
                required
                label="Title"
                variant="outlined"
                size="small"
                value={state.title}
                onChange={onTextFieldChange}
              />
              <TextField
                name="description"
                label="Description"
                variant="outlined"
                size="small"
                value={state.description}
                multiline
                maxRows={5}
                onChange={onTextFieldChange}
              />
            </>
          )}
          <FormControl fullWidth>
            <InputLabel id="context-type-select-label">Context</InputLabel>
            <Select
              name="context"
              size="small"
              label="Context"
              labelId="context-type-select-label"
              value={state.contextType.toString()}
              onChange={onSelectChange}
            >
              {optionsData.contexts.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="task-type-select-label">Type of task</InputLabel>
            <Select
              name="taskType"
              size="small"
              label="Type of task"
              labelId="task-type-select-label"
              value={state.taskType.toString()}
              onChange={onSelectChange}
            >
              {optionsData.taskTypes.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" gap={2}>
            <TextField
              name="amount"
              label="Amount"
              variant="outlined"
              size="small"
              value={state.amount}
              onChange={onTextFieldChange}
              sx={{ flexBasis: '35%' }}
            />
            <FormControl sx={{ flexGrow: 1 }}>
              <InputLabel id="unit-type-select-label">Unit type</InputLabel>
              <Select
                name="unitType"
                size="small"
                label="Unit type"
                labelId="unit-type-select-label"
                value={state.unitType.toString()}
                onChange={onSelectChange}
              >
                {optionsData.unitTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Autocomplete
            multiple
            size="small"
            options={optionsData.objectSets}
            onChange={(_, v) => console.log('changed to', v)}
            isOptionEqualToValue={(option, value) =>
              option.value === value.value
            }
            defaultValue={optionsData.objectSets.filter((o) =>
              state.objectSets.includes(o.value)
            )}
            renderInput={(params) => (
              <TextField {...params} variant="outlined" label="Object sets" />
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
                disabled={!!linkedWorkflow}
                name="theory"
                label="Hrs. theory"
                variant="outlined"
                size="small"
                value={ponderation.theory}
                onChange={onPonderationChange}
              />
              <TextField
                disabled={!!linkedWorkflow}
                name="practice"
                label="Hrs. practice"
                variant="outlined"
                size="small"
                value={ponderation.practice}
                onChange={onPonderationChange}
              />
            </Stack>
            <TextField
              disabled={!!linkedWorkflow}
              name="individual"
              label="Hrs. individual"
              variant="outlined"
              size="small"
              value={ponderation.individual}
              onChange={onPonderationChange}
            />
            <Divider sx={{ mt: 3, mb: 3 }} />
            <Stack direction="column" spacing={2}>
              <TextField
                disabled={!!linkedWorkflow}
                name="generalEdu"
                label="General education"
                variant="outlined"
                size="small"
                value={ponderation.generalEdu}
                onChange={onPonderationChange}
              />
              <TextField
                disabled={!!linkedWorkflow}
                name="specificEdu"
                label="Specific education"
                variant="outlined"
                size="small"
                value={ponderation.specificEdu}
                onChange={onPonderationChange}
              />
            </Stack>
          </>
        )}
      </SidebarContent>
      <SidebarActions>
        <Button
          variant="contained"
          color="secondary"
          onClick={
            state.linkedWorkflow ? removeLinkedWorkflow : onLinkWorfklowClick
          }
        >
          {!state.linkedWorkflow ? 'Link workflow' : 'Remove linked workflow'}
        </Button>
        <Button variant="contained" color="secondary">
          Duplicate
        </Button>
        <Button variant="contained" color="secondary">
          Delete
        </Button>
      </SidebarActions>
    </SidebarInnerWrap>
  )
}

export default EditNode
