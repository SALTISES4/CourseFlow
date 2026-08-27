import { WorkflowPermission } from '@cf/api/gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import type { EdgeEntity } from '@cf/features/graph/state/model/types'
import { selectEdgeByEdgeId } from '@cf/features/graph/state/selectors/canonical.selectors'
import {
  deleteEdge,
  updateEdge
} from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { sidebarChangeTab } from '@cf/features/sidebar/state/sidebar.slice'
import type { AppDispatch } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '@cfSidebar/styles'
import {
  dashedToLineType,
  edgeLineTypeIsDashed
} from '@cfViews/WorkflowView/GraphView/components/LineSVG/utility'
import { debounce } from '@mui/material'
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
  const canEdit = useResourcePermission(WorkflowPermission.NODE_LINK_MANAGEMENT)
  const [titleDraft, setTitleDraft] = useState(edge.title)
  const [textPosition, setTextPosition] = useState(edge.textPosition)
  const [dashed, setDashed] = useState(() =>
    edgeLineTypeIsDashed(edge.lineType)
  )

  useEffect(() => {
    setTitleDraft(edge.title)
    setTextPosition(edge.textPosition)
    setDashed(edgeLineTypeIsDashed(edge.lineType))
  }, [edge.edgeId, edge.title, edge.textPosition, edge.lineType])

  const debouncedMetaDispatch = useMemo(
    () =>
      debounce(
        (meta: {
          title?: string
          textPosition?: number
          lineType?: string
        }) => {
          if (!canEdit) {
            return
          }
          void dispatch(
            updateEdge({
              graphUuid: edge.graphUuid,
              edgeId: edge.edgeId,
              meta
            })
          )
        },
        300
      ),
    [canEdit, dispatch, edge.edgeId, edge.graphUuid]
  )

  useEffect(() => () => debouncedMetaDispatch.clear(), [debouncedMetaDispatch])

  const onTitleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!canEdit) {
        return
      }
      const value = e.target.value
      setTitleDraft(value)
      debouncedMetaDispatch({ title: value })
    },
    [canEdit, debouncedMetaDispatch]
  )

  const onTitleBlur = useCallback(() => {
    if (!canEdit) {
      return
    }
    debouncedMetaDispatch.clear()
    void dispatch(
      updateEdge({
        graphUuid: edge.graphUuid,
        edgeId: edge.edgeId,
        meta: { title: titleDraft }
      })
    )
  }, [
    canEdit,
    debouncedMetaDispatch,
    dispatch,
    edge.edgeId,
    edge.graphUuid,
    titleDraft
  ])

  const onDashChange = useCallback(
    (_: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      if (!canEdit) {
        return
      }
      setDashed(checked)
      void dispatch(
        updateEdge({
          graphUuid: edge.graphUuid,
          edgeId: edge.edgeId,
          meta: { lineType: dashedToLineType(checked) }
        })
      )
    },
    [canEdit, dispatch, edge.edgeId, edge.graphUuid]
  )

  const onSliderChange = useCallback(
    (_: Event, value: number | number[]) => {
      if (!canEdit) {
        return
      }
      const next = value as number
      setTextPosition(next)
      debouncedMetaDispatch({ textPosition: next })
    },
    [canEdit, debouncedMetaDispatch]
  )

  const onDelete = useCallback(async () => {
    if (!canEdit) {
      return
    }
    await dispatch(
      deleteEdge({
        graphUuid: edge.graphUuid,
        edgeId: edge.edgeId
      })
    )
    dispatch(sidebarChangeTab({ tab: null, collapsed: true }))
  }, [canEdit, dispatch, edge.edgeId, edge.graphUuid])

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
            onBlur={onTitleBlur}
            disabled={!canEdit}
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
              disabled={!canEdit}
            />
          </Box>
          <FormControlLabel
            sx={{ ml: 0 }}
            label="Dashed line"
            control={
              <Switch
                checked={dashed}
                onChange={onDashChange}
                size="small"
                disabled={!canEdit}
              />
            }
          />
        </Stack>
      </SidebarContent>
      <SidebarActions>
        <Button
          variant="contained"
          color="secondary"
          onClick={onDelete}
          disabled={!canEdit}
        >
          {_t('Delete')}
        </Button>
      </SidebarActions>
    </SidebarInnerWrap>
  )
}

export default EditNodeLink
