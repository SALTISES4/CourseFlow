import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import { getPrefixPath } from '@cfRedux/selectors/outcomes.selector'
import { Outcome as OutcomeType } from '@cfRedux/slices/outcomes.slice'
import { RootState } from '@cfRedux/store'
import * as Styled from '@cfViews/WorkflowView/OutcomeEditView/components/OutcomeTree/styles'
import { produce } from 'immer'
import { MouseEvent, useCallback, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { PropsType as LinkedOutcomesProps, OutcomeGroup } from '../index'
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
  linkParent?: LinkedOutcomesProps['parent']
}) => {
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const prefix = useSelector((state: RootState) => getPrefixPath(state, id))
  const sidebarData = useSelector((state: RootState) => state.sidebar.edit)
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
