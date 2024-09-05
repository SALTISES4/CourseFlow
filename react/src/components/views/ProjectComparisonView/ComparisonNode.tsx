import { CfObjectType } from '@cf/types/enum'
import { NodeTitle, TitleText } from '@cfComponents/UIPrimitives/Titles'
import * as Constants from '@cfConstants'
import EditableComponentWithActions from '@cfEditableComponents/EditableComponentWithActions'
import {
  EditableComponentWithActionsProps,
  EditableComponentWithActionsState
} from '@cfEditableComponents/EditableComponentWithActions'
import { TGetNodeByID, getNodeByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import * as Utility from '@cfUtility'
import OutcomeNode from '@cfViews/components/OutcomeNode'
import * as React from 'react'
import { connect } from 'react-redux'

type ConnectedProps = TGetNodeByID
type OwnProps = {
  objectId: number
} & EditableComponentWithActionsProps
type StateProps = {
  show_outcomes: boolean
} & EditableComponentWithActionsState
type PropsType = ConnectedProps & OwnProps
import { _t } from '@cf/utility/utilityFunctions'

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
class ComparisonNodeUnconnected extends EditableComponentWithActions<
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
    const selection_manager = this.context.selectionManager

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
            <OutcomeNode key={outcomenode} objectId={outcomenode} />
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
            this.context.workflow.choices.context_choices.find(
              (obj) => obj.type == data.context_classification
            ).name
          }
          src={
            COURSEFLOW_APP.globalContextData.path.static_assets.icon +
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
            this.context.workflow.choices.task_choices.find(
              (obj) => obj.type == data.task_classification
            ).name
          }
          src={
            COURSEFLOW_APP.globalContextData.path.static_assets.icon +
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
    if (!this.context.permissions.workflowPermission.readOnly) {
      mouseover_actions.push(<this.AddInsertSibling data={data} />)
      mouseover_actions.push(<this.AddDuplicateSelf data={data} />)
      mouseover_actions.push(<this.AddDeleteSelf data={data} />)
    }
    if (this.context.workflow.view_comments) {
      mouseover_actions.push(<this.AddCommenting />)
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
              defaultText={_t('Click to edit')}
            />
          </div>
          <div className="mouseover-actions">{mouseover_actions}</div>
          <div className="side-actions">{side_actions}</div>
        </div>
      </>
    )
  }
}
const mapStateToProps = (state: AppState, ownProps: OwnProps): TGetNodeByID => {
  return getNodeByID(state, ownProps.objectId)
}

const ComparisonNode = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(ComparisonNodeUnconnected)

export default ComparisonNode
