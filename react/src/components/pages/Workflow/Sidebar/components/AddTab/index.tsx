import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import type { NodeInsertMode } from '@cf/features/graph/state/resolveNodeDropRow'
import { selectChannelsOrderedByGraphUuid } from '@cf/features/graph/state/selectors/canonical.selectors'
import { graphUiActions } from '@cf/features/graph/state/slices/graphUi.slice'
import type { AppDispatch, RootState } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import * as SC from '@cfSidebar/styles'
import { DraggableType } from '@cfViews/WorkflowView/GraphView/types'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { useTheme } from '@mui/material/styles'
import ToggleButton from '@mui/material/ToggleButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { MouseEvent, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import data, { getChannelData } from './data'
import DraggableItem from './Draggable'
import * as Styled from './styles'

const AddTab = () => {
  const dispatch = useDispatch<AppDispatch>()
  const theme = useTheme()
  const { title, subtitle, groups } = data
  const { uuid: workflowUuid } = useParams<{ uuid: string }>()

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
  const nodeCategories = graphUuid ? getChannelData(channels) : []

  const insertMode = useSelector(
    (state: RootState) => state.graph.graphUi.nodeInsertMode
  )

  const onInsertModeChange = useCallback(
    (e: MouseEvent, val: NodeInsertMode | null) => {
      if (val) {
        dispatch(graphUiActions.setNodeInsertMode(val))
      }
    },
    [dispatch]
  )

  // TODO: fetch from strategies
  // but where do the reusable blocks come from?
  // state.strategy
  // state.saltiseStrategy
  // console.log({ strategies })

  return (
    <SC.SidebarInnerWrap>
      <SC.SidebarContent>
        <SC.SidebarTitle as="h3" variant="h6">
          {title}
        </SC.SidebarTitle>
        {subtitle && (
          <Typography variant="body2" sx={{ mb: 3 }}>
            {subtitle}
          </Typography>
        )}
        <SC.GroupWrap>
          <Styled.InsertModeTitle variant="body2">
            {_t('Insert mode')}
            <Tooltip
              arrow
              placement="top"
              title={_t('Insert mode text goes here')}
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
        {nodeCategories.length > 0 && (
          <SC.GroupWrap>
            <Typography component="h6" variant="body2">
              {_t('Node categories')}
            </Typography>
            <ul>
              {nodeCategories.map((column) => (
                <DraggableItem
                  key={column.uuid}
                  component="li"
                  uuid={column.uuid}
                  label={column.title}
                  type={DraggableType.SIDEBAR_NODE}
                  typeColor={column.color}
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
        {groups?.map((group, idx) => (
          <SC.GroupWrap key={idx}>
            <Typography component="h6" variant="body2">
              {group.title}
            </Typography>
            {group.blocks && (
              <ul>
                {group.blocks.map((block) => (
                  <DraggableItem
                    key={block.uuid}
                    component="li"
                    uuid={block.uuid}
                    label={block.label}
                    type={group.type}
                    typeColor={
                      group.type === DraggableType.SIDEBAR_REUSABLE
                        ? theme.palette.workspaceBlocks.reusableBlocks
                        : theme.palette.workspaceBlocks.strategies
                    }
                  />
                ))}
              </ul>
            )}
          </SC.GroupWrap>
        ))}
      </SC.SidebarContent>
    </SC.SidebarInnerWrap>
  )
}

export default AddTab
