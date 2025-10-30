import { selectNodelinkById } from '@cf/redux/selectors/nodelink.selector'
import {
  nodelinkChangeField,
  nodelinkDeleteSelfSoft
} from '@cf/redux/slices/nodelink.slice'
import { sidebarChangeTab } from '@cf/redux/slices/sidebar.slice'
import { _t } from '@cf/utility/Utility.class'
import { RootState } from '@cfRedux/store'
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
import { ChangeEvent, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const EditNodelink = () => {
  const dispatch = useDispatch()
  const nodeLinkId = useSelector((state: RootState) => state.sidebar.edit.id)
  const nodelink = useSelector((state: RootState) =>
    selectNodelinkById(state, nodeLinkId)
  )

  const onTitleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => [
      dispatch(
        nodelinkChangeField({
          id: nodeLinkId,
          json: {
            title: e.target.value
          }
        })
      )
    ],
    [dispatch, nodeLinkId]
  )

  const onDashChange = useCallback(
    (_: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      dispatch(
        nodelinkChangeField({
          id: nodeLinkId,
          json: {
            dashed: checked
          }
        })
      )
    },
    [dispatch, nodeLinkId]
  )

  const onSliderChange = useCallback(
    (_: Event, value: number | number[]) => {
      dispatch(
        nodelinkChangeField({
          id: nodeLinkId,
          json: {
            textPosition: value as number
          }
        })
      )
    },
    [dispatch, nodeLinkId]
  )

  const onDelete = useCallback(() => {
    dispatch(sidebarChangeTab({ tab: null, collapsed: true }))
    dispatch(nodelinkDeleteSelfSoft({ id: nodeLinkId }))
  }, [dispatch, nodeLinkId])

  return (
    <SidebarInnerWrap>
      <SidebarContent>
        <SidebarTitle as="h3" variant="h6">
          {_t('Edit node link')}
        </SidebarTitle>
        <Stack direction="column" gap={3}>
          <TextField
            variant="outlined"
            label="Title"
            size="small"
            value={nodelink.title}
            onChange={onTitleChange}
          />
          <Box>
            <Typography id="edit-text-position" gutterBottom>
              {_t('Text position')}
            </Typography>
            <Slider
              value={nodelink.textPosition}
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
                checked={nodelink.dashed}
                onChange={onDashChange}
                size="small"
              />
            }
          />
        </Stack>
      </SidebarContent>
      <SidebarActions>
        <Button variant="contained" color="secondary" onClick={onDelete}>
          {_t('Delete')}
        </Button>
      </SidebarActions>
    </SidebarInnerWrap>
  )
}

export default EditNodelink
