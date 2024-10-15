import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { produce } from 'immer'
import { ChangeEvent, useCallback, useState } from 'react'

import { OutcomeForm } from './types'
import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '../../../../styles'

// dummy data
import data from '../EditNode/data'
const objectSetOptions = data.objectSets

const EditOutcome = (props: OutcomeForm) => {
  const [state, setState] = useState(props)

  const onFieldChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setState(
      produce((draft) => {
        const key = e.target.name as 'title' | 'description' | 'code'
        draft[key] = e.target.value
      })
    )
  }, [])

  return (
    <SidebarInnerWrap>
      <SidebarContent>
        <SidebarTitle as="h3" variant="h6">
          Edit outcome
        </SidebarTitle>
        <Stack direction="column" gap={3}>
          <TextField
            required
            variant="outlined"
            label="Title"
            size="small"
            name="title"
            value={state.title}
            onChange={onFieldChange}
          />
          <TextField
            variant="outlined"
            label="Description"
            size="small"
            name="description"
            multiline
            maxRows={5}
            value={state.description}
            onChange={onFieldChange}
          />
          {props.code && (
            <TextField
              variant="outlined"
              label="Code"
              size="small"
              name="code"
              value={state.code}
              onChange={onFieldChange}
            />
          )}
          {props.objectSets && (
            <Autocomplete
              multiple
              size="small"
              options={objectSetOptions}
              onChange={(_, v) => console.log('changed to', v)}
              isOptionEqualToValue={(option, value) =>
                option.value === value.value
              }
              defaultValue={objectSetOptions.filter((o) =>
                props.objectSets!.includes(o.value)
              )}
              renderInput={(params) => (
                <TextField {...params} variant="outlined" label="Object sets" />
              )}
            />
          )}
        </Stack>
      </SidebarContent>
      <SidebarActions>
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

export default EditOutcome
