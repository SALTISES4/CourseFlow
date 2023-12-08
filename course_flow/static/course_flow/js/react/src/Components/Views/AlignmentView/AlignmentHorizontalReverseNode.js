import * as React from 'react'
import * as reactDom from 'react-dom'
import { Provider, connect } from 'react-redux'
import {
  EditableComponentWithComments,
  NodeTitle
} from '../../components/CommonComponents'
import { getChildWorkflowByID } from '../../../redux/FindState.js'
import OutcomeNodeView from '../../components/OutcomeNode.js'
import { newOutcome, updateOutcomenodeDegree } from '../../../PostFunctions.js'
import * as Utility from '../../../UtilityFunctions.js'
import * as Constants from '../../../Constants.js'
import AlignmentHorizontalReverseChildOutcome from './AlignmentHorizontalReverseChildOutcome.js'
import OutcomeAdder from './OutcomeAdder.js'

/**
 * The representation of a node in the alignment view. It will display
 * the outcomes that the child workflow has that have the required parent outcomes
 * tagged to them
 */
class AlignmentHorizontalReverseNode extends EditableComponentWithComments {
  constructor(props) {
    super(props)
    this.objectType = 'node'
    this.state = {}
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  /**
   * Adds a new outcome to the linked workflow
   */
  addNewChildOutcome() {
    newOutcome(this.props.data.linked_workflow, null)
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data
    let data_override
    if (data.represents_workflow)
      data_override = { ...data, ...data.linked_workflow_data, id: data.id }
    else data_override = { ...data }
    let selection_manager = this.props.renderer.selection_manager
    let child_outcomes_header
    if (this.props.child_outcomes.length > 0) {
      child_outcomes_header = (
        <div className="child-outcome child-outcome-header">
          <div className="half-width alignment-column">
            {Utility.capWords(
              gettext(data.linked_workflow_data.type + ' outcomes')
            ) + gettext(' From Linked Workflow')}
          </div>
          <div className="half-width alignment-column">
            {gettext('Associated ') +
              Utility.capWords(gettext(this.props.workflow.type + ' outcomes'))}
          </div>
        </div>
      )
    } else {
      if (data.linked_workflow) {
        if (this.props.child_outcomes == -1) {
          child_outcomes_header = (
            <div className="child-outcome child-outcome-header">
              {gettext('... LOADING')}
            </div>
          )
          this.props.renderer.childWorkflowDataNeeded(this.props.data.id)
        } else {
          if (data.linked_workflow_data.deleted) {
            child_outcomes_header = (
              <div className="child-outcome child-outcome-header">
                {gettext('The linked workflow has been deleted.')}
              </div>
            )
          } else {
            child_outcomes_header = (
              <div className="child-outcome child-outcome-header">
                {gettext(
                  'No outcomes have been added to the linked workflow. When added, they will appear here.'
                )}
              </div>
            )
          }
        }
      } else {
        child_outcomes_header = (
          <div className="child-outcome child-outcome-header">
            {gettext(
              'No workflow has been linked to this node. If you link a workflow, its outcomes will appear here.'
            )}
          </div>
        )
      }
    }
    let child_outcomes
    if (this.props.child_outcomes != -1)
      child_outcomes = this.props.child_outcomes.map((child_outcome) => {
        if (
          !this.state.show_all &&
          this.props.restriction_set &&
          this.props.restriction_set.child_outcomes &&
          this.props.restriction_set.child_outcomes.indexOf(child_outcome) == -1
        )
          return null
        return (
          <AlignmentHorizontalReverseChildOutcome
            objectID={child_outcome}
            node_data={data}
            renderer={this.props.renderer}
            restriction_set={this.props.restriction_set}
          />
        )
      })

    let show_all

    //if child outcomes are restricted, we need a show all button that expands to show all of them instead. Otherwise we only need to show the outcomes currently attached to the node.
    let outcomenodes = this.props.outcomenodes.map((outcomenode) => (
      <OutcomeNodeView
        key={outcomenode.id}
        objectID={outcomenode.id}
        renderer={this.props.renderer}
      />
    ))
    let outcome_restriction = this.props.restriction_set.parent_outcomes.filter(
      (oc) => this.props.all_node_outcomes.indexOf(oc) == -1
    )
    let outcomeadder
    if (!this.props.renderer.read_only)
      outcomeadder = (
        <OutcomeAdder
          renderer={this.props.renderer}
          outcome_set={outcome_restriction}
          addFunction={updateOutcomenodeDegree.bind(this, this.props.objectID)}
        />
      )
    let outcomes_for_node = (
      <div>
        <div className="node-outcomes-header">
          {Utility.capWords(gettext(this.props.workflow.type + ' outcomes')) +
            gettext(' for node:')}
        </div>
        {outcomenodes}
        {outcomeadder}
      </div>
    )
    let add_new_outcome
    if (!this.props.renderer.read_only && data.linked_workflow)
      add_new_outcome = (
        <div
          id="add-new-outcome"
          className="menu-create hover-shade"
          onClick={this.addNewChildOutcome.bind(this)}
        >
          <img
            className="create-button"
            src={config.icon_path + 'add_new_white.svg'}
          />
          <div>{gettext('Add new')}</div>
        </div>
      )
    if (
      data.linked_workflow &&
      this.props.restriction_set &&
      this.props.restriction_set.child_outcomes
    ) {
      if (this.state.show_all) {
        show_all = (
          <div className="alignment-added-outcomes">
            {add_new_outcome}
            {outcomes_for_node}
            <div
              className="alignment-show-all"
              onClick={() => this.setState({ show_all: false })}
            >
              {'-' + gettext('Hide Unused')}
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
              {'+' + gettext('Show All')}
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

    let style = {
      backgroundColor: Constants.getColumnColour(this.props.column)
    }
    if (data.lock) {
      style.outline = '2px solid ' + data.lock.user_colour
    }

    let comments
    if (this.props.renderer.view_comments) comments = this.addCommenting()

    return (
      <div className="node-week">
        <div
          style={style}
          className={'node column-' + data.column}
          onClick={(evt) => selection_manager.changeSelection(evt, this)}
          ref={this.maindiv}
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

const mapAlignmentHorizontalReverseNodeStateToProps = (state, own_props) => {
  for (var i = 0; i < state.node.length; i++) {
    if (state.node[i].id == own_props.objectID) {
      let node = state.node[i]
      let column = state.column.find((column) => column.id == node.column)
      let outcomenodes = Utility.filterThenSortByID(
        state.outcomenode,
        node.outcomenode_unique_set
      )
      if (
        own_props.restriction_set &&
        own_props.restriction_set.parent_outcomes
      ) {
        outcomenodes = outcomenodes.filter(
          (ocn) =>
            own_props.restriction_set.parent_outcomes.indexOf(ocn.outcome) >= 0
        )
      }
      let node_outcomes = Utility.filterThenSortByID(
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
      let child_workflow = getChildWorkflowByID(state, node.linked_workflow)
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
export default connect(
  mapAlignmentHorizontalReverseNodeStateToProps,
  null
)(AlignmentHorizontalReverseNode)
