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
import BetterSelectionManager from '@cf/redux/BetterSelectionManager'
import {
  Outcome as OutcomeType,
  moveOutcome
} from '@cf/redux/slices/outcomes.slice'
import { setDragging } from '@cf/redux/slices/outcomes.slice'
import { AppState } from '@cf/redux/types/type'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import { produce } from 'immer'
import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { OutcomeGroup } from '..'
import OutcomeHeader from './Header'
import * as Styled from '../styles'

type OutcomeStateType = {
  collapsed: boolean
  operation: null | Instruction['operation']
}

const Outcome = ({
  id,
  title,
  children,
  level,
  code,
  prefix
}: OutcomeType & {
  prefix: (number | string)[]
}) => {
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()
  const sidebarData = useSelector((state: AppState) => state.sidebar.edit)
  const dragging = useSelector((state: AppState) => state.outcomes.dragging)
  const manager = useRef(new BetterSelectionManager(dispatch))
  const [state, setState] = useState<OutcomeStateType>({
    collapsed: true,
    operation: null
  })

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
          const instruction: Instruction | null = extractInstruction(
            args.self.data
          )
          setState(
            produce((draft) => {
              draft.operation = instruction?.operation ?? null
            })
          )
        },
        onDropTargetChange: () => {
          setState(
            produce((draft) => {
              draft.operation = null
            })
          )
        },
        onDrop: (args) => {
          const instruction: Instruction | null = extractInstruction(
            args.self.data
          )

          if (instruction) {
            dispatch(
              moveOutcome({
                targetId: args.source.data.id as number,
                destinationId: args.self.data.id as number,
                operation: instruction.operation
              })
            )
          }

          setState(
            produce((draft) => {
              draft.operation = null
            })
          )
        }
      })
    )
  }, [dispatch, dragHandleRef, dragging, id, level])

  const selected =
    sidebarData.objectType === CfObjectType.OUTCOME && sidebarData.id === id

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

  // use the 'code' prefix, which is only supported at level 1 outcomes
  // otherwise it's all numbers
  const formattedPrefix =
    prefix.length === 1 && level === 1 && code
      ? `${code} - `
      : `${prefix.join('.')}. `

  return (
    <Styled.OutcomeWrapper dragging={dragging?.id === id}>
      <OutcomeHeader
        id={id}
        level={level}
        dragRef={dragHandleRef}
        title={`${formattedPrefix}${title}`}
        selected={selected}
        collapsed={state.collapsed}
        setCollapsed={setCollapsed}
        showToggle={!!children.length}
        onClick={onHeaderClick}
        onToggleClick={onToggleClick}
      />

      {!state.collapsed && (
        <OutcomeGroup
          prefix={prefix.length === 1 && code ? [code] : prefix}
          parentId={id}
        />
      )}

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
