import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { selectAuthUser } from '@cf/features/auth/state/auth.slice'
import { saveNodeInsertModePreference } from '@cf/features/graph/state/nodeInsertModePreference'
import type { NodeInsertMode } from '@cf/features/graph/state/resolveNodeDropRow'
import { selectChannelsOrderedByGraphUuid } from '@cf/features/graph/state/selectors/canonical.selectors'
import { graphUiActions } from '@cf/features/graph/state/slices/graphUi.slice'
import type { AppDispatch, RootState } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import * as SC from '@cfSidebar/styles'
import { DraggableType } from '@cfViews/WorkflowView/GraphView/types'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import ToggleButton from '@mui/material/ToggleButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { MouseEvent, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import DraggableItem from './Draggable'
import * as Styled from './styles'

const AddTab = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { uuid: workflowUuid } = useParams<{ uuid: string }>()
  const userUuid = useSelector(selectAuthUser)?.uuid

  const { data: workflowDetailResp } = useQuery({
    ...getWorkflowOptions({
      path: { uuid: workflowUuid ?? '' }
    }),
    enabled: Boolean(workflowUuid)
  })

  const graphUuid = workflowDetailResp?.item?.graphUuid ?? ''
  const channelsSelector = useMemo(
    () => selectChannelsOrderedByGraphUuid(graphUuid),
    [graphUuid]
  )
  const channels = useSelector(channelsSelector)

  const insertMode = useSelector(
    (state: RootState) => state.graph.graphUi.nodeInsertMode
  )

  const onInsertModeChange = useCallback(
    (e: MouseEvent, val: NodeInsertMode | null) => {
      if (val) {
        dispatch(graphUiActions.setNodeInsertMode(val))
        if (userUuid && workflowUuid) {
          saveNodeInsertModePreference(userUuid, workflowUuid, val)
        }
      }
    },
    [dispatch, userUuid, workflowUuid]
  )

  return (
    <SC.SidebarInnerWrap>
      <SC.SidebarContent>
        <SC.SidebarTitle as="h3" variant="h6">
          {_t('Add to workflow')}
        </SC.SidebarTitle>
        <SC.GroupWrap separator={false}>
          <Styled.InsertModeTitle variant="body2">
            {_t('Insert mode')}
            <Tooltip
              arrow
              placement="top"
              title={_t(
                'Row mode forces nodes into a vertical sequence. Column mode allows multiple nodes side-by-side. Manual mode prompts you to choose a layout style for every new node.'
              )}
            >
              <InfoOutlinedIcon
                sx={{
                  fontSize: '1.2em',
                  color: 'primary.main'
                }}
              />
            </Tooltip>
          </Styled.InsertModeTitle>
          <Styled.InsertButtonGroup
            value={insertMode}
            exclusive
            onChange={onInsertModeChange}
            aria-label="Insert mode"
          >
            <ToggleButton color="primary" size="small" value="manual">
              {_t('Manual')}
            </ToggleButton>
            <ToggleButton color="primary" size="small" value="row">
              {_t('Row')}
            </ToggleButton>
            <ToggleButton color="primary" size="small" value="column">
              {_t('Column')}
            </ToggleButton>
          </Styled.InsertButtonGroup>
        </SC.GroupWrap>
        {channels.length > 0 && (
          <SC.GroupWrap>
            <Typography component="h6" variant="body2">
              {_t('Node categories')}
            </Typography>
            <ul>
              {channels.map((column) => (
                <DraggableItem
                  key={column.uuid}
                  component="li"
                  uuid={column.uuid}
                  label={column.title}
                  type={DraggableType.SIDEBAR_NODE}
                  typeColor={column.colour}
                />
              ))}
              <DraggableItem
                component="li"
                uuid={'-1'}
                label={_t('Custom node category')}
                type={DraggableType.SIDEBAR_NODE_CUSTOM}
                dashed
              />
            </ul>
          </SC.GroupWrap>
        )}
      </SC.SidebarContent>
    </SC.SidebarInnerWrap>
  )
}

export default AddTab
