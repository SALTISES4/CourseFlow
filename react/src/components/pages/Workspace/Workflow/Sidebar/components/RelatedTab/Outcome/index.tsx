import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  Outcome as OutcomeType,
  setHighlighted
} from '@cf/redux/slices/outcomes.slice'
import { AppState } from '@cf/redux/types/type'
import { _t } from '@cf/utility/Utility.class'
import * as Styled from '@cfViews/WorkflowView/componentViews/OutcomeEditViewV2/components/OutcomeTree/styles'
import { produce } from 'immer'
import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { OutcomeGroup } from '..'
import OutcomeHeader from './Header'

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
  const highlighted = useSelector(
    (state: AppState) => state.outcomes.highlighted
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

  // use the 'code' prefix, which is only supported at level 1 outcomes
  // otherwise it's all numbers
  const formattedPrefix =
    prefix.length === 1 && level === 1 && code
      ? `${code} - `
      : `${prefix.join('.')}. `

  return (
    <Styled.OutcomeWrapper dragging={state.dragging}>
      <OutcomeHeader
        id={id}
        level={level}
        dragRef={dragHandleRef}
        title={`${formattedPrefix}${title}`}
        collapsed={state.collapsed}
        setCollapsed={setCollapsed}
        showToggle={!!children.length}
        onToggleClick={onToggleClick}
        highlighted={highlighted.indexOf(id) !== -1}
        onClick={onClick}
      />

      {!state.collapsed && (
        <OutcomeGroup
          prefix={prefix.length === 1 && code ? [code] : prefix}
          parentId={id}
        />
      )}
    </Styled.OutcomeWrapper>
  )
}

export default Outcome
