import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { selectAuthUser } from '@cf/features/auth/state/auth.slice'
import { saveNodeInsertModePreference } from '@cf/features/graph/state/nodeInsertModePreference'
import type { NodeInsertMode } from '@cf/features/graph/state/resolveNodeDropRow'
import { selectChannelsOrderedByGraphUuid } from '@cf/features/graph/state/selectors/canonical.selectors'
import { graphUiActions } from '@cf/features/graph/state/slices/graphUi.slice'
import { displaySystemTitle } from '@cf/i18n/systemTitles'
import type { AppDispatch, RootState } from '@cf/redux/store'
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
import { useTranslation } from 'react-i18next'

import DraggableItem from './Draggable'
import * as Styled from './styles'

const AddTab = () => {
  const { t } = useTranslation('workflow')
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
          {t('addPanel.title')}
        </SC.SidebarTitle>
        <SC.GroupWrap separator={false}>
          <Styled.InsertModeTitle variant="body2">
            {t('addPanel.insertMode')}
            <Tooltip
              arrow
              placement="top"
              title={t('addPanel.insertModeHelp')}
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
            aria-label={t('addPanel.insertMode')}
          >
            <ToggleButton color="primary" size="small" value="manual">
              {t('addPanel.manual')}
            </ToggleButton>
            <ToggleButton color="primary" size="small" value="row">
              {t('addPanel.row')}
            </ToggleButton>
            <ToggleButton color="primary" size="small" value="column">
              {t('addPanel.column')}
            </ToggleButton>
          </Styled.InsertButtonGroup>
        </SC.GroupWrap>
        {channels.length > 0 && (
          <SC.GroupWrap>
            <Typography component="h6" variant="body2">
              {t('addPanel.nodeCategories')}
            </Typography>
            <ul>
              {channels.map((column) => (
                <DraggableItem
                  key={column.uuid}
                  component="li"
                  uuid={column.uuid}
                  label={displaySystemTitle(
                    t,
                    column,
                    t('graph.untitledNodeCategory')
                  )}
                  type={DraggableType.SIDEBAR_NODE}
                  typeColor={column.colour}
                />
              ))}
              <DraggableItem
                component="li"
                uuid={'-1'}
                label={t('addPanel.customNodeCategory')}
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
