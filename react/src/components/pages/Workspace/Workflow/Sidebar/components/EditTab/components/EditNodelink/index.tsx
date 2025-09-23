import { nodelinkDeleteSelfSoft } from '@cf/redux/slices/nodelink.slice'
import { AppState } from '@cf/redux/types/type'
import { NodelinkForm } from '@cfSidebar/components/EditTab/components/EditNodelink/types'
import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '@cfSidebar/styles'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { produce } from 'immer'
import { ChangeEvent, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const EditNodelink = () => {
  const dispatch = useDispatch()
  const nodeLinkId = useSelector((state: AppState) => state.sidebar.edit.id)

  const [state, setState] = useState<NodelinkForm>({
    title: 'Node Link text here',
    textPosition: 50,
    dashed: false
  })

  // const data = getNodelinkData(1)
  // const [state, setState] = useState<NodelinkForm>(data)
  //
  // const onTitleChange = useCallback(
  //   (e: ChangeEvent<HTMLInputElement>) => [
  //     setState(
  //       produce((draft) => {
  //         draft.title = e.target.value
  //       })
  //     )
  //   ],
  //   []
  // )

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

  const onDelete = useCallback(() => {
    dispatch(nodelinkDeleteSelfSoft({ id: nodeLinkId }))
  }, [dispatch, nodeLinkId])

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
      <SidebarActions>
        <Button variant="contained" color="secondary" onClick={onDelete}>
          Delete
        </Button>
      </SidebarActions>
    </SidebarInnerWrap>
  )
}

export default EditNodelink
