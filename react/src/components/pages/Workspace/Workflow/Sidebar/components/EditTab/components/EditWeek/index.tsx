import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { produce } from 'immer'
import { ChangeEvent, useCallback, useState } from 'react'

import { WeekForm } from './types'
import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '../../../../styles'
import SaveAsTemplate from '../SaveAsTemplate'

const EditWeek = ({ title }: WeekForm) => {
  const [state, setState] = useState({
    title,
    template: false
  })

  const onLabelChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setState(
      produce((draft) => {
        draft.title = e.target.value
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
      title="Save as personal week template"
      placeholder="Week label"
      alert="The personal template name will not overwrite the node group title. Once saved, you’ll be able to add your personal template to any course. You can find and adjust your personal template within your Library."
      onSave={onSaveTemplateClick}
      onCancel={toggleTemplateForm}
    />
  ) : (
    <SidebarInnerWrap>
      <SidebarContent>
        <SidebarTitle as="h3" variant="h6">
          Edit week
        </SidebarTitle>
        <TextField
          variant="outlined"
          label="Week label"
          size="small"
          value={state.title}
          onChange={onLabelChange}
        />
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

export default EditWeek
