import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import { NodeTitle } from '@cfComponents/UIPrimitives/Titles'
import * as Constants from '@cfConstants'
import EditableComponentWithComments from '@cfEditableComponents/EditableComponentWithComments'
import { EditableComponentWithCommentsStateType } from '@cfEditableComponents/EditableComponentWithComments'
import { getChildWorkflowByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import * as Utility from '@cfUtility'
import OutcomeNode from '@cfViews/components/OutcomeNode'
import { newOutcomeQuery } from '@XMLHTTP/API/create'
import { updateOutcomenodeDegree } from '@XMLHTTP/API/update'
import * as React from 'react'
import { connect } from 'react-redux'

import AlignmentHorizontalReverseChildOutcome from './AlignmentHorizontalReverseChildOutcome'
import OutcomeAdder from './OutcomeAdder'

type ConnectedProps = {
  workflow: any
  data: any
  column: any
  child_outcomes: any
  outcomenodes: any
  all_node_outcomes: any
}
type OwnProps = {
  restriction_set: any
  objectId: any
}
type StateProps = {
  show_all?: boolean
} & EditableComponentWithCommentsStateType
type PropsType = ConnectedProps & OwnProps

/**
 * The representation of a node in the alignment view. It will display
 * the outcomes that the child workflow has that have the required parent outcomes
 * tagged to them
 */
class AlignmentHorizontalReverseNode extends EditableComponentWithComments<
  PropsType,
  StateProps
> {
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.NODE
    this.state = {} as EditableComponentWithCommentsStateType
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  /**
   * Adds a new outcome to the linked workflow
   */
  addNewChildOutcome() {
    newOutcomeQuery(this.props.data.linkedWorkflow, null)
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  ChildOutcomesHeader = () => {
    const data = this.props.data
    if (this.props.child_outcomes.length > 0) {
      return (
        <div className="child-outcome child-outcome-header">
          <div className="half-width alignment-column">
            {Utility.capWords(_t(`${data.linkedWorkflowData.type} outcomes`))}{' '}
            {_t('From Linked Workflow')}
          </div>
          <div className="half-width alignment-column">
            {_t('Associated ')}
            {Utility.capWords(_t(`${this.props.workflow.type} outcomes`))}
          </div>
        </div>
      )
    }

    if (data.linkedWorkflow) {
      if (this.props.child_outcomes === -1) {
        // TS2339: Property childWorkflowDataNeeded does not exist on type ChildRenderer
        // @ts-ignore
        this.context.childWorkflowDataNeeded(this.props.data.id)
        return (
          <div className="child-outcome child-outcome-header">
            {_t('... LOADING')}
          </div>
        )
      }

      if (data.linkedWorkflowData.deleted) {
        return (
          <div className="child-outcome child-outcome-header">
            {_t('The linked workflow has been deleted.')}
          </div>
        )
      }

      return (
        <div className="child-outcome child-outcome-header">
          {_t(
            'No outcomes have been added to the linked workflow. When added, they will appear here.'
          )}
        </div>
      )
    }

    return (
      <div className="child-outcome child-outcome-header">
        {_t(
          'No workflow has been linked to this node. If you link a workflow, its outcomes will appear here.'
        )}
      </div>
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    let data_override

    if (data.representsWorkflow) {
      data_override = { ...data, ...data.linkedWorkflowData, id: data.id }
    } else {
      data_override = { ...data }
    }

    const selectionManager = this.context.selectionManager
    // let child_outcomes_header
    const child_outcomes_header = <this.ChildOutcomesHeader />

    // if (this.props.child_outcomes.length > 0) {
    //   child_outcomes_header = (
    //     <div className="child-outcome child-outcome-header">
    //       <div className="half-width alignment-column">
    //         {Utility.capWords(
    //           window.gettext(data.linkedWorkflowData.type + ' outcomes')
    //         ) + _t(' From Linked Workflow')}
    //       </div>
    //       <div className="half-width alignment-column">
    //         {_t('Associated ') +
    //           Utility.capWords(
    //             window.gettext(this.props.workflow.type + ' outcomes')
    //           )}
    //       </div>
    //     </div>
    //   )
    // } else {
    //   if (data.linkedWorkflow) {
    //     if (this.props.child_outcomes == -1) {
    //       child_outcomes_header = (
    //         <div className="child-outcome child-outcome-header">
    //           {_t('... LOADING')}
    //         </div>
    //       )
    //       this.context.childWorkflowDataNeeded(this.props.data.id)
    //     } else {
    //       if (data.linkedWorkflowData.deleted) {
    //         child_outcomes_header = (
    //           <div className="child-outcome child-outcome-header">
    //             {_t('The linked workflow has been deleted.')}
    //           </div>
    //         )
    //       } else {
    //         child_outcomes_header = (
    //           <div className="child-outcome child-outcome-header">
    //             {window.gettext(
    //               'No outcomes have been added to the linked workflow. When added, they will appear here.'
    //             )}
    //           </div>
    //         )
    //       }
    //     }
    //   } else {
    //     child_outcomes_header = (
    //       <div className="child-outcome child-outcome-header">
    //         {window.gettext(
    //           'No workflow has been linked to this node. If you link a workflow, its outcomes will appear here.'
    //         )}
    //       </div>
    //     )
    //   }
    // }

    let child_outcomes
    if (this.props.child_outcomes != -1) {
      child_outcomes = this.props.child_outcomes.map((childOutcome, index) => {
        if (
          !this.state.show_all &&
          this.props.restriction_set?.child_outcomes?.indexOf(childOutcome) ===
            -1
        )
          return null

        return (
          <AlignmentHorizontalReverseChildOutcome
            key={index}
            objectId={childOutcome}
            node_data={data}
            // renderer={this.props.renderer}
            restriction_set={this.props.restriction_set}
          />
        )
      })
    }
    let show_all

    //if child outcomes are restricted, we need a show all button that expands to show all of them instead. Otherwise we only need to show the outcomes currently attached to the node.
    const outcomenodes = this.props.outcomenodes.map((outcomenode) => (
      <OutcomeNode key={outcomenode.id} objectId={outcomenode.id} />
    ))

    const outcome_restriction =
      this.props.restriction_set.parentOutcomes.filter(
        (oc) => this.props.all_node_outcomes.indexOf(oc) === -1
      )

    let outcomeadder

    if (!this.context.permissions.workflowPermission.readOnly)
      outcomeadder = (
        <OutcomeAdder
          outcome_set={outcome_restriction}
          addFunction={updateOutcomenodeDegree.bind(this, this.props.objectId)}
        />
      )

    const outcomes_for_node = (
      <div>
        <div className="node-outcomes-header">
          {Utility.capWords(_t(this.props.workflow.type + ' outcomes')) +
            _t(' for node:')}
        </div>
        {outcomenodes}
        {outcomeadder}
      </div>
    )

    let add_new_outcome

    if (
      !this.context.permissions.workflowPermission.readOnly &&
      data.linkedWorkflow
    )
      add_new_outcome = (
        <div
          id="add-new-outcome"
          className="menu-create hover-shade"
          onClick={this.addNewChildOutcome.bind(this)}
        >
          <img
            className="create-button"
            src={
              COURSEFLOW_APP.globalContextData.path.static_assets.icon +
              'add_new_white.svg'
            }
          />
          <div>{_t('Add new')}</div>
        </div>
      )

    if (data.linkedWorkflow && this.props.restriction_set?.child_outcomes) {
      if (this.state.show_all) {
        show_all = (
          <div className="alignment-added-outcomes">
            {add_new_outcome}
            {outcomes_for_node}
            <div
              className="alignment-show-all"
              onClick={() => this.setState({ show_all: false })}
            >
              {'-' + _t('Hide Unused')}
            </div>
          </div>
        )
      } else {
        show_all = (
          <div className="alignment-added-outcomes">
            <div
              className="alignment-show-all"
              onClick={() => this.setState({ show_all: true })}
            >
              {'+' + _t('Show All')}
            </div>
          </div>
        )
      }
    } else {
      show_all = (
        <div className="alignment-added-outcomes">
          {add_new_outcome}
          {outcomes_for_node}
        </div>
      )
    }

    const style: React.CSSProperties = {
      backgroundColor: Constants.getColumnColour(this.props.column)
    }
    if (data.lock) {
      style.outline = '2px solid ' + data.lock.userColour
    }

    const comments = this.context.workflow.viewComments ? (
      <this.AddCommenting />
    ) : (
      ''
    )

    return (
      <div className="node-week">
        <div
          style={style}
          className={'node column-' + data.column}
          onClick={(evt) => selectionManager.changeSelection(evt, this)}
          ref={this.mainDiv}
        >
          <div className="node-top-row">
            <NodeTitle data={data} />
          </div>
          <div className="outcome-block">
            {child_outcomes_header}
            {child_outcomes}
          </div>
          <div className="node-drop-row">{show_all}</div>
          {this.addEditable(data_override, true)}
          <div className="side-actions">
            <div className="comment-indicator-container"></div>
          </div>
          <div className="mouseover-actions">{comments}</div>
        </div>
      </div>
    )
  }
}

const mapAlignmentHorizontalReverseNodeStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  for (let i = 0; i < state.node.length; i++) {
    if (state.node[i].id == ownProps.objectId) {
      const node = state.node[i]
      const column = state.column.find((column) => column.id == node.column)
      let outcomenodes = Utility.filterThenSortByID(
        state.outcomenode,
        node.outcomenodeUniqueSet
      )
      if (
        ownProps.restriction_set &&
        ownProps.restriction_set.parentOutcomes
      ) {
        outcomenodes = outcomenodes.filter(
          (ocn) =>
            ownProps.restriction_set.parentOutcomes.indexOf(ocn.outcome) >= 0
        )
      }
      const node_outcomes = Utility.filterThenSortByID(
        state.outcomenode,
        node.outcomenodeSet
      ).map((ocn) => ocn.outcome)

      if (!node.linkedWorkflow || node.linkedWorkflowData.deleted) {
        return {
          workflow: state.workflow,
          data: node,
          column: column,
          child_outcomes: [],
          outcomenodes: outcomenodes,
          all_node_outcomes: node_outcomes
        }
      }

      const child_workflow = getChildWorkflowByID(state, node.linkedWorkflow)

      let child_outcomes

      if (child_workflow != -1)
        child_outcomes = Utility.filterThenSortByID(
          state.outcomeworkflow,
          child_workflow.data.outcomeworkflowSet
        ).map((outcomeworkflow) => outcomeworkflow.outcome)
      else child_outcomes = -1

      return {
        workflow: state.workflow,
        data: node,
        column: column,
        child_outcomes: child_outcomes,
        outcomenodes: outcomenodes,
        all_node_outcomes: node_outcomes
      }
    }
  }
}

/*******************************************************
 * CONNECT REDUX
 *******************************************************/
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapAlignmentHorizontalReverseNodeStateToProps,
  null
)(AlignmentHorizontalReverseNode)
