import * as React from 'react'
import { OutcomeNode } from '../WorkflowView'
import { updateOutcomehorizontallinkDegree } from '@XMLHTTP/PostFunctions'

/**
 * Display the parent outcome tagged to a child workflow's outcome in the
 * alignment view.
 */

export default class extends React.Component {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.outcomenode
    const props = this.props
    return (
      <div className="alignment-row">
        <OutcomeNode
          objectID={data.id}
          renderer={this.props.renderer}
          deleteSelfOverride={() => {
            COURSEFLOW_APP.tinyLoader.startLoad()
            updateOutcomehorizontallinkDegree(
              props.child_outcome,
              data.outcome,
              0,
              (response_data) => {
                COURSEFLOW_APP.tinyLoader.endLoad()
              }
            )
          }}
        />
      </div>
    )
  }
}
