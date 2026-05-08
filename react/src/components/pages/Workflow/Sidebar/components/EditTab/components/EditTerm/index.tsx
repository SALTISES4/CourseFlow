import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '@cf/components/pages/Workflow/Sidebar/styles'
import { _t } from '@cf/utility/Utility.class'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { produce } from 'immer'
import { ChangeEvent, useCallback, useState } from 'react'

const EditTerm = () => {
  const title = 'Hello there'

  const [state, setState] = useState({
    title
  })

  const onLabelChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setState(
      produce((draft) => {
        draft.title = e.target.value
      })
    )
  }, [])

  return (
    <SidebarInnerWrap>
      <SidebarContent>
        <SidebarTitle as="h3" variant="h6">
          {_t('Edit term')}
        </SidebarTitle>
        <TextField
          variant="outlined"
          label="Label"
          size="small"
          value={state.title}
          onChange={onLabelChange}
        />
      </SidebarContent>
      <SidebarActions>
        <Button variant="contained" color="secondary">
          {_t('Duplicate')}
        </Button>
        <Button variant="contained" color="secondary">
          {_t('Delete')}
        </Button>
      </SidebarActions>
    </SidebarInnerWrap>
  )
}

export default EditTerm
