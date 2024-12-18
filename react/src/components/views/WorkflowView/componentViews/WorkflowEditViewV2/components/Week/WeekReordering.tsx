import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import { selectWeekById } from '@cfRedux/selectors/week.selector'
import { AppState } from '@cfRedux/types/type'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import DragHandleIcon from '@mui/icons-material/DragHandle'
import Box from '@mui/material/Box'
import { useSelector } from 'react-redux'

import * as Styled from './styles'

import { PropsType } from './'

const WeekReordering = ({ objectId }: Pick<PropsType, 'objectId'>) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: objectId })

  const workflowData = useSelector((state: AppState) => state.workflow)
  const weekData = useSelector((state: AppState) =>
    selectWeekById(state, objectId)
  )

  const defaultText = !workflowData.isStrategy
    ? `${weekData.week.weekTypeDisplay} ${weekData.week.order + 1}`
    : undefined

  return (
    <Box
      id={'week-block-' + String(objectId)}
      ref={setNodeRef}
      style={{
        position: 'relative',
        transform: CSS.Transform.toString(transform),
        transition
      }}
      {...attributes}
    >
      <Styled.DraggingWeekWrapper {...listeners}>
        <DragHandleIcon />
        <Styled.WeekWrapper>
          <Styled.WeekHeader expanded={false}>
            <Styled.WeekTitle variant="subtitle2">
              <TitleText text={weekData.week.title} defaultText={defaultText} />
            </Styled.WeekTitle>
          </Styled.WeekHeader>
        </Styled.WeekWrapper>
      </Styled.DraggingWeekWrapper>
    </Box>
  )
}

export default WeekReordering
