import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import Link from '@mui/material/Link'

import * as Styled from './styles'
import { getIcon } from './utility'

const choices = COURSEFLOW_APP.globalContextData.workflowChoices

type PropsType = {
  workflow?: string
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

  return (
    <Styled.Wrap>
      {workflow && (
        <Styled.WorkflowLink>
          <Link href={workflow}>
            <LaunchOutlinedIcon />
            Linked workflow
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
