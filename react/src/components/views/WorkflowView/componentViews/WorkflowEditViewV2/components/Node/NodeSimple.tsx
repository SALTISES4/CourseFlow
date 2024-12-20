import { selectNodeById } from '@cf/redux/selectors/node.selector'
import { AppState } from '@cf/redux/types/type'
import { CfObjectType } from '@cf/types/enum'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDispatch, useSelector } from 'react-redux'

import * as StyledNode from './styles'
import { getNodeTitle } from './utility'
import * as Styled from '../../styles'

import { PropsType } from './'

const NodeSimple = ({ id, parentId, row, columnColors }: PropsType) => {
  const dispatch = useDispatch()
  const data = useSelector((state: AppState) => selectNodeById(state, id))
  const workflow = useSelector((state: AppState) => state.workflow)
  const manager = new BetterSelectionManager(dispatch)
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })

  if (!data) {
    return null
  }

  return workflow.columns.map((column, index) => (
    <Styled.Cell key={column}>
      <Styled.DebugCellInfo>
        row: {row}, col: {column}
      </Styled.DebugCellInfo>

      {column === data.node.column && (
        <div
          id={String(id)}
          ref={setNodeRef}
          style={{
            position: 'relative',
            transform: CSS.Transform.toString(transform),
            transition
          }}
          {...attributes}
          data-child-id={String(id)}
          data-column-id={String(data.column)}
        >
          {/* <Node objectId={id} parentId={parentId} /> */}

          <div {...listeners}>
            <StyledNode.Border sx={{ backgroundColor: columnColors[index] }} />
          </div>
          <StyledNode.Content
            onClick={(e) => {
              e.stopPropagation()
              manager.updateSidebar(data.node.id, CfObjectType.NODE, parentId)
            }}
          >
            <StyledNode.Title variant="subtitle2">
              {getNodeTitle(data.node)}
            </StyledNode.Title>
            <StyledNode.Subtitle variant="caption">
              {data.node.description}
            </StyledNode.Subtitle>
          </StyledNode.Content>
        </div>
      )}
    </Styled.Cell>
  ))
}

export default NodeSimple
