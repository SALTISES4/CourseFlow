import { _t } from '@cf/utility/utilityFunctions'
import * as Utility from '@cfUtility'
import * as React from 'react'

import Outcome from '../OutcomeEditView/Outcome' // @todo if weird error , check this outcome

type PropsType = {
  data: any
  workflow_type: any
}
/*
 * Shows the outcome we are looking at in the analytics view,
 * if we are sorting by outcomes
 */
const AlignmentOutcomesBlock = (props: PropsType) => {
  const data = props.data
  const titlestr = Utility.capWords(_t(props.workflow_type + ' outcome'))
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
