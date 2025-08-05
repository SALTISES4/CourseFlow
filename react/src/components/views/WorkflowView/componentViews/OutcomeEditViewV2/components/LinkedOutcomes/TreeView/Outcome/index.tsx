import { Outcome as OutcomeType } from '@cf/redux/slices/outcomes.slice'
import { AppState } from '@cf/redux/types/type'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import * as Styled from '@cfViews/WorkflowView/componentViews/OutcomeEditViewV2/components/OutcomeTree/styles'
import { produce } from 'immer'
import { MouseEvent, useCallback, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import OutcomeGroup from '../OutcomeGroup'
import OutcomeHeader from './Header'

type OutcomeStateType = {
  collapsed: boolean
}

const Outcome = ({
  id,
  prefix,
  title,
  children,
  level
}: OutcomeType & { prefix: number[] }) => {
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const sidebarData = useSelector((state: AppState) => state.sidebar.edit)
  const [state, setState] = useState<OutcomeStateType>({
    collapsed: true
  })

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

  const showToggleButton = !!children.length && level !== 3

  return (
    <Styled.OutcomeWrapper dragging={false}>
      <OutcomeHeader
        id={id}
        level={level}
        dragRef={dragHandleRef}
        title={`${prefix.join('.')} - ${title}`}
        selected={selected}
        collapsed={state.collapsed}
        showToggle={showToggleButton}
        onToggleClick={onToggleClick}
      />

      {!state.collapsed && (
        <OutcomeGroup prefix={prefix} level={level + 1} outcomes={children} />
      )}
    </Styled.OutcomeWrapper>
  )
}

export default Outcome
