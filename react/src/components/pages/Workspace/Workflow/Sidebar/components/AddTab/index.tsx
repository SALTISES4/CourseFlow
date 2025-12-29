import { selectWorkflowColumnEntities } from '@cf/redux/selectors/workflow.selector'
import {
  NodeInsertMode,
  nodeChangeInsertMode
} from '@cf/redux/slices/node.slice'
import { RootState } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import * as SC from '@cfSidebar/styles'
import { DraggableType } from '@cfViews/WorkflowView/WorkflowEditView/types'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { useTheme } from '@mui/material/styles'
import ToggleButton from '@mui/material/ToggleButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { MouseEvent, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import data, { getColumnData } from './data'
import * as Styled from './styles'
import DraggableBlock from '../../Draggable'

const AddTab = () => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const { title, subtitle, groups } = data

  const workflowColumns = useSelector(selectWorkflowColumnEntities)
  const nodeCategories = getColumnData(workflowColumns)

  const insertMode = useSelector(
    (state: RootState) => state.workspace.node.insertMode
  )

  const onInsertModeChange = useCallback(
    (e: MouseEvent, val: NodeInsertMode | null) => {
      if (val) {
        dispatch(nodeChangeInsertMode(val))
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
        {nodeCategories && (
          <SC.GroupWrap>
            <Typography component="h6" variant="body2">
              {_t('Node categories')}
            </Typography>
            <ul>
              {nodeCategories.map((column) => (
                <DraggableBlock
                  key={column.id}
                  component="li"
                  id={column.id}
                  label={column.title}
                  type={DraggableType.SIDEBAR_NODE}
                  typeColor={column.color}
                />
              ))}
              <DraggableBlock
                component="li"
                id={-1}
                label={'Custom node category'}
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
                  <DraggableBlock
                    key={block.id}
                    component="li"
                    id={block.id}
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
