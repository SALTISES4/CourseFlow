import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '@cf/components/pages/Workflow/Sidebar/styles'
import { edgeLineTypeIsDashed } from '@cf/components/views/WorkflowView/GraphView/components/LineSVG/utility'
import type { EdgeEntity } from '@cf/features/graph/state/model/types'
import { selectEdgeByEdgeId } from '@cf/features/graph/state/selectors/canonical.selectors'
import { deleteEdge } from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { sidebarChangeTab } from '@cf/features/sidebar/state/sidebar.slice'
import type { AppDispatch } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const EditNodeLink = ({ nodeLinkId }: { nodeLinkId: string }) => {
  const dispatch = useDispatch()
  const edgeSelector = useMemo(
    () => selectEdgeByEdgeId(nodeLinkId),
    [nodeLinkId]
  )
  const edge = useSelector(edgeSelector)

  useEffect(() => {
    if (!edge && nodeLinkId) {
      dispatch(sidebarChangeTab({ tab: null, collapsed: true }))
    }
  }, [edge, nodeLinkId, dispatch])

  if (!edge) {
    return null
  }

  return <EditNodeLinkForm edge={edge} />
}

const EditNodeLinkForm = ({ edge }: { edge: EdgeEntity }) => {
  const dispatch = useDispatch<AppDispatch>()
  const [titleDraft, setTitleDraft] = useState('')
  const [textPosition, setTextPosition] = useState(50)
  const [dashed, setDashed] = useState(() =>
    edgeLineTypeIsDashed(edge.lineType)
  )

  useEffect(() => {
    setDashed(edgeLineTypeIsDashed(edge.lineType))
  }, [edge.edgeId, edge.lineType])

  const onTitleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setTitleDraft(e.target.value)
    // TODO(graph-state): persist edge label when the graph API supports it.
  }, [])

  const onDashChange = useCallback(
    (_: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setDashed(checked)
      // TODO(graph-state): persist lineType (`dashed` / `solid`) via edge patch mutation when available.
    },
    []
  )

  const onSliderChange = useCallback((_: Event, value: number | number[]) => {
    setTextPosition(value as number)
    // TODO(graph-state): persist edge text position when the graph API supports it.
  }, [])

  const onDelete = useCallback(() => {
    dispatch(
      deleteEdge({
        graphUuid: edge.graphUuid,
        edgeId: edge.edgeId
      })
    )
    dispatch(sidebarChangeTab({ tab: null, collapsed: true }))
  }, [dispatch, edge.edgeId, edge.graphUuid])

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
            value={titleDraft}
            onChange={onTitleChange}
          />
          <Box>
            <Typography id="edit-text-position" gutterBottom>
              {_t('Text position')}
            </Typography>
            <Slider
              value={textPosition}
              aria-labelledby="edit-text-position"
              valueLabelDisplay="off"
              onChange={onSliderChange}
            />
          </Box>
          <FormControlLabel
            sx={{ ml: 0 }}
            label="Dashed line"
            control={
              <Switch checked={dashed} onChange={onDashChange} size="small" />
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
