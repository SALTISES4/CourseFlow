import OutcomeNode from '@cfViews/common/OutcomeNode'
import { updateOutcomehorizontallinkDegree } from '@XMLHTTP/API/update'
import * as React from 'react'

type PropsType = {
  outcomenode: any
  childOutcome: any
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
              props.childOutcome,
              data.outcome,
              0,
              (responseData) => {
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
