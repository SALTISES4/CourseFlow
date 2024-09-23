import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { _t } from '@cf/utility/utilityFunctions'
import CompletionImg from '@cfComponents/UIPrimitives/CompletionIng'
import {
  TSortedOutcomeNodes,
  getSortedOutcomeNodesFromNodes
} from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import ErrorIcon from '@mui/icons-material/Error'
import * as React from 'react'
import { connect } from 'react-redux'

import ParentOutcome from './ParentOutcomeBarOutcome'

/**
 * The outcomes tab of the right sidebar. This version is shown
 * in the edit outcomes view, to drag and drop outcomes from the
 * parent workflow.
 */
type ConnectedProps = {
  data: TSortedOutcomeNodes
  workflow: AppState['workflow']
  parentNodes: AppState['parentNode']
}
type SelfProps = {
  // renderer: any
}
type PropsType = SelfProps & ConnectedProps
class ParentOutcomeBarUnconnected extends React.Component<PropsType> {
  static contextType = WorkFlowConfigContext
  declare context: React.ContextType<typeof WorkFlowConfigContext>

  constructor(props: PropsType) {
    super(props)
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const placeholderText = _t(
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
                  outcomesType={1}
                  completionStatus={outcomeItem.degree}
                />
                <ParentOutcome
                  key={outcomeItem.id}
                  objectId={outcomeItem.id}
                  // renderer={this.props.renderer} // @todo previous props were undefined, are they needed?
                  // @ts-ignore // @todo
                  parentID={null}
                  readOnly={!this.props.workflow.workflowPermission.write}
                  throughParentID={null}
                />
              </div>
            ))}
          </div>
        </div>
      )
    })

    let multiple_parent_warning
    if (this.props.parentNodes.length > 1) {
      multiple_parent_warning = (
        <div>
          {/* filled red small-inline */}
          <ErrorIcon />
          {_t(
            'Warning: you have linked this workflow to multiple nodes. This is not recommended. You may see outcomes from different parent workflows, or duplicates of outcomes.'
          )}
        </div>
      )
    }

    return (
      <div id="outcome-bar-workflow" className="right-panel-inner">
        <h3 className="drag-and-drop">{_t('Outcomes from Parent Workflow')}</h3>
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
    data: getSortedOutcomeNodesFromNodes(state, state.parentNode),
    workflow: state.workflow,
    parentNodes: state.parentNode
  }
}
export default connect<ConnectedProps, object, SelfProps, AppState>(
  mapStateToProps,
  null
)(ParentOutcomeBarUnconnected)
