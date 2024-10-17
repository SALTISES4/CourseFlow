import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { produce } from 'immer'
import { ChangeEvent, useCallback, useState } from 'react'

import { TermForm } from './types'
import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '../../../../styles'

const EditTerm = ({ title }: TermForm) => {
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
          Edit term
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
          Duplicate
        </Button>
        <Button variant="contained" color="secondary">
          Delete
        </Button>
      </SidebarActions>
    </SidebarInnerWrap>
  )
}

export default EditTerm
