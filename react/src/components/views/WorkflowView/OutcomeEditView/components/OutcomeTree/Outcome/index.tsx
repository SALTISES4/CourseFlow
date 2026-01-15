import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  type Instruction,
  attachInstruction,
  extractInstruction
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/list-item'
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/list-item'
import { getPrefixPath } from '@cf/redux/selectors/outcomes.selector'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import {
  Outcome as OutcomeType,
  isOutcomeLink,
  linkOutcome,
  moveOutcome
} from '@cfRedux/slices/outcomes.slice'
import { setDragging } from '@cfRedux/slices/outcomes.slice'
import { RootState } from '@cfRedux/store'
import { produce } from 'immer'
import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { OutcomeGroup } from '../'
import OutcomeHeader from './Header'
import * as Styled from '../styles'

type OutcomeStateType = {
  collapsed: boolean
  dragHighlight: boolean
  operation: null | Instruction['operation']
}

const Outcome = ({
  id,
  title,
  children,
  level,
  linkedOutcomes
}: OutcomeType) => {
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()
  const sidebarData = useSelector((state: RootState) => state.sidebar.edit)
  const dragging = useSelector((state: RootState) => state.outcomes.dragging)
  const prefix = useSelector((state: RootState) => getPrefixPath(state, id))
  const highlight = useSelector(
    (state: RootState) => state.outcomes.highlighted
  )
  const manager = useRef(new BetterSelectionManager(dispatch))
  const [state, setState] = useState<OutcomeStateType>({
    collapsed: true,
    dragHighlight: false,
    operation: null
  })

  const selected =
    sidebarData.objectType === CfObjectType.OUTCOME && sidebarData.id === id

  const highlighted = linkedOutcomes?.some((o) => highlight.includes(o))

  useEffect(() => {
    const el = dragHandleRef.current

    if (!el) {
      return
    }

    return combine(
      draggable({
        element: el,
        getInitialData: () => ({ id, level }),
        onDragStart: () => {
          dispatch(setDragging({ id, level }))
        },
        onDrop: () => {
          dispatch(setDragging(null))
        }
      }),
      dropTargetForElements({
        element: el,
        getData: ({ input, element }) => {
          const data = { id }

          // only allow reordering if the target/dragged outcomes are different
          // and only if they're of the same level
          const reorder = dragging?.id !== id && dragging?.level === level

          // allow combine if we're combining different outcome IDs
          // (ie, you can't combine self with self)
          // and the dragged outcome level must be +1 compared to our target
          const combine = dragging?.id !== id && dragging?.level === level + 1

          return attachInstruction(data, {
            input,
            element,
            operations: {
              'reorder-before': reorder ? 'available' : 'not-available',
              'reorder-after': reorder ? 'available' : 'not-available',
              combine: combine ? 'available' : 'not-available'
            }
          })
        },
        onDrag: (args) => {
          const dragging = args.source.data

          const instruction: Instruction | null = extractInstruction(
            args.self.data
          )

          setState(
            produce((draft) => {
              if (isOutcomeLink(dragging) && level === 0) {
                draft.dragHighlight = true
              } else {
                draft.operation = instruction?.operation ?? null
              }
            })
          )
        },
        onDropTargetChange: () => {
          setState(
            produce((draft) => {
              draft.dragHighlight = false
              draft.operation = null
            })
          )
        },
        onDrop: (args) => {
          const dragging = args.source.data

          if (isOutcomeLink(dragging) && level === 0) {
            dispatch(
              linkOutcome({
                targetId: dragging.id,
                destinationId: id
              })
            )
          }

          const instruction: Instruction | null = extractInstruction(
            args.self.data
          )

          if (instruction) {
            dispatch(
              moveOutcome({
                targetId: args.source.data.id as number,
                destinationId: id,
                operation: instruction.operation
              })
            )
          }

          setState(
            produce((draft) => {
              draft.dragHighlight = false
              draft.operation = null
            })
          )
        }
      })
    )
  }, [dispatch, dragHandleRef, dragging, id, level])

  const setCollapsed = useCallback((value: boolean) => {
    setState(
      produce((draft) => {
        draft.collapsed = value
      })
    )
  }, [])

  const onToggleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      setCollapsed(!state.collapsed)
    },
    [setCollapsed, state.collapsed]
  )

  const onHeaderClick = useCallback(() => {
    if (selected) {
      manager.current.clearSidebar()
    } else {
      manager.current.updateSidebar(id, CfObjectType.OUTCOME, -1)
    }
  }, [id, selected])

  return (
    <Styled.OutcomeWrapper dragging={dragging?.id === id}>
      <OutcomeHeader
        id={id}
        level={level}
        dragRef={dragHandleRef}
        title={`${prefix}${title}`}
        selected={selected || state.dragHighlight}
        highlighted={highlighted}
        collapsed={state.collapsed}
        setCollapsed={setCollapsed}
        showToggle={!!children.length}
        onClick={onHeaderClick}
        onToggleClick={onToggleClick}
      />

      {!state.collapsed && <OutcomeGroup parentId={id} />}

      <DropIndicator
        lineGap="8px"
        lineType="no-terminal"
        instruction={{
          operation: state.operation,
          axis: 'vertical',
          blocked: false
        }}
      />
    </Styled.OutcomeWrapper>
  )
}

export default Outcome
