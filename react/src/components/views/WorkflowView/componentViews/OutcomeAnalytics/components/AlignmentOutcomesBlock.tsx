import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import * as React from 'react'

import Outcome from '../../OutcomeEditView/components/Outcome'

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
  const titlestr = ThemeHelper.capWords(_t(props.workflowType + ' outcome'))
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
