import { getPrefixPath } from '@cf/redux/selectors/outcomes.selector'
import { Outcome as OutcomeType } from '@cf/redux/slices/outcomes.slice'
import { AppState } from '@cf/redux/types/type'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import * as Styled from '@cfViews/WorkflowView/componentViews/OutcomeEditViewV2/components/OutcomeTree/styles'
import { produce } from 'immer'
import { MouseEvent, useCallback, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { OutcomeGroup } from '../'
import OutcomeHeader from './Header'

type OutcomeStateType = {
  collapsed: boolean
}

const Outcome = ({
  id,
  level,
  title,
  children,
  linkParent
}: OutcomeType & {
  linkParent?: number
}) => {
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const prefix = useSelector((state: AppState) => getPrefixPath(state, id))
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
    <Styled.OutcomeWrapper>
      <OutcomeHeader
        id={id}
        level={level}
        linkParent={linkParent}
        dragRef={dragHandleRef}
        title={`${prefix}${title}`}
        selected={selected}
        collapsed={state.collapsed}
        showToggle={showToggleButton}
        onToggleClick={onToggleClick}
      />

      {!state.collapsed && <OutcomeGroup parentId={id} />}
    </Styled.OutcomeWrapper>
  )
}

export default Outcome
