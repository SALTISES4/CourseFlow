import * as React from 'react'
import { connect } from 'react-redux'
import { EditableComponentWithComments } from '@cfParentComponents'
import { NodeTitle } from '@cfUIComponents'
import { getChildWorkflowByID } from '@cfFindState'
import * as Utility from '@cfUtility'
import * as Constants from '@cfConstants'
import AlignmentHorizontalReverseChildOutcome from './AlignmentHorizontalReverseChildOutcome'
import OutcomeAdder from './OutcomeAdder'
import OutcomeNode from '@cfViews/WorkflowView/OutcomeNode'
import { updateOutcomenodeDegree } from '@XMLHTTP/API/update'
import { CfObjectType } from '@cfModule/types/enum'
import { newOutcomeQuery } from '@XMLHTTP/API/create'
import { EditableComponentWithCommentsStateType } from '@cfParentComponents/EditableComponentWithComments'
import { AppState } from '@cfRedux/types/type'

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
  objectID: any
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
    newOutcomeQuery(this.props.data.linked_workflow, null)
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
            {Utility.capWords(
              window.gettext(`${data.linked_workflow_data.type} outcomes`)
            )}{' '}
            {window.gettext('From Linked Workflow')}
          </div>
          <div className="half-width alignment-column">
            {window.gettext('Associated ')}
            {Utility.capWords(
              window.gettext(`${this.props.workflow.type} outcomes`)
            )}
          </div>
        </div>
      )
    }

    if (data.linked_workflow) {
      if (this.props.child_outcomes === -1) {
        // TS2339: Property childWorkflowDataNeeded does not exist on type ChildRenderer
        // @ts-ignore
        this.context.childWorkflowDataNeeded(this.props.data.id)
        return (
          <div className="child-outcome child-outcome-header">
            {window.gettext('... LOADING')}
          </div>
        )
      }

      if (data.linked_workflow_data.deleted) {
        return (
          <div className="child-outcome child-outcome-header">
            {window.gettext('The linked workflow has been deleted.')}
          </div>
        )
      }

      return (
        <div className="child-outcome child-outcome-header">
          {window.gettext(
            'No outcomes have been added to the linked workflow. When added, they will appear here.'
          )}
        </div>
      )
    }

    return (
      <div className="child-outcome child-outcome-header">
        {window.gettext(
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

    if (data.represents_workflow) {
      data_override = { ...data, ...data.linked_workflow_data, id: data.id }
    } else {
      data_override = { ...data }
    }

    const selection_manager = this.context.selection_manager
    // let child_outcomes_header
    const child_outcomes_header = <this.ChildOutcomesHeader />

    // if (this.props.child_outcomes.length > 0) {
    //   child_outcomes_header = (
    //     <div className="child-outcome child-outcome-header">
    //       <div className="half-width alignment-column">
    //         {Utility.capWords(
    //           window.gettext(data.linked_workflow_data.type + ' outcomes')
    //         ) + window.gettext(' From Linked Workflow')}
    //       </div>
    //       <div className="half-width alignment-column">
    //         {window.gettext('Associated ') +
    //           Utility.capWords(
    //             window.gettext(this.props.workflow.type + ' outcomes')
    //           )}
    //       </div>
    //     </div>
    //   )
    // } else {
    //   if (data.linked_workflow) {
    //     if (this.props.child_outcomes == -1) {
    //       child_outcomes_header = (
    //         <div className="child-outcome child-outcome-header">
    //           {window.gettext('... LOADING')}
    //         </div>
    //       )
    //       this.context.childWorkflowDataNeeded(this.props.data.id)
    //     } else {
    //       if (data.linked_workflow_data.deleted) {
    //         child_outcomes_header = (
    //           <div className="child-outcome child-outcome-header">
    //             {window.gettext('The linked workflow has been deleted.')}
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
            objectID={childOutcome}
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
      <OutcomeNode
        key={outcomenode.id}
        objectID={outcomenode.id}
        // renderer={this.props.renderer}
      />
    ))

    const outcome_restriction =
      this.props.restriction_set.parent_outcomes.filter(
        (oc) => this.props.all_node_outcomes.indexOf(oc) === -1
      )

    let outcomeadder

    if (!this.context.read_only)
      outcomeadder = (
        <OutcomeAdder
          // renderer={this.props.renderer}
          outcome_set={outcome_restriction}
          addFunction={updateOutcomenodeDegree.bind(this, this.props.objectID)}
        />
      )

    const outcomes_for_node = (
      <div>
        <div className="node-outcomes-header">
          {Utility.capWords(
            window.gettext(this.props.workflow.type + ' outcomes')
          ) + window.gettext(' for node:')}
        </div>
        {outcomenodes}
        {outcomeadder}
      </div>
    )

    let add_new_outcome

    if (!this.context.read_only && data.linked_workflow)
      add_new_outcome = (
        <div
          id="add-new-outcome"
          className="menu-create hover-shade"
          onClick={this.addNewChildOutcome.bind(this)}
        >
          <img
            className="create-button"
            src={COURSEFLOW_APP.config.icon_path + 'add_new_white.svg'}
          />
          <div>{window.gettext('Add new')}</div>
        </div>
      )

    if (data.linked_workflow && this.props.restriction_set?.child_outcomes) {
      if (this.state.show_all) {
        show_all = (
          <div className="alignment-added-outcomes">
            {add_new_outcome}
            {outcomes_for_node}
            <div
              className="alignment-show-all"
              onClick={() => this.setState({ show_all: false })}
            >
              {'-' + window.gettext('Hide Unused')}
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
              {'+' + window.gettext('Show All')}
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
      style.outline = '2px solid ' + data.lock.user_colour
    }

    const comments = this.context.view_comments ? <this.AddCommenting /> : ''

    return (
      <div className="node-week">
        <div
          style={style}
          className={'node column-' + data.column}
          onClick={(evt) => selection_manager.changeSelection(evt, this)}
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
    if (state.node[i].id == ownProps.objectID) {
      const node = state.node[i]
      const column = state.column.find((column) => column.id == node.column)
      let outcomenodes = Utility.filterThenSortByID(
        state.outcomenode,
        node.outcomenode_unique_set
      )
      if (
        ownProps.restriction_set &&
        ownProps.restriction_set.parent_outcomes
      ) {
        outcomenodes = outcomenodes.filter(
          (ocn) =>
            ownProps.restriction_set.parent_outcomes.indexOf(ocn.outcome) >= 0
        )
      }
      const node_outcomes = Utility.filterThenSortByID(
        state.outcomenode,
        node.outcomenode_set
      ).map((ocn) => ocn.outcome)

      if (!node.linked_workflow || node.linked_workflow_data.deleted) {
        return {
          workflow: state.workflow,
          data: node,
          column: column,
          child_outcomes: [],
          outcomenodes: outcomenodes,
          all_node_outcomes: node_outcomes
        }
      }

      const child_workflow = getChildWorkflowByID(state, node.linked_workflow)

      let child_outcomes

      if (child_workflow != -1)
        child_outcomes = Utility.filterThenSortByID(
          state.outcomeworkflow,
          child_workflow.data.outcomeworkflow_set
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
