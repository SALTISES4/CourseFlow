import { CFRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/Utility.class'
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import Link from '@mui/material/Link'
import { MouseEvent, useCallback } from 'react'
import { generatePath } from 'react-router-dom'

import * as Styled from './styles'
import { getIcon } from './utility'

const choices = COURSEFLOW_APP.globalContextData.workflowChoices

type PropsType = {
  workflow?: number | null
  contextType: number
  taskType: number
  time?: {
    length: number
    unit: number
  }
}

const Meta = ({ workflow, contextType, taskType, time }: PropsType) => {
  const contextIcon = getIcon('context', contextType)
  const taskIcon = getIcon('task', taskType)
  const workflowUrl = generatePath(CFRoutes.WORKFLOW, {
    uuid: String(workflow)
  })

  const onWorkflowLinkClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      e.stopPropagation()

      // not using navigate(...) because we want to trigger a good ol' full reload
      window.location.href = workflowUrl
    },
    [workflowUrl]
  )

  return (
    <Styled.Wrap>
      {workflow && (
        <Styled.WorkflowLink>
          <Link href={workflowUrl} onClick={onWorkflowLinkClick}>
            <LaunchOutlinedIcon />
            {_t('Linked workflow')}
          </Link>
        </Styled.WorkflowLink>
      )}
      {(time || contextIcon || taskIcon) && (
        <Styled.Footer>
          {(contextIcon || taskIcon) && (
            <Styled.IconWrap>
              {contextIcon && <Styled.Tag>{contextIcon}</Styled.Tag>}
              {taskIcon && <Styled.Tag>{taskIcon}</Styled.Tag>}
            </Styled.IconWrap>
          )}
          {time && time.length && time.unit !== 0 && (
            <Styled.Tag>
              <TimerOutlinedIcon />
              <span>{`${time.length} ${choices.timeChoices[time.unit].name}`}</span>
            </Styled.Tag>
          )}
        </Styled.Footer>
      )}
    </Styled.Wrap>
  )
}

export default Meta
