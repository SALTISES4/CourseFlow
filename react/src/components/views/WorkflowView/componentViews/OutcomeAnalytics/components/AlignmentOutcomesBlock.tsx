import { _t } from '@cf/utility/utilityFunctions'
import * as Utility from '@cf/utility/utilityFunctions'
import * as React from 'react'

import Outcome from '../../OutcomeEditView/Outcome' // @todo if weird error , check this outcome

type PropsType = {
  data: any
  workflowType: any
}
/*
 * Shows the outcome we are looking at in the analytics view,
 * if we are sorting by outcomes
 */
const AlignmentOutcomesBlock = (props: PropsType) => {
  const data = props.data
  const titlestr = Utility.capWords(_t(props.workflowType + ' outcome'))
  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <div className="alignment-block">
      <h3>{titlestr}:</h3>
      <Outcome objectId={data.id} />
    </div>
  )
}

export default AlignmentOutcomesBlock
