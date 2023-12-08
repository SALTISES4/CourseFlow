import * as React from 'react'
import * as reactDom from 'react-dom'
import { Provider, connect } from 'react-redux'
import { OutcomeView } from '../OutcomeView'
import * as Utility from '../../../UtilityFunctions.js'

/*
 * Shows the outcome we are looking at in the analytics view,
 * if we are sorting by outcomes
 */

export default class extends React.Component {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data
    let titlestr = Utility.capWords(
      gettext(this.props.workflow_type + ' outcome')
    )
    return (
      <div className="alignment-block">
        <h3>{titlestr}:</h3>
        <OutcomeView renderer={this.props.renderer} objectID={data.id} />
      </div>
    )
  }
}
