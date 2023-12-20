import * as React from 'react'
import { connect } from 'react-redux'
import { EditableComponentWithActions } from '@cfParentComponents'
import { NodeTitle, TitleText } from '@cfUIComponents'
import { OutcomeNode } from '../WorkflowView'
import { getNodeByID } from '@cfFindState'
import * as Constants from '@cfConstants'
import * as Utility from '@cfUtility'

/**
 * Represents the node in the comparison view
 */
class NodeComparisonUnconnected extends EditableComponentWithActions {
  constructor(props) {
    super(props)
    this.objectType = 'node'
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data
    let data_override

    if (data.represents_workflow) {
      data_override = {
        ...data,
        ...data.linked_workflow_data,
        id: data.id
      }
    } else {
      data_override = { ...data }
    }

    let renderer = this.props.renderer
    let selection_manager = renderer.selection_manager

    let outcomenodes
    if (this.state.show_outcomes)
      outcomenodes = (
        <div
          className={'outcome-node-container column-111111-' + data.column}
          onMouseLeave={() => {
            this.setState({ show_outcomes: false })
          }}
          style={{ borderColor: Constants.getColumnColour(this.props.column) }}
        >
          {data.outcomenode_unique_set.map((outcomenode) => (
            <OutcomeNode
              key={outcomenode}
              objectID={outcomenode}
              renderer={renderer}
            />
          ))}
        </div>
      )
    let side_actions = []
    if (data.outcomenode_unique_set.length > 0) {
      side_actions.push(
        <div className="outcome-node-indicator">
          <div
            className={'outcome-node-indicator-number column-' + data.column}
            onMouseEnter={() => {
              this.setState({ show_outcomes: true })
            }}
            style={{
              borderColor: Constants.getColumnColour(this.props.column)
            }}
          >
            {data.outcomenode_unique_set.length}
          </div>
          {outcomenodes}
        </div>
      )
    }
    let lefticon
    let righticon
    if (data.context_classification > 0)
      lefticon = (
        <img
          title={
            renderer.context_choices.find(
              (obj) => obj.type == data.context_classification
            ).name
          }
          src={
            COURSEFLOW_APP.config.icon_path +
            Constants.context_keys[data.context_classification] +
            '.svg'
          }
        />
      )
    if (data.task_classification > 0)
      righticon = (
        <img
          title={
            renderer.task_choices.find(
              (obj) => obj.type == data.task_classification
            ).name
          }
          src={
            COURSEFLOW_APP.config.icon_path +
            Constants.task_keys[data.task_classification] +
            '.svg'
          }
        />
      )
    let titleText = <NodeTitle data={data} />

    let style = {
      backgroundColor: Constants.getColumnColour(this.props.column)
    }
    if (data.lock) {
      style.outline = '2px solid ' + data.lock.user_colour
    }
    if (Utility.checkSetHidden(data, this.props.object_sets))
      style.display = 'none'
    let css_class =
      'node column-' + data.column + ' ' + Constants.node_keys[data.node_type]
    if (data.lock) css_class += ' locked locked-' + data.lock.user_id

    let mouseover_actions = []
    if (!this.props.renderer.read_only) {
      mouseover_actions.push(this.addInsertSibling(data))
      mouseover_actions.push(this.addDuplicateSelf(data))
      mouseover_actions.push(this.addDeleteSelf(data))
    }
    if (renderer.view_comments) mouseover_actions.push(this.addCommenting(data))

    return (
      <div
        style={style}
        className={css_class}
        id={data.id}
        ref={this.maindiv}
        onClick={(evt) => selection_manager.changeSelection(evt, this)}
      >
        <div className="node-top-row">
          <div className="node-icon">{lefticon}</div>
          {titleText}
          <div className="node-icon">{righticon}</div>
        </div>
        <div className="node-details">
          <TitleText
            text={data_override.description}
            defaultText="Click to edit"
          />
        </div>
        <div className="mouseover-actions">{mouseover_actions}</div>
        {this.addEditable(data_override)}
        <div className="side-actions">{side_actions}</div>
      </div>
    )
  }
}
const mapNodeStateToProps = (state, own_props) =>
  getNodeByID(state, own_props.objectID)
const NodeComparison = connect(
  mapNodeStateToProps,
  null
)(NodeComparisonUnconnected)

export default NodeComparison
