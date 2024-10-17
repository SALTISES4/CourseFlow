import ColorPicker from '@cfComponents/UIPrimitives/ColorPicker'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { produce } from 'immer'
import { ChangeEvent, useCallback, useState } from 'react'

import { NodeCategoryForm } from './types'
import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '../../../../styles'

const EditNodeCategory = ({ title, color }: NodeCategoryForm) => {
  const [state, setState] = useState({
    title,
    color: color || '#CFD8DC'
  })

  const onTitleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => [
      setState(
        produce((draft) => {
          draft.title = e.target.value
        })
      )
    ],
    []
  )

  const onColorChange = useCallback((color: string) => {
    setState(
      produce((draft) => {
        draft.color = color
      })
    )
  }, [])

  return (
    <SidebarInnerWrap>
      <SidebarContent>
        <SidebarTitle as="h3" variant="h6">
          Edit node category
        </SidebarTitle>
        <Stack direction="column" gap={3}>
          <TextField
            variant="outlined"
            label="Title"
            size="small"
            value={state.title}
            onChange={onTitleChange}
          />
          <ColorPicker
            size="small"
            color={state.color}
            onChange={onColorChange}
          />
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

export default EditNodeCategory
