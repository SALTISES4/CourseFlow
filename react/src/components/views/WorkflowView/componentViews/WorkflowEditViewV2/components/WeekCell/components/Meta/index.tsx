import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import Link from '@mui/material/Link'

import * as Styled from './styles'
import { getIcon } from './utility'

type PropsType = {
  workflow?: string
  contextType: number
  taskType: number
  duration?: string
}

const Meta = ({ workflow, contextType, taskType, duration }: PropsType) => {
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
      {(duration || contextIcon || taskIcon) && (
        <Styled.Footer>
          {(contextIcon || taskIcon) && (
            <Styled.IconWrap>
              {contextIcon && <Styled.Tag>{contextIcon}</Styled.Tag>}
              {taskIcon && <Styled.Tag>{taskIcon}</Styled.Tag>}
            </Styled.IconWrap>
          )}
          {duration && (
            <Styled.Tag>
              <TimerOutlinedIcon />
              <span>{duration}</span>
            </Styled.Tag>
          )}
        </Styled.Footer>
      )}
    </Styled.Wrap>
  )
}

export default Meta
