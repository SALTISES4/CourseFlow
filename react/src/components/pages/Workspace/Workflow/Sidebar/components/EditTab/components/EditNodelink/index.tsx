import { selectNodelinkById } from '@cf/redux/selectors/nodelink.selector'
import {
  nodelinkChangeField,
  nodelinkDeleteSelfSoft
} from '@cf/redux/slices/nodelink.slice'
import { sidebarChangeTab } from '@cf/redux/slices/sidebar.slice'
import { TNodelink } from '@cf/redux/types/type'
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

const EditNodeLink = ({ nodeLinkId }: { nodeLinkId: number }) => {
  const dispatch = useDispatch()
  const nodeLink = useSelector((state: RootState) =>
    selectNodelinkById(state, nodeLinkId)
  )

  if (!nodeLink) {
    dispatch(sidebarChangeTab({ tab: null, collapsed: true }))
    return null
  }

  return <EditNodeLinkForm nodeLink={nodeLink} />
}

const EditNodeLinkForm = ({ nodeLink }: { nodeLink: TNodelink }) => {
  const dispatch = useDispatch()

  const onTitleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => [
      dispatch(
        nodelinkChangeField({
          id: nodeLink.id,
          json: {
            title: e.target.value
          }
        })
      )
    ],
    [dispatch, nodeLink.id]
  )

  const onDashChange = useCallback(
    (_: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      dispatch(
        nodelinkChangeField({
          id: nodeLink.id,
          json: {
            dashed: checked
          }
        })
      )
    },
    [dispatch, nodeLink.id]
  )

  const onSliderChange = useCallback(
    (_: Event, value: number | number[]) => {
      dispatch(
        nodelinkChangeField({
          id: nodeLink.id,
          json: {
            textPosition: value as number
          }
        })
      )
    },
    [dispatch, nodeLink.id]
  )

  const onDelete = useCallback(() => {
    dispatch(nodelinkDeleteSelfSoft({ id: nodeLink.id }))
  }, [dispatch, nodeLink.id])

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
            value={nodeLink.title}
            onChange={onTitleChange}
          />
          <Box>
            <Typography id="edit-text-position" gutterBottom>
              {_t('Text position')}
            </Typography>
            <Slider
              value={nodeLink.textPosition}
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
                checked={nodeLink.dashed}
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

export default EditNodeLink
