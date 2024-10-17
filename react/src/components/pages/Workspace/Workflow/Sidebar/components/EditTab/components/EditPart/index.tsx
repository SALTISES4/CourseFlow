import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { produce } from 'immer'
import { ChangeEvent, useCallback, useState } from 'react'

import { PartForm } from './types'
import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '../../../../styles'
import SaveAsTemplate from '../SaveAsTemplate'
import strategies from './data'

const EditPart = ({ title, strategy }: PartForm) => {
  const [state, setState] = useState({
    title,
    strategy,
    template: false
  })

  const onLabelChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setState(
      produce((draft) => {
        draft.title = e.target.value
      })
    )
  }, [])

  const onSttrategyChange = useCallback((e: SelectChangeEvent) => {
    setState(
      produce((draft) => {
        draft.strategy = Number(e.target.value)
      })
    )
  }, [])

  const toggleTemplateForm = useCallback(() => {
    setState(
      produce((draft) => {
        draft.template = !draft.template
      })
    )
  }, [])

  const onSaveTemplateClick = useCallback(
    (label: string) => {
      console.log('saving template with label:', label)
      toggleTemplateForm()
    },
    [toggleTemplateForm]
  )

  return state.template ? (
    <SaveAsTemplate
      title="Save as personal part template"
      placeholder="Template name"
      alert="The personal part template name will not overwrite the current activity part title. Once saved, you’ll be able to add your personal part template to any course, from the “Add” tab. When adding your personal part template to other activities, you’ll be able to overwrite its name within each course."
      onSave={onSaveTemplateClick}
      onCancel={toggleTemplateForm}
    />
  ) : (
    <SidebarInnerWrap>
      <SidebarContent>
        <SidebarTitle as="h3" variant="h6">
          Edit part
        </SidebarTitle>
        <Stack direction="column" gap={3}>
          <TextField
            variant="outlined"
            label="Week label"
            size="small"
            value={state.title}
            onChange={onLabelChange}
          />

          <FormControl fullWidth>
            <InputLabel id="strategy-select-label">Strategy</InputLabel>
            <Select
              size="small"
              label="Strategy"
              labelId="strategy-select-label"
              value={state.strategy.toString()}
              onChange={onSttrategyChange}
            >
              {strategies.map((strat) => (
                <MenuItem value={strat.value}>{strat.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </SidebarContent>
      <SidebarActions>
        <Button
          variant="contained"
          color="secondary"
          onClick={toggleTemplateForm}
        >
          Save as personal template
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

export default EditPart
