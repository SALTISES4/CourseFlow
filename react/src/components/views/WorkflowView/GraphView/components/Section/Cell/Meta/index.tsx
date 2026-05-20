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
  /** Linked library workflow UUID when set on the node. */
  workflow?: string | null
  /** Parent graph workflow type (`course` | `program`) for link label copy. */
  parentWorkflowType?: string | null
  contextType: number
  taskType: number
  time?: {
    length: number
    unit: number
  }
}

function linkedIndicatorLabel(
  parentWorkflowType: string | null | undefined
): string {
  if (parentWorkflowType === 'program') {
    return _t('Linked course')
  }
  if (parentWorkflowType === 'course') {
    return _t('Linked activity')
  }
  return _t('Linked workflow')
}

const Meta = ({
  workflow,
  parentWorkflowType,
  contextType,
  taskType,
  time
}: PropsType) => {
  const contextIcon = getIcon('context', contextType)
  const taskIcon = getIcon('task', taskType)
  const workflowUrl = workflow
    ? generatePath(CFRoutes.WORKFLOW, {
        uuid: workflow
      })
    : ''

  const onWorkflowLinkClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      e.stopPropagation()

      window.open(workflowUrl, '_blank', 'noopener,noreferrer')
    },
    [workflowUrl]
  )

  return (
    <Styled.Wrap>
      {workflow && workflowUrl && (
        <Styled.WorkflowLink>
          <Link
            href={workflowUrl}
            onClick={onWorkflowLinkClick}
            target="_blank"
            rel="noopener noreferrer"
          >
            <LaunchOutlinedIcon />
            {linkedIndicatorLabel(parentWorkflowType)}
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
