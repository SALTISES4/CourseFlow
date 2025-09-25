import { makeSelectColumnsForWorkflow } from '@cfRedux/selectors/column.selector'
import { RootState } from '@cfRedux/store'
import * as SC from '@cfSidebar/styles'
import { DraggableType } from '@cfViews/WorkflowView/WorkflowEditView/types'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import data, { getColumnData } from './data'
import DraggableBlock from '../../Draggable'

const AddTab = () => {
  const theme = useTheme()
  const { title, subtitle, groups } = data

  const selectColumnsForWorkflow = useMemo(makeSelectColumnsForWorkflow, [])
  const columns = useSelector((s: RootState) => selectColumnsForWorkflow(s))
  const nodeCategories = getColumnData(columns)

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
        {nodeCategories && (
          <SC.GroupWrap>
            <Typography component="h6" variant="body2">
              Node categories
            </Typography>
            <ul>
              {nodeCategories.map((column) => (
                <DraggableBlock
                  key={column.id}
                  component="li"
                  id={column.id}
                  label={column.title}
                  type={DraggableType.CELL}
                  typeColor={column.color}
                />
              ))}
              <DraggableBlock
                component="li"
                id="new"
                label={'Custom node category'}
                type={DraggableType.COLUMN}
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
                      group.type === DraggableType.REUSABLE
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
