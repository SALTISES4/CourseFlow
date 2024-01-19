import * as React from 'react'
import { connect } from 'react-redux'
import { EditableComponentWithActions } from '@cfParentComponents'
import { NodeTitle, TitleText } from '@cfUIComponents'
import { getNodeByID, GetNodeByIDType } from '@cfFindState'
import * as Constants from '@cfConstants'
import * as Utility from '@cfUtility'
import { AppState } from '@cfRedux/type'
import {
  EditableComponentWithActionsProps,
  EditableComponentWithActionsState
} from '@cfParentComponents/EditableComponentWithActions'
import OutcomeNode from '@cfViews/WorkflowView/OutcomeNode'
import { CfObjectType } from '@cfModule/types/enum'

type ConnectedProps = GetNodeByIDType
type OwnProps = {
  objectID: number
} & EditableComponentWithActionsProps
type StateProps = {
  show_outcomes: boolean
} & EditableComponentWithActionsState
type PropsType = ConnectedProps & OwnProps

/**
 * Represents the node in the comparison view
 */

/**
 * renderer.selection_manager
 * renderer.view_comments
 * renderer.context_choices
 * renderer.task_choices
 * renderer.read_only
 */
class NodeComparisonUnconnected extends EditableComponentWithActions<
  PropsType,
  StateProps
> {
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.NODE
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const side_actions = []
    let data_override
    let lefticon
    let righticon

    const data = this.props.data

    if (data.represents_workflow) {
      data_override = {
        ...data,
        ...data.linked_workflow_data,
        id: data.id
      }
    } else {
      data_override = { ...data }
    }
    const selection_manager = this.context.selection_manager

    const style: React.CSSProperties = {
      backgroundColor: Constants.getColumnColour(this.props.column)
    }
    if (data.lock) {
      style.outline = '2px solid ' + data.lock.user_colour
    }
    if (Utility.checkSetHidden(data, this.props.object_sets)) {
      style.display = 'none'
    }

    let outcomenodes
    if (this.state.show_outcomes)
      outcomenodes = (
        <div
          className={'outcome-node-container column-111111-' + data.column}
          onMouseLeave={() => {
            this.setState({
              show_outcomes: false
            })
          }}
          style={{ borderColor: Constants.getColumnColour(this.props.column) }}
        >
          {data.outcomenode_unique_set.map((outcomenode) => (
            <OutcomeNode
              key={outcomenode}
              objectID={outcomenode}
              //legacyRenderer={this.props.legacyRenderer}
            />
          ))}
        </div>
      )

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

    if (data.context_classification > 0) {
      lefticon = (
        <img
          title={
            this.context.context_choices.find(
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
    }

    if (data.task_classification > 0) {
      righticon = (
        <img
          title={
            this.context.task_choices.find(
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
    }

    const titleText = <NodeTitle data={data} />

    // let css_class =
    //   'node column-' + data.column + ' ' + Constants.node_keys[data.node_type]
    // if (data.lock) css_class += ' locked locked-' + data.lock.user_id

    const cssClasses = [
      'node column-' + data.column + ' ' + Constants.node_keys[data.node_type],
      data.lock ? 'locked locked-' + data.lock.user_id : ''
    ].join(' ')

    const mouseover_actions = []
    if (!this.context.read_only) {
      mouseover_actions.push(this.addInsertSibling(data))
      mouseover_actions.push(this.addDuplicateSelf(data))
      mouseover_actions.push(this.addDeleteSelf(data))
    }
    if (this.context.view_comments) {
      mouseover_actions.push(this.addCommenting())
    }

    return (
      <>
        {this.addEditable(data_override)}
        <div
          style={style}
          className={cssClasses}
          id={data.id}
          ref={this.mainDiv}
          onClick={(evt) => {
            console.log('clicked')
            return () => selection_manager.changeSelection(evt, this)
          }}
        >
          <div className="node-top-row">
            <div className="node-icon">{lefticon}</div>
            {titleText}
            <div className="node-icon">{righticon}</div>
          </div>
          <div className="node-details">
            <TitleText
              text={data_override.description}
              defaultText={window.gettext('Click to edit')}
            />
          </div>
          <div className="mouseover-actions">{mouseover_actions}</div>
          <div className="side-actions">{side_actions}</div>
        </div>
      </>
    )
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): GetNodeByIDType => {
  return getNodeByID(state, ownProps.objectID)
}

const NodeComparison = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(NodeComparisonUnconnected)

export default NodeComparison
