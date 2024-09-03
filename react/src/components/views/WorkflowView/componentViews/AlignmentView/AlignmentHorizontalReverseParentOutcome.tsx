import * as React from 'react'
import { updateOutcomehorizontallinkDegree } from '@XMLHTTP/API/update'
import OutcomeNode from '@cfViews/components/OutcomeNode'

type PropsType = {
  outcomenode: any
  child_outcome: any
}
/**
 * Display the parent outcome tagged to a child workflow's outcome in the
 * alignment view.
 */

class AlignmentHorizontalReverseParentOutcome extends React.Component<PropsType> {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.outcomenode
    const props = this.props
    return (
      <div className="alignment-row">
        <OutcomeNode
          objectId={data.id}
          // renderer={this.props.renderer}
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

export default AlignmentHorizontalReverseParentOutcome
