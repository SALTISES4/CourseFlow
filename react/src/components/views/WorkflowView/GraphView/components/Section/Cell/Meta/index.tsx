import { CFRoutes } from '@cf/router/appRoutes'
import { formatHoursDuration } from '@cfComponents/DurationTextField'
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import Link from '@mui/material/Link'
import { MouseEvent, useCallback } from 'react'
import { generatePath } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import * as Styled from './styles'
import { getIcon } from './utility'

type PropsType = {
  /** Linked library workflow UUID when set on the node. */
  workflow?: string | null
  /** Parent graph workflow type (`course` | `program`) for link label copy. */
  parentWorkflowType?: string | null
  contextType: string | null
  taskType: string | null
  time?: number | null
}

const Meta = ({
  workflow,
  parentWorkflowType,
  contextType,
  taskType,
  time
}: PropsType) => {
  const { t } = useTranslation('workflow')
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
            {t(
              parentWorkflowType === 'program'
                ? 'linked.course'
                : parentWorkflowType === 'course'
                  ? 'linked.activity'
                  : 'linked.workflow'
            )}
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
          {time && (
            <Styled.Tag>
              <TimerOutlinedIcon />
              <span>{formatHoursDuration(time)}</span>
            </Styled.Tag>
          )}
        </Styled.Footer>
      )}
    </Styled.Wrap>
  )
}

export default Meta
