import * as React from 'react'
import { connect } from 'react-redux'
import * as Utility from '@cfUtility'

import { getSortedOutcomeNodesFromNodes } from '@cfFindState'
import ParentOutcome from './ParentOutcomeBarOutcome'
import { AppState } from '@cfRedux/type'
import CompletionImg from '@cfUIComponents/CompletionImg'

/**
 * The outcomes tab of the right sidebar. This version is shown
 * in the edit outcomes view, to drag and drop outcomes from the
 * parent workflow.
 */
type ConnectedProps = {
  data: any
  workflow: AppState['workflow']
  parent_nodes: AppState['parent_node']
}
type SelfProps = {
  renderer: any
}
type PropsType = SelfProps & ConnectedProps
class ParentOutcomeBarUnconnected extends React.Component<PropsType> {
  constructor(props: PropsType) {
    super(props)
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const placeholderText = window.gettext(
      "Here you can find outcomes from the workflows that contain a node linked to this workflow. This allows you to create relationships between the outcomes at different levels (ex. program to course), called 'alignment'. Link this workflow to a node in another to do so."
    )

    const outcomeBarOutcomes = data.map((categoryItem, index) => {
      return (
        <div key={index}>
          <hr />
          <div>
            <h4>{categoryItem.objectset.title}</h4>
            {categoryItem.outcomes.map((outcomeItem, index) => (
              <div key={index} className="parent-outcome-node">
                {/* @todo double check these vars  */}
                <CompletionImg
                  outcomesType={outcomeItem.degree}
                  completionStatus={1}
                />
                <ParentOutcome
                  key={outcomeItem.id}
                  objectID={outcomeItem.id}
                  // renderer={this.props.renderer} // @todo previous props were undefined, are they needed?
                  parentID={this.props.renderer.parentID}
                  readOnly={this.props.renderer.readOnly}
                  throughParentID={this.props.data.id}
                />
              </div>
            ))}
          </div>
        </div>
      )
    })

    let multiple_parent_warning
    if (this.props.parent_nodes.length > 1) {
      multiple_parent_warning = (
        <div>
          <span className="material-symbols-rounded filled small-inline red">
            error
          </span>
          {window.gettext(
            'Warning: you have linked this workflow to multiple nodes. This is not recommended. You may see outcomes from different parent workflows, or duplicates of outcomes.'
          )}
        </div>
      )
    }

    return (
      <div id="outcome-bar-workflow" className="right-panel-inner">
        <h3 className="drag-and-drop">
          {window.gettext('Outcomes from Parent Workflow')}
        </h3>
        <div className="outcome-bar-outcome-block">
          {multiple_parent_warning}
          {outcomeBarOutcomes.length ? outcomeBarOutcomes : placeholderText}
        </div>
      </div>
    )
  }
}
const mapStateToProps = (state: AppState): ConnectedProps => {
  return {
    data: getSortedOutcomeNodesFromNodes(state, state.parent_node),
    workflow: state.workflow,
    parent_nodes: state.parent_node
  }
}
export default connect<
  ConnectedProps,
  NonNullable<unknown>,
  SelfProps,
  AppState
>(
  mapStateToProps,
  null
)(ParentOutcomeBarUnconnected)
