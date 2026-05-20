import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import * as Styled from '@cf/components/views/WorkflowView/OutcomeEditView/components/OutcomeTree/styles'
import * as StyledOutcomes from '@cf/components/views/WorkflowView/OutcomeEditView/components/OutcomeTree/styles'
import type {
  GraphUuid,
  OutcomeEntity
} from '@cf/features/graph/state/model/types'
import {
  getPrefixPath,
  selectOutcomeById,
  selectOutcomeChildrenById
} from '@cf/features/graph/state/selectors/outcomes.selectors'
import { outcomeUiActions } from '@cf/features/graph/state/slices/outcomeUi.slice'
import { RootState } from '@cf/redux/store'
import { produce } from 'immer'
import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import OutcomeHeader from './Header'

export const Outcome = ({
  graphUuid,
  uuid
}: {
  graphUuid: GraphUuid
  uuid: string
}) => {
  const outcome = useSelector((state: RootState) =>
    selectOutcomeById(state, uuid)
  )

  if (!outcome) {
    return null
  }

  return (
    <StyledOutcomes.OutcomeGroup sx={{ mt: '0.5em !important' }}>
      <StyledOutcomes.OutcomeGroupItem>
        <OutcomeBlock graphUuid={graphUuid} {...outcome} />
      </StyledOutcomes.OutcomeGroupItem>
    </StyledOutcomes.OutcomeGroup>
  )
}

const OutcomeBlock = ({
  graphUuid,
  uuid,
  title
}: OutcomeEntity & { graphUuid: GraphUuid }) => {
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()
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
  const highlighted = useSelector(
    (state: RootState) => state.graph.outcomeUi.highlightedOutcomeUuids
  )
  const [state, setState] = useState({
    collapsed: true,
    dragging: false
  })

  const onClick = useCallback(() => {
    dispatch(outcomeUiActions.toggleHighlighted(uuid))
  }, [dispatch, uuid])

  useEffect(() => {
    const el = dragHandleRef.current

    if (!el) {
      return
    }

    return draggable({
      element: el,
      getInitialData: () => ({ uuid, type: 'link_outcome', level }),
      onDragStart: () => {
        setState(
          produce((draft) => {
            draft.dragging = true
          })
        )
      },
      onDrop: () => {
        setState(
          produce((draft) => {
            draft.dragging = false
          })
        )
      }
    })
  }, [level, uuid])

  const onToggleClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setState(
      produce((draft) => {
        draft.collapsed = !draft.collapsed
      })
    )
  }, [])

  const setCollapsed = useCallback((value: boolean) => {
    setState(
      produce((draft) => {
        draft.collapsed = value
      })
    )
  }, [])

  return (
    <Styled.OutcomeWrapper dragging={state.dragging}>
      <OutcomeHeader
        uuid={uuid}
        level={level}
        dragRef={dragHandleRef}
        title={`${prefix}${title}`}
        collapsed={state.collapsed}
        setCollapsed={setCollapsed}
        showToggle={!!childOutcomes.length}
        onToggleClick={onToggleClick}
        highlighted={highlighted.includes(uuid)}
        onClick={onClick}
      />

      {!state.collapsed && (
        <OutcomeChildren graphUuid={graphUuid} parentUuid={uuid} />
      )}
    </Styled.OutcomeWrapper>
  )
}

export const OutcomeChildren = ({
  graphUuid,
  parentUuid
}: {
  graphUuid: GraphUuid
  parentUuid: string
}) => {
  const childOutcomes = useSelector((state: RootState) =>
    selectOutcomeChildrenById(state, graphUuid, parentUuid)
  )

  if (!childOutcomes.length) {
    return null
  }

  return (
    <StyledOutcomes.OutcomeGroup>
      {childOutcomes.map((outcome) => (
        <StyledOutcomes.OutcomeGroupItem key={outcome.uuid}>
          <OutcomeBlock graphUuid={graphUuid} {...outcome} />
        </StyledOutcomes.OutcomeGroupItem>
      ))}
    </StyledOutcomes.OutcomeGroup>
  )
}

export default Outcome
