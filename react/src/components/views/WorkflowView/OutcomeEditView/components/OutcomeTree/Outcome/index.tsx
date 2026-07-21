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
import { WorkflowPermission } from '@cf/api/gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import type {
  GraphUuid,
  OutcomeEntity
} from '@cf/features/graph/state/model/types'
import {
  getPrefixPath,
  selectOutcomeChildrenById
} from '@cf/features/graph/state/selectors/outcomes.selectors'
import { outcomeUiActions } from '@cf/features/graph/state/slices/outcomeUi.slice'
import { moveOutcome } from '@cf/features/graph/state/thunks/outcomeMutations.thunks'
import BetterSelectionManager from '@cf/features/selection/betterSelectionManager'
import type { AppDispatch } from '@cf/redux/store'
import { RootState } from '@cf/redux/store'
import { CfObjectType } from '@cf/types/enum'
import { produce } from 'immer'
import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import OutcomeHeader from './Header'
import * as Styled from '../styles'

type OutcomeStateType = {
  collapsed: boolean
  dragHighlight: boolean
  operation: null | Instruction['operation']
}

const Outcome = ({
  graphUuid,
  uuid,
  title,
  tagIds,
  greenHover
}: OutcomeEntity & {
  graphUuid: GraphUuid
  greenHover?: boolean
}) => {
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch<AppDispatch>()
  const canManageOutcomes = useResourcePermission(
    WorkflowPermission.OUTCOME_MANAGEMENT
  )
  const sidebarData = useSelector((state: RootState) => state.sidebar.edit)
  const dragging = useSelector(
    (state: RootState) => state.graph.outcomeUi.dragging
  )
  const prefix = useSelector((state: RootState) =>
    getPrefixPath(state, graphUuid, uuid)
  )
  const level = useSelector((state: RootState) => {
    let depth = 0
    let current = state.graph.canonical.outcomes.entities[uuid]
    while (current?.parentUuid) {
      depth += 1
      current = state.graph.canonical.outcomes.entities[current.parentUuid]
    }
    return depth
  })
  const childOutcomes = useSelector((state: RootState) =>
    selectOutcomeChildrenById(state, graphUuid, uuid)
  )
  const manager = useRef(new BetterSelectionManager(dispatch))
  const [state, setState] = useState<OutcomeStateType>({
    collapsed: true,
    dragHighlight: false,
    operation: null
  })

  const selected =
    sidebarData.objectType === CfObjectType.OUTCOME && sidebarData.uuid === uuid

  const highlighted = false

  useEffect(() => {
    const el = dragHandleRef.current

    if (!el || !canManageOutcomes) {
      return
    }

    const childUuids = childOutcomes.map((c) => c.uuid)

    return combine(
      draggable({
        element: el,
        getInitialData: () => ({ uuid, level }),
        onDragStart: () => {
          dispatch(outcomeUiActions.setDragging({ uuid, level }))
        },
        onDrop: () => {
          dispatch(outcomeUiActions.setDragging(null))
        }
      }),
      dropTargetForElements({
        element: el,
        getData: ({ input, element }) => {
          const data = { uuid }

          const reorder = dragging?.uuid !== uuid && dragging?.level === level

          let combine = dragging?.uuid !== uuid && dragging?.level === level + 1

          if (childUuids.includes(dragging?.uuid ?? '')) {
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
              draft.dragHighlight = false
              draft.operation = null
            })
          )
        },
        onDrop: (args) => {
          const sourceUuid = args.source.data.uuid as string
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

            if (instruction.operation === 'combine') {
              dispatch(
                moveOutcome({
                  graphUuid,
                  outcomeUuid: sourceUuid,
                  parentUuid: uuid,
                  parentUuidProvided: true
                })
              )
            } else if (instruction.operation === 'reorder-before') {
              dispatch(
                moveOutcome({
                  graphUuid,
                  outcomeUuid: sourceUuid,
                  beforeUuid: uuid
                })
              )
            } else if (instruction.operation === 'reorder-after') {
              dispatch(
                moveOutcome({
                  graphUuid,
                  outcomeUuid: sourceUuid,
                  afterUuid: uuid
                })
              )
            }
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
  }, [
    canManageOutcomes,
    dispatch,
    dragging?.uuid,
    dragging?.level,
    uuid,
    level,
    childOutcomes,
    graphUuid
  ])

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
    if (!canManageOutcomes) {
      return
    }
    if (selected) {
      manager.current.clearSidebar()
    } else {
      manager.current.updateSidebar(uuid, CfObjectType.OUTCOME, '-1')
    }
  }, [canManageOutcomes, uuid, selected])

  return (
    <Styled.OutcomeWrapper dragging={dragging?.uuid === uuid}>
      <OutcomeHeader
        graphUuid={graphUuid}
        uuid={uuid}
        level={level}
        tags={tagIds}
        greenHover={greenHover}
        dragRef={dragHandleRef}
        title={`${prefix}${title}`}
        selected={selected || state.dragHighlight}
        highlighted={highlighted}
        collapsed={state.collapsed}
        setCollapsed={setCollapsed}
        showToggle={!!childOutcomes.length}
        onClick={onHeaderClick}
        onToggleClick={onToggleClick}
      />

      {state.operation && (
        <DropIndicator
          lineGap="8px"
          lineType="no-terminal"
          instruction={{
            operation: state.operation,
            axis: 'vertical',
            blocked: false
          }}
        />
      )}

      {!state.collapsed && childOutcomes.length > 0 && (
        <Styled.OutcomeGroup>
          {childOutcomes.map((child) => (
            <Styled.OutcomeGroupItem key={child.uuid}>
              <Outcome {...child} graphUuid={graphUuid} greenHover />
            </Styled.OutcomeGroupItem>
          ))}
        </Styled.OutcomeGroup>
      )}
    </Styled.OutcomeWrapper>
  )
}

export default Outcome
