import { selectOutcomeById } from '@cfRedux/selectors/outcome.selector'
import { RootState } from '@cfRedux/store'
import { AppState } from '@cfRedux/types/type'
import React from 'react'
import { useSelector } from 'react-redux'

import Outcome from './Outcome'

/**
 * The link between an outcome and its children
 */
type PropsType = {
  parentId: number
  objectId: number
  showHorizontal: any
  parentDepth: any
}

// like other wrappers, unclear whether this component still serves a purpose
// wait for end of fixing drag and drop
const OutcomeWrapper = ({
  parentId,
  objectId,
  showHorizontal,
  parentDepth
}: PropsType) => {
  const outcomeData = useSelector((state: RootState) =>
    selectOutcomeById(state, objectId)
  )

  let myClass = `outcome-outcome outcome-outcome-${parentDepth}`
  if (outcomeData.outcome?.noDrag) {
    myClass += ' no-drag'
  }

  return (
    <li
      className={myClass}
      id={String(outcomeData.outcome?.id)}
      data-child-id={objectId}
    >
      <Outcome
        objectId={objectId}
        parentId={parentId}
        throughParentId={objectId}
        showHorizontal={showHorizontal}
      />
    </li>
  )
}

export default OutcomeWrapper
