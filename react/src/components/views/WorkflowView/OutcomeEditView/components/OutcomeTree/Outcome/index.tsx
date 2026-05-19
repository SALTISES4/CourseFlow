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
import BetterSelectionManager from '@cf/features/selection/betterSelectionManager'
import { getPrefixPath } from '@cf/redux/selectors/outcomes.selector'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
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

// import { OutcomeGroup } from '../' // circ dep
import OutcomeHeader from './Header'
import * as Styled from '../styles'

type OutcomeStateType = {
  collapsed: boolean
  dragHighlight: boolean
  operation: null | Instruction['operation']
}

const Outcome = ({
  uuid,
  title,
  children,
  level,
  tags,
  linkedOutcomes,
  greenHover
}: OutcomeType & {
  greenHover?: boolean
}) => {
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()
  const sidebarData = useSelector((state: RootState) => state.sidebar.edit)
  const dragging = useSelector((state: RootState) => state.outcomes.dragging)
  const prefix = useSelector((state: RootState) => getPrefixPath(state, uuid))
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
    sidebarData.objectType === CfObjectType.OUTCOME && sidebarData.uuid === uuid

  // TODO: not gonna quite cut it, id is now a string (uuid)
  const highlighted = linkedOutcomes?.some((o) =>
    highlight.includes(parseInt(o, 10))
  )

  useEffect(() => {
    const el = dragHandleRef.current

    if (!el) {
      return
    }

    return combine(
      draggable({
        element: el,
        getInitialData: () => ({ uuid, level }),
        onDragStart: () => {
          dispatch(setDragging({ uuid, level }))
        },
        onDrop: () => {
          dispatch(setDragging(null))
        }
      }),
      dropTargetForElements({
        element: el,
        getData: ({ input, element }) => {
          const data = { uuid }

          // only allow reordering if the target/dragged outcomes are different
          // and only if they're of the same level
          const reorder = dragging?.uuid !== uuid && dragging?.level === level

          // allow combine if we're combining different outcome IDs
          // (ie, you can't combine self with self)
          // and the dragged outcome level must be +1 compared to our target
          let combine = dragging?.uuid !== uuid && dragging?.level === level + 1

          // but also disallow combine if dragged outcome is a child of the parent already
          if (children.includes(dragging?.uuid)) {
            combine = false
          }

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
                targetId: dragging.uuid,
                destinationId: uuid
              })
            )
          }

          const instruction: Instruction | null = extractInstruction(
            args.self.data
          )

          if (instruction) {
            setState(
              produce((draft) => {
                if (draft.collapsed) {
                  draft.collapsed = false
                }
              })
            )

            dispatch(
              moveOutcome({
                targetId: args.source.data.uuid as string,
                destinationId: uuid,
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
  }, [dispatch, dragging?.uuid, dragging?.level, uuid, level, children])

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
      manager.current.updateSidebar(uuid, CfObjectType.OUTCOME, '-1')
    }
  }, [uuid, selected])

  return (
    <Styled.OutcomeWrapper dragging={dragging?.uuid === uuid}>
      <OutcomeHeader
        uuid={uuid}
        level={level}
        tags={tags}
        greenHover={greenHover}
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

      {
        // can't work like this circ dependency
        // !state.collapsed && <OutcomeGroup parentId={uuid} />
      }

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
