import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  getPrefixPath,
  selectOutcomeById,
  selectOutcomeChildrenById
} from '@cf/redux/selectors/outcomes.selector'
import {
  Outcome as OutcomeType,
  setHighlighted
} from '@cf/redux/slices/outcomes.slice'
import { _t } from '@cf/utility/Utility.class'
import { RootState } from '@cfRedux/store'
import * as Styled from '@cfViews/WorkflowView/OutcomeEditView/components/OutcomeTree/styles'
import * as StyledOutcomes from '@cfViews/WorkflowView/OutcomeEditView/components/OutcomeTree/styles'
import { produce } from 'immer'
import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import OutcomeHeader from './Header'

export const Outcome = ({ id }: { id: string }) => {
  const outcome = useSelector((state: RootState) =>
    selectOutcomeById(state, id)
  )

  return (
    <StyledOutcomes.OutcomeGroup sx={{ mt: '0.5em !important' }}>
      <StyledOutcomes.OutcomeGroupItem>
        <OutcomeBlock {...outcome} />
      </StyledOutcomes.OutcomeGroupItem>
    </StyledOutcomes.OutcomeGroup>
  )
}

const OutcomeBlock = ({ id, title, children, level }: OutcomeType) => {
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()
  const prefix = useSelector((state: RootState) => getPrefixPath(state, id))
  const highlighted = useSelector(
    (state: RootState) => state.outcomes.highlighted
  )
  const [state, setState] = useState({
    collapsed: true,
    dragging: false
  })

  const onClick = useCallback(() => {
    dispatch(setHighlighted(id))
  }, [dispatch, id])

  useEffect(() => {
    const el = dragHandleRef.current

    if (!el) {
      return
    }

    return draggable({
      element: el,
      getInitialData: () => ({ id, type: 'link_outcome' }),
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
  }, [dragHandleRef, id, level])

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
        id={id}
        level={level}
        dragRef={dragHandleRef}
        title={`${prefix}${title}`}
        collapsed={state.collapsed}
        setCollapsed={setCollapsed}
        showToggle={!!children.length}
        onToggleClick={onToggleClick}
        highlighted={highlighted.indexOf(id) !== -1}
        onClick={onClick}
      />

      {!state.collapsed && <OutcomeChildren parentId={id} />}
    </Styled.OutcomeWrapper>
  )
}

export const OutcomeChildren = ({ parentId }: { parentid: string | null }) => {
  const childOutcomes = useSelector((state: RootState) =>
    selectOutcomeChildrenById(state, parentId)
  )

  if (!childOutcomes.length) {
    return null
  }

  return (
    <StyledOutcomes.OutcomeGroup>
      {childOutcomes.map((outcome) => (
        <StyledOutcomes.OutcomeGroupItem key={outcome.id}>
          <OutcomeBlock {...outcome} />
        </StyledOutcomes.OutcomeGroupItem>
      ))}
    </StyledOutcomes.OutcomeGroup>
  )
}

export default Outcome
