import * as React from 'react'
import * as reactDom from 'react-dom'
import { Provider, connect } from 'react-redux'
import * as OutcomeNode from '../../OutcomeNode/outcomeNode.js'

import { getSortedOutcomeNodesFromNodes } from '@cfFindState'
import ParentOutcome from './ParentOutcomeBarOutcome.js'

/**
 * The outcomes tab of the right sidebar. This version is shown
 * in the edit outcomes view, to drag and drop outcomes from the
 * parent workflow.
 */
class ParentOutcomeBarUnconnected extends React.Component {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data
    var outcomebaroutcomes = data.map((category) => [
      <hr />,
      <div>
        <h4>{category.objectset.title}</h4>
        {category.outcomes.map((outcome) => (
          <div className="parent-outcome-node">
            {OutcomeNode.getCompletionImg(outcome.degree, 1)}
            <ParentOutcome
              key={outcome.id}
              objectID={outcome.id}
              renderer={this.props.renderer}
            />
          </div>
        ))}
      </div>
    ])

    if (outcomebaroutcomes.length == 0) {
      outcomebaroutcomes = gettext(
        "Here you can find outcomes from the workflows that contain a node linked to this workflow. This allows you to create relationships between the outcomes at different levels (ex. program to course), called 'alignment'. Link this workflow to a node in another to do so."
      )
    }

    let multiple_parent_warning
    if (this.props.parent_nodes.length > 1) {
      multiple_parent_warning = (
        <div>
          <span className="material-symbols-rounded filled small-inline red">
            error
          </span>
          {gettext(
            'Warning: you have linked this workflow to multiple nodes. This is not recommended. You may see outcomes from different parent workflows, or duplicates of outcomes.'
          )}
        </div>
      )
    }

    return (
      <div id="outcome-bar-workflow" className="right-panel-inner">
        <h3 className="drag-and-drop">
          {gettext('Outcomes from Parent Workflow')}
        </h3>
        <div className="outcome-bar-outcome-block">
          {multiple_parent_warning}
          {outcomebaroutcomes}
        </div>
      </div>
    )
  }
}
const mapParentOutcomeBarStateToProps = (state) => {
  return {
    data: getSortedOutcomeNodesFromNodes(state, state.parent_node),
    workflow: state.workflow,
    parent_nodes: state.parent_node
  }
}
export default connect(
  mapParentOutcomeBarStateToProps,
  null
)(ParentOutcomeBarUnconnected)
