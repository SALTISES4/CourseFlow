import * as React from 'react'
import { Outcome } from '../OutcomeEditView'
import * as Utility from '@cfUtility'

type PropsType = {
  data: any
  workflow_type: any
}
/*
 * Shows the outcome we are looking at in the analytics view,
 * if we are sorting by outcomes
 */

class AlignmentOutcomesBlock extends React.Component<PropsType> {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const titlestr = Utility.capWords(
      window.gettext(this.props.workflow_type + ' outcome')
    )
    return (
      <div className="alignment-block">
        <h3>{titlestr}:</h3>
        <Outcome objectID={data.id} />
      </div>
    )
  }
}

export default AlignmentOutcomesBlock
