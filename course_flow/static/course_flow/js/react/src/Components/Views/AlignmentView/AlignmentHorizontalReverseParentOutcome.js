import * as React from 'react'
import * as reactDom from 'react-dom'
import { Provider, connect } from 'react-redux'
import OutcomeNodeView from '../../components/OutcomeNode.js'
import { updateOutcomehorizontallinkDegree } from '../../../PostFunctions.js'

/**
 * Display the parent outcome tagged to a child workflow's outcome in the
 * alignment view.
 */

export default class extends React.Component {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.outcomenode
    let props = this.props
    return (
      <div className="alignment-row">
        <OutcomeNodeView
          objectID={data.id}
          renderer={this.props.renderer}
          deleteSelfOverride={() => {
            this.props.renderer.tiny_loader.startLoad()
            updateOutcomehorizontallinkDegree(
              props.child_outcome,
              data.outcome,
              0,
              (response_data) => {
                props.renderer.tiny_loader.endLoad()
              }
            )
          }}
        />
      </div>
    )
  }
}
