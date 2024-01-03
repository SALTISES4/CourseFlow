import * as React from 'react'
import { Outcome } from '../OutcomeEditView'
import * as Utility from '@cfUtility'

/*
 * Shows the outcome we are looking at in the analytics view,
 * if we are sorting by outcomes
 */

export default class extends React.Component {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const titlestr = Utility.capWords(
      gettext(this.props.workflow_type + ' outcome')
    )
    return (
      <div className="alignment-block">
        <h3>{titlestr}:</h3>
        <Outcome renderer={this.props.renderer} objectID={data.id} />
      </div>
    )
  }
}
