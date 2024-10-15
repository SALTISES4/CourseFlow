import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { produce } from 'immer'
import { ChangeEvent, useCallback, useState } from 'react'

import { NodeLinkForm } from './types'
import {
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '../../../../styles'

const EditNodeLink = (data: NodeLinkForm) => {
  const [state, setState] = useState<NodeLinkForm>(data)

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

  const onDashChange = useCallback(
    (_: ChangeEvent<HTMLInputElement>, checked: boolean) => [
      setState(
        produce((draft) => {
          draft.dashed = checked
        })
      )
    ],
    []
  )

  const onSliderChange = useCallback(
    (_: Event, value: number | number[]) => [
      setState(
        produce((draft) => {
          draft.textPosition = value as number
        })
      )
    ],
    []
  )

  return (
    <SidebarInnerWrap>
      <SidebarContent>
        <SidebarTitle as="h3" variant="h6">
          Edit node link
        </SidebarTitle>
        <Stack direction="column" gap={3}>
          <TextField
            variant="outlined"
            label="Title"
            size="small"
            value={state.title}
            onChange={onTitleChange}
          />
          <Box>
            <Typography id="edit-text-position" gutterBottom>
              Text position
            </Typography>
            <Slider
              value={state.textPosition}
              aria-labelledby="edit-text-position"
              valueLabelDisplay="off"
              onChange={onSliderChange}
            />
          </Box>
          <FormControlLabel
            sx={{ ml: 0 }}
            label="Dashed line"
            control={
              <Switch
                checked={state.dashed}
                onChange={onDashChange}
                size="small"
              />
            }
          />
        </Stack>
      </SidebarContent>
    </SidebarInnerWrap>
  )
}

export default EditNodeLink
